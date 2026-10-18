import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { MediaService } from '../src/modules/media/media.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { RedisService } from '../src/redis/redis.service';

describe('Newsletter API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  const emailQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };
  const origin = 'http://localhost:3001';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailQueueService)
      .useValue(emailQueue)
      .overrideProvider(TurnstileService)
      .useValue({ verify: jest.fn().mockResolvedValue(true) })
      .overrideProvider(MediaService)
      .useValue({
        assertCloudinaryUrl: jest.fn(),
        assertAttachableUploads: jest.fn().mockResolvedValue(undefined),
        markAttached: jest.fn().mockResolvedValue(undefined),
        scheduleDeletion: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app, app.get<ConfigService<AppConfig, true>>(ConfigService));
    await app.init();
    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  beforeEach(async () => {
    await prisma.newsletterSubscriber.deleteMany({ where: { email: { endsWith: '@newsletter.test' } } });
    const keys = await redis.getClient().keys('newsletter:rl:*');
    if (keys.length) await redis.getClient().del(...keys);
    emailQueue.enqueue.mockClear();
  });

  afterAll(async () => app.close());

  const subscribe = (email: string) =>
    request(app.getHttpServer())
      .post('/api/v1/newsletter/subscriptions')
      .set('Origin', origin)
      .send({ email });

  function tokenFromQueuedEmail(path: 'confirm' | 'unsubscribe') {
    const html = emailQueue.enqueue.mock.calls.at(-1)?.[0]?.html as string;
    const match = html.match(new RegExp(`/newsletter/subscriptions/${path}\\?token=([^"&]+)`));
    expect(match?.[1]).toBeTruthy();
    return decodeURIComponent(match![1]);
  }

  it('requires confirmation before activating, then allows one-click unsubscribe', async () => {
    const email = 'cook@example.newsletter.test';

    await subscribe(email).expect(202).expect({
      accepted: true,
      message: 'Check your inbox to confirm your subscription.',
    });
    expect(emailQueue.enqueue).toHaveBeenCalledTimes(1);

    const pending = await prisma.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(pending).toMatchObject({ isActive: false, source: 'footer', confirmedAt: null });
    expect(pending.confirmationTokenHash).toHaveLength(64);

    const confirmToken = tokenFromQueuedEmail('confirm');
    await request(app.getHttpServer())
      .get(`/api/v1/newsletter/subscriptions/confirm?token=${encodeURIComponent(confirmToken)}`)
      .expect(302)
      .expect('Location', 'http://localhost:3001/?newsletter=confirmed');

    const active = await prisma.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(active.isActive).toBe(true);
    expect(active.confirmedAt).toBeInstanceOf(Date);
    expect(active.confirmationTokenHash).toBeNull();

    await request(app.getHttpServer())
      .get(`/api/v1/newsletter/subscriptions/confirm?token=${encodeURIComponent(confirmToken)}`)
      .expect(401);

    const unsubscribeToken = tokenFromQueuedEmail('unsubscribe');
    await request(app.getHttpServer())
      .get(`/api/v1/newsletter/subscriptions/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`)
      .expect(302)
      .expect('Location', 'http://localhost:3001/?newsletter=unsubscribed');

    const unsubscribed = await prisma.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(unsubscribed.isActive).toBe(false);
    expect(unsubscribed.unsubscribedAt).toBeInstanceOf(Date);
  });

  it('keeps one row per email and does not re-send to an active subscriber', async () => {
    const email = 'duplicate@example.newsletter.test';
    await subscribe(email).expect(202);
    const firstToken = tokenFromQueuedEmail('confirm');

    await subscribe(email).expect(202);
    expect(await prisma.newsletterSubscriber.count({ where: { email } })).toBe(1);
    expect(emailQueue.enqueue).toHaveBeenCalledTimes(2);

    const currentToken = tokenFromQueuedEmail('confirm');
    await request(app.getHttpServer())
      .get(`/api/v1/newsletter/subscriptions/confirm?token=${encodeURIComponent(firstToken)}`)
      .expect(401);
    await request(app.getHttpServer())
      .get(`/api/v1/newsletter/subscriptions/confirm?token=${encodeURIComponent(currentToken)}`)
      .expect(302);

    await subscribe(email).expect(202);
    expect(await prisma.newsletterSubscriber.count({ where: { email } })).toBe(1);
    expect(emailQueue.enqueue).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid input, untrusted origins, and excessive confirmation requests', async () => {
    await subscribe('not-an-email').expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/newsletter/subscriptions')
      .set('Origin', 'https://untrusted.example')
      .send({ email: 'origin@example.newsletter.test' })
      .expect(403);

    const email = 'limited@example.newsletter.test';
    await subscribe(email).expect(202);
    await subscribe(email).expect(202);
    await subscribe(email).expect(202);
    await subscribe(email).expect(429);
  });
});
