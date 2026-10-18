import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { NotificationType, RecipeStatus, StoryStatus, UserRole } from '@prisma/client';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { MediaService } from '../src/modules/media/media.service';
import { NotificationDigestService } from '../src/modules/notifications/notification-digest.service';
import { NotificationCleanupService } from '../src/modules/notifications/notification-cleanup.service';
import { NotificationRealtimeService } from '../src/modules/notifications/notification-realtime.service';
import { RedisService } from '../src/redis/redis.service';

describe('Notifications API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;
  let digest: NotificationDigestService;
  let cleanup: NotificationCleanupService;
  let realtime: NotificationRealtimeService;
  let redis: RedisService;
  const emailQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };

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
    jwt = app.get(JwtService);
    config = app.get(ConfigService);
    digest = app.get(NotificationDigestService);
    cleanup = app.get(NotificationCleanupService);
    realtime = app.get(NotificationRealtimeService);
    redis = app.get(RedisService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@notifications.test' } } });
    emailQueue.enqueue.mockClear();
  });

  afterAll(async () => app.close());

  async function createUser(label: string) {
    const user = await prisma.user.create({
      data: {
        name: label,
        username: `${label}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
        email: `${label}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}@notifications.test`,
        emailVerified: new Date(),
      },
    });
    const token = await jwt.signAsync(
      { sub: user.id, email: user.email, role: UserRole.USER },
      { secret: config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn: 900 },
    );
    return { user, token };
  }

  const auth = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Origin: 'http://localhost:3001',
  });

  it('creates one follow notification, protects it, and marks it as read', async () => {
    const owner = await createUser('owner');
    const actor = await createUser('actor');

    await request(app.getHttpServer()).get('/api/v1/notifications').expect(401);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${owner.user.id}/follow`)
      .set(auth(actor.token))
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${owner.user.id}/follow`)
      .set(auth(actor.token))
      .send({})
      .expect(200);

    const inbox = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set(auth(owner.token))
      .expect(200);
    expect(inbox.body.unreadCount).toBe(1);
    expect(inbox.body.notifications).toHaveLength(1);
    expect(inbox.body.notifications[0]).toMatchObject({
      type: 'FOLLOW',
      actor: { id: actor.user.id, name: actor.user.name },
      readAt: null,
    });

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${inbox.body.notifications[0].id}/read`)
      .set(auth(actor.token))
      .send({})
      .expect(404);

    const read = await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${inbox.body.notifications[0].id}/read`)
      .set(auth(owner.token))
      .send({})
      .expect(200);
    expect(read.body.unreadCount).toBe(0);
  });

  it('notifies the right people about recipe and story activity without self-notifications', async () => {
    const owner = await createUser('creator');
    const actor = await createUser('visitor');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Notification pasta',
        slug: 'notification-pasta',
        authorId: owner.user.id,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: [],
        moreImages: [],
      },
    });
    const story = await prisma.story.create({
      data: {
        title: 'Notification kitchen story',
        slug: 'notification-kitchen-story',
        authorId: owner.user.id,
        status: StoryStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: [],
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/like`)
      .set(auth(actor.token))
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments`)
      .set(auth(actor.token))
      .send({ content: 'This looks great.' })
      .expect(201);
    const review = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(actor.token))
      .send({ stars: 5, text: 'Made it twice and loved it.' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}/reviews/${review.body.review.id}/reply`)
      .set(auth(owner.token))
      .send({ reply: 'Thank you for cooking it!' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/stories/${story.id}/like`)
      .set(auth(actor.token))
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/stories/${story.id}/comments`)
      .set(auth(actor.token))
      .send({ content: 'Beautiful story.' })
      .expect(201);

    const ownerInbox = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set(auth(owner.token))
      .expect(200);
    expect(ownerInbox.body.notifications.map((item: { type: string }) => item.type)).toEqual(
      expect.arrayContaining(['RECIPE_LIKE', 'RECIPE_COMMENT', 'RECIPE_REVIEW', 'STORY_LIKE', 'STORY_COMMENT']),
    );
    expect(ownerInbox.body.notifications).toHaveLength(5);

    const actorInbox = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set(auth(actor.token))
      .expect(200);
    expect(actorInbox.body.notifications).toHaveLength(1);
    expect(actorInbox.body.notifications[0]).toMatchObject({ type: 'RECIPE_REVIEW_REPLY' });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/like`)
      .set(auth(actor.token))
      .send({})
      .expect(200);
    expect(await prisma.notification.count({ where: { recipientId: owner.user.id, type: 'RECIPE_LIKE' } })).toBe(1);
  });

  it('respects in-app notification preferences without changing account security settings', async () => {
    const owner = await createUser('quiet_owner');
    const actor = await createUser('quiet_actor');

    await request(app.getHttpServer())
      .patch('/api/v1/profile/notifications')
      .set(auth(owner.token))
      .send({ in_app_follows: false })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${owner.user.id}/follow`)
      .set(auth(actor.token))
      .send({})
      .expect(200);

    expect(await prisma.notification.count({ where: { recipientId: owner.user.id } })).toBe(0);
    const preferences = await prisma.user.findUniqueOrThrow({
      where: { id: owner.user.id },
      select: { notificationPreferences: true },
    });
    expect(preferences.notificationPreferences).toMatchObject({ in_app_follows: false });
  });

  it('pages notification history and filters unread activity', async () => {
    const owner = await createUser('paged_owner');
    const firstActor = await createUser('paged_actor_one');
    const secondActor = await createUser('paged_actor_two');
    const thirdActor = await createUser('paged_actor_three');

    for (const actor of [firstActor, secondActor, thirdActor]) {
      await request(app.getHttpServer())
        .post(`/api/v1/profiles/${owner.user.id}/follow`)
        .set(auth(actor.token))
        .send({})
        .expect(200);
    }

    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/notifications?page=1&limit=2')
      .set(auth(owner.token))
      .expect(200);
    expect(firstPage.body).toMatchObject({ page: 1, limit: 2, total: 3, unreadCount: 3, hasMore: true });
    expect(firstPage.body.notifications).toHaveLength(2);

    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${firstPage.body.notifications[0].id}/read`)
      .set(auth(owner.token))
      .send({})
      .expect(200);

    const unread = await request(app.getHttpServer())
      .get('/api/v1/notifications?unreadOnly=true&page=1&limit=20')
      .set(auth(owner.token))
      .expect(200);
    expect(unread.body).toMatchObject({ total: 2, unreadCount: 2, hasMore: false });
    expect(unread.body.notifications).toHaveLength(2);
    expect(unread.body.notifications.every((item: { readAt: string | null }) => item.readAt === null)).toBe(true);
  });

  it('caches unread counts, broadcasts live activity, and removes only expired read notifications', async () => {
    const owner = await createUser('realtime_owner');
    const actor = await createUser('realtime_actor');
    const received: Array<{ type?: string; data?: unknown }> = [];
    const subscription = realtime.stream(owner.user.id, 0).subscribe((event) => received.push(event));

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${owner.user.id}/follow`)
      .set(auth(actor.token))
      .send({})
      .expect(200);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(received).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'notification.created',
          data: expect.objectContaining({ unreadCount: 1 }),
        }),
      ]),
    );

    const cacheKey = `cooktale:notifications:unread:v1:${owner.user.id}`;
    expect(await redis.getClient().get(cacheKey)).toBe('1');

    const notification = await prisma.notification.findFirstOrThrow({
      where: { recipientId: owner.user.id },
      select: { id: true },
    });
    await request(app.getHttpServer())
      .patch(`/api/v1/notifications/${notification.id}/read`)
      .set(auth(owner.token))
      .send({})
      .expect(200)
      .expect({ unreadCount: 0 });
    expect(await redis.getClient().get(cacheKey)).toBe('0');

    const expiredRead = await prisma.notification.create({
      data: {
        recipientId: owner.user.id,
        type: NotificationType.SYSTEM,
        readAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000),
      },
    });
    const oldUnread = await prisma.notification.create({
      data: {
        recipientId: owner.user.id,
        type: NotificationType.SYSTEM,
        createdAt: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000),
      },
    });
    await expect(cleanup.deleteExpiredReadNotifications()).resolves.toEqual({ deleted: 1 });
    expect(await prisma.notification.findUnique({ where: { id: expiredRead.id } })).toBeNull();
    expect(await prisma.notification.findUnique({ where: { id: oldUnread.id } })).not.toBeNull();
    subscription.unsubscribe();
  });

  it('queues one safe daily digest only for users who explicitly enable it', async () => {
    const owner = await createUser('digest_owner');
    const actor = await createUser('digest_actor');
    const now = new Date();
    now.setUTCHours(12, 0, 0, 0);
    const notificationTime = new Date(now.getTime() - 60_000);

    await prisma.user.update({
      where: { id: owner.user.id },
      data: {
        timezone: 'UTC',
        notificationPreferences: { email_activity_digest: true },
        lastNotificationDigestAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
      },
    });
    await prisma.user.update({
      where: { id: actor.user.id },
      data: { name: '<script>alert(1)</script>' },
    });
    await prisma.notification.create({
      data: {
        recipientId: owner.user.id,
        actorId: actor.user.id,
        type: NotificationType.FOLLOW,
        targetPath: `/profile/${actor.user.username}`,
        createdAt: notificationTime,
      },
    });

    await expect(digest.processEligibleDigests(now)).resolves.toEqual({ scanned: 1, enqueued: 1 });
    expect(emailQueue.enqueue).toHaveBeenCalledTimes(1);
    const [email, options] = emailQueue.enqueue.mock.calls[0];
    expect(email).toMatchObject({
      to: owner.user.email,
      notificationDigestUserId: owner.user.id,
      subject: 'Your CookTale activity: 1 new update',
    });
    expect(email.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(email.html).not.toContain('<script>alert(1)</script>');
    expect(options).toEqual({ jobId: expect.stringContaining(`notification-digest:${owner.user.id}:`) });

    await prisma.user.update({ where: { id: owner.user.id }, data: { lastNotificationDigestAt: now } });
    await expect(digest.processEligibleDigests(now)).resolves.toEqual({ scanned: 1, enqueued: 0 });
  });

  it('protects browser subscriptions and never exposes the VAPID private key', async () => {
    const owner = await createUser('push_owner');
    const endpoint = `https://push.example.test/subscriptions/${owner.user.id}`;

    await request(app.getHttpServer()).get('/api/v1/notifications/push/config').expect(401);

    const configResponse = await request(app.getHttpServer())
      .get('/api/v1/notifications/push/config')
      .set(auth(owner.token))
      .expect(200);
    expect(configResponse.body).toMatchObject({ enabled: true, publicKey: expect.any(String) });
    expect(JSON.stringify(configResponse.body)).not.toContain('private');

    await request(app.getHttpServer())
      .post('/api/v1/notifications/push/subscriptions')
      .set(auth(owner.token))
      .send({ endpoint, p256dh: 'test-p256dh-key', auth: 'test-auth-key', expirationTime: null })
      .expect(200)
      .expect({ subscribed: true });

    expect(await prisma.pushSubscription.count({ where: { userId: owner.user.id, endpoint } })).toBe(1);

    await request(app.getHttpServer())
      .delete('/api/v1/notifications/push/subscriptions')
      .set(auth(owner.token))
      .send({ endpoint })
      .expect(200)
      .expect({ subscribed: false });
    expect(await prisma.pushSubscription.count({ where: { userId: owner.user.id, endpoint } })).toBe(0);
  });
});
