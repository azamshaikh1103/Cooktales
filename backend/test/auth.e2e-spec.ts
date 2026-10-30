import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import type { AppConfig } from '../src/config/env.validation';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { RedisService } from '../src/redis/redis.service';

type QueuedEmail = {
  to: string;
  subject: string;
  html: string;
};

const trustedOrigin = 'http://localhost:3001';
const validPassword = 'Password123';

function getCookie(response: request.Response) {
  const header = response.headers['set-cookie'];
  const cookies = Array.isArray(header) ? header : header ? [header] : [];
  return cookies.find((cookie) => cookie.startsWith('refreshToken='));
}

function latestEmail(enqueue: jest.Mock): QueuedEmail {
  const call = enqueue.mock.calls.at(-1);
  if (!call) throw new Error('Expected an email job');
  return call[0] as QueuedEmail;
}

function verificationCode(email: QueuedEmail) {
  const match = email.html.match(/>\s*(\d{6})\s*</);
  if (!match) throw new Error('Verification code not found in queued email');
  return match[1];
}

function passwordResetToken(email: QueuedEmail) {
  const match = email.html.match(/reset-password\?token=([a-f0-9]+)(?:&|&amp;)email=/);
  if (!match) throw new Error('Password reset token not found in queued email');
  return match[1];
}

function adminMagicLink(email: QueuedEmail) {
  const match = email.html.match(/auth\/complete\?email=([^&"']+)&amp;token=([^"']+)/);
  if (!match) throw new Error('Admin magic link not found in queued email');
  return { email: decodeURIComponent(match[1]), token: match[2] };
}

describe('Authentication API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  const enqueue = jest.fn<Promise<void>, [QueuedEmail]>().mockResolvedValue(undefined);
  const verifyTurnstile = jest.fn<Promise<boolean>, [string?, string?]>().mockResolvedValue(true);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailQueueService)
      .useValue({ enqueue })
      .overrideProvider(TurnstileService)
      .useValue({ verify: verifyTurnstile })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app, app.get<ConfigService<AppConfig, true>>(ConfigService));
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@example.test' } } });
    await redis.getClient().flushdb();
    enqueue.mockClear();
    verifyTurnstile.mockReset().mockResolvedValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createVerifiedUser(email: string, password = validPassword) {
    return prisma.user.create({
      data: {
        name: 'Test User',
        email,
        username: email.split('@')[0].replace(/[^a-z0-9]/g, '-'),
        password: await hash(password, 12),
        emailVerified: new Date(),
      },
    });
  }

  function login(email: string, password = validPassword) {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', trustedOrigin)
      .send({ email, password, turnstileToken: 'test-token' });
  }

  it('rejects missing origins, untrusted origins, and unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.test', password: validPassword, turnstileToken: 'test-token' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ email: 'user@example.test', password: validPassword, turnstileToken: 'test-token' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', trustedOrigin)
      .send({
        email: 'user@example.test',
        password: validPassword,
        turnstileToken: 'test-token',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('registers, blocks unverified login, verifies the OTP, and returns a safe user', async () => {
    const email = 'signup@example.test';

    const signup = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .set('Origin', trustedOrigin)
      .send({ name: 'Signup User', email, password: validPassword, turnstileToken: 'test-token' })
      .expect(201);

    expect(signup.body.user).toMatchObject({ email, name: 'Signup User' });
    expect(signup.body.user).not.toHaveProperty('password');
    expect(signup.body).not.toHaveProperty('refreshToken');

    await login(email).expect(401);
    const code = verificationCode(latestEmail(enqueue));

    await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .set('Origin', trustedOrigin)
      .send({ email, code })
      .expect(200);

    const authenticated = await login(email).expect(200);
    expect(authenticated.body).toHaveProperty('accessToken');
    expect(authenticated.body).not.toHaveProperty('refreshToken');
    expect(authenticated.body.user).not.toHaveProperty('password');
    expect(getCookie(authenticated)).toContain('HttpOnly');

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authenticated.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.user.email).toBe(email);
        expect(body.user).not.toHaveProperty('password');
      });
  });

  it('rotates refresh tokens, rejects replay, and revokes logout sessions', async () => {
    const email = 'sessions@example.test';
    await createVerifiedUser(email);

    const authenticated = await login(email).expect(200);
    const oldCookie = getCookie(authenticated);
    expect(oldCookie).toBeDefined();

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', trustedOrigin)
      .set('Cookie', oldCookie as string)
      .send({})
      .expect(200);

    const newCookie = getCookie(refreshed);
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toBe(oldCookie);
    expect(refreshed.body).not.toHaveProperty('refreshToken');

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', trustedOrigin)
      .set('Cookie', oldCookie as string)
      .send({})
      .expect(401);

    const loggedOut = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', trustedOrigin)
      .set('Cookie', newCookie as string)
      .send({})
      .expect(200);

    expect(getCookie(loggedOut)).toContain('Path=/api/v1/auth');

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', trustedOrigin)
      .set('Cookie', newCookie as string)
      .send({})
      .expect(401);
  });

  it('uses a single-use reset token and revokes existing sessions', async () => {
    const email = 'reset@example.test';
    await createVerifiedUser(email);
    const authenticated = await login(email).expect(200);
    const oldCookie = getCookie(authenticated) as string;

    await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .set('Origin', trustedOrigin)
      .send({ email, turnstileToken: 'test-token' })
      .expect(200);

    const token = passwordResetToken(latestEmail(enqueue));
    const newPassword = 'NewPassword456';

    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .set('Origin', trustedOrigin)
      .send({ email, token, password: newPassword })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password')
      .set('Origin', trustedOrigin)
      .send({ email, token, password: newPassword })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Origin', trustedOrigin)
      .set('Cookie', oldCookie)
      .send({})
      .expect(401);

    await login(email, newPassword).expect(200);
  });

  it('does not reveal whether a password-reset account exists', async () => {
    const callsBefore = enqueue.mock.calls.length;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password')
      .set('Origin', trustedOrigin)
      .send({ email: 'missing@example.test', turnstileToken: 'test-token' })
      .expect(200);

    expect(response.body).toEqual({ success: true });
    expect(enqueue).toHaveBeenCalledTimes(callsBefore);
  });

  it('sends an approved administrator a single-use email link without Turnstile', async () => {
    const email = 'admin@example.test';

    await request(app.getHttpServer())
      .post('/api/v1/auth/admin/magic-link')
      .set('Origin', trustedOrigin)
      .send({ email })
      .expect(200)
      .expect({ success: true });

    expect(verifyTurnstile).not.toHaveBeenCalled();
    const link = adminMagicLink(latestEmail(enqueue));

    const authenticated = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/magic-link/consume')
      .set('Origin', trustedOrigin)
      .send(link)
      .expect(200);

    expect(authenticated.body.user).toMatchObject({ email, role: 'ADMIN' });
    expect(getCookie(authenticated)).toContain('HttpOnly');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authenticated.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.user.role).toBe('ADMIN'));

    await request(app.getHttpServer())
      .post('/api/v1/auth/admin/magic-link/consume')
      .set('Origin', trustedOrigin)
      .send(link)
      .expect(400);
  });

  it('blocks login after five wrong passwords', async () => {
    const email = 'lockout@example.test';
    await createVerifiedUser(email);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(email, 'WrongPassword123').expect(401);
    }

    await login(email, validPassword).expect(429);
  });

  it('rejects failed Turnstile checks and injection-shaped input', async () => {
    verifyTurnstile.mockResolvedValueOnce(false);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', trustedOrigin)
      .send({ email: 'user@example.test', password: validPassword })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', trustedOrigin)
      .send({
        email: "' OR 1=1 --",
        password: validPassword,
        turnstileToken: 'test-token',
      })
      .expect(400);
  });
});
