import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { EmailUnsubscribeService } from '../src/modules/auth/mailer/email-unsubscribe.service';
import { MediaService } from '../src/modules/media/media.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { RedisService } from '../src/redis/redis.service';

describe('Newsletter API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let emailUnsubscribe: EmailUnsubscribeService;
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
    emailUnsubscribe = app.get(EmailUnsubscribeService);
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

  it('activates a subscriber immediately, then allows one-click unsubscribe', async () => {
    const email = 'cook@example.newsletter.test';

    await subscribe(email).expect(202).expect({
      accepted: true,
      message: 'You are subscribed to CookTale.',
    });
    expect(emailQueue.enqueue).not.toHaveBeenCalled();

    const active = await prisma.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(active).toMatchObject({ isActive: true, source: 'footer' });
    expect(active.confirmedAt).toBeInstanceOf(Date);
    expect(active.confirmationTokenHash).toBeNull();

    const unsubscribeToken = emailUnsubscribe.createNewsletterUrl(active.id).split('token=')[1]!;
    await request(app.getHttpServer())
      .get(`/api/v1/newsletter/subscriptions/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`)
      .expect(302)
      .expect('Location', 'http://localhost:3001/?newsletter=unsubscribed');

    const unsubscribed = await prisma.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
    expect(unsubscribed.isActive).toBe(false);
    expect(unsubscribed.unsubscribedAt).toBeInstanceOf(Date);
  });

  it('keeps one row per email and does not change an active subscriber', async () => {
    const email = 'duplicate@example.newsletter.test';
    await subscribe(email).expect(202);

    await subscribe(email).expect(202);
    expect(await prisma.newsletterSubscriber.count({ where: { email } })).toBe(1);
    expect(emailQueue.enqueue).not.toHaveBeenCalled();
  });

  it('rejects invalid input, untrusted origins, and excessive signup requests', async () => {
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
