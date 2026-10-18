import { Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { AccountStatus, NotificationType, Prisma } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import webpush from 'web-push';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import type { CreatePushSubscriptionDto } from './dto/notification.dto';

type PushJob = { notificationId: string; subscriptionId: string };

const QUEUE_NAME = 'notification-push';
const MAX_SUBSCRIPTIONS_PER_USER = 5;

@Injectable()
export class NotificationPushService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationPushService.name);
  private readonly queue: Queue<PushJob, void, 'deliver'>;
  private worker?: Worker<PushJob, void, 'deliver'>;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    this.queue = new Queue<PushJob, void, 'deliver'>(QUEUE_NAME, {
      connection: this.connectionOptions(),
    });
  }

  async onModuleInit() {
    if (this.config.get('APP_MODE', { infer: true }) !== 'worker') return;
    if (!this.isConfigured()) {
      this.logger.warn('Browser push is disabled because VAPID keys are not configured');
      return;
    }

    this.configureWebPush();
    this.worker = new Worker<PushJob, void, 'deliver'>(
      QUEUE_NAME,
      async (job) => this.deliver(job.data),
      { connection: this.connectionOptions(), concurrency: 10 },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Push job ${job?.id || 'unknown'} failed`, error.stack);
    });
    this.logger.log('Browser push worker started');
  }

  async getConfig() {
    if (!this.isConfigured()) return { enabled: false };
    return {
      enabled: true,
      publicKey: this.config.get('VAPID_PUBLIC_KEY', { infer: true }),
    };
  }

  async subscribe(userId: string, dto: CreatePushSubscriptionDto) {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Browser notifications are not configured');
    }

    const existing = await this.prisma.pushSubscription.findUnique({
      where: { endpoint: dto.endpoint },
      select: { id: true, userId: true },
    });
    if (!existing) {
      const count = await this.prisma.pushSubscription.count({ where: { userId } });
      if (count >= MAX_SUBSCRIPTIONS_PER_USER) {
        const oldest = await this.prisma.pushSubscription.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'asc' },
          select: { id: true },
        });
        if (oldest) await this.prisma.pushSubscription.delete({ where: { id: oldest.id } });
      }
    }

    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        expirationTime: dto.expirationTime ? new Date(dto.expirationTime) : null,
      },
      update: {
        userId,
        p256dh: dto.p256dh,
        auth: dto.auth,
        expirationTime: dto.expirationTime ? new Date(dto.expirationTime) : null,
      },
    });

    return { subscribed: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { subscribed: false };
  }

  async enqueueForNotification(notificationId: string) {
    if (!this.isConfigured()) return;

    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { recipientId: true },
    });
    if (!notification) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId: notification.recipientId },
      select: { id: true },
    });
    if (!subscriptions.length) return;

    await this.queue.addBulk(
      subscriptions.map((subscription) => ({
        name: 'deliver' as const,
        data: { notificationId, subscriptionId: subscription.id },
        opts: {
          // BullMQ reserves colons for internal keys, so custom IDs must use another separator.
          jobId: `notification-${notificationId}-subscription-${subscription.id}`,
          attempts: 5,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: { age: 24 * 60 * 60, count: 2_000 },
          removeOnFail: { age: 7 * 24 * 60 * 60 },
        },
      })),
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
  }

  private async deliver(job: PushJob) {
    const subscription = await this.prisma.pushSubscription.findUnique({
      where: { id: job.subscriptionId },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        user: {
          select: {
            id: true,
            status: true,
            deletedAt: true,
            notificationPreferences: true,
          },
        },
      },
    });
    if (!subscription || !subscription.user || !this.isPushEnabled(subscription.user)) return;

    const notification = await this.prisma.notification.findFirst({
      where: { id: job.notificationId, recipientId: subscription.user.id },
      include: { actor: { select: { name: true } } },
    });
    if (!notification) return;

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify({
          title: 'CookTale',
          body: this.notificationText(notification),
          url: this.safeTargetPath(notification.targetPath),
          tag: `notification-${notification.id}`,
        }),
        { TTL: 24 * 60 * 60, urgency: 'normal' },
      );
    } catch (error) {
      const statusCode = this.statusCode(error);
      if (statusCode === 404 || statusCode === 410) {
        await this.prisma.pushSubscription.deleteMany({
          where: { id: subscription.id, endpoint: subscription.endpoint },
        });
        return;
      }
      throw error;
    }
  }

  private isPushEnabled(user: {
    status: AccountStatus;
    deletedAt: Date | null;
    notificationPreferences: Prisma.JsonValue | null;
  }) {
    if (user.status !== AccountStatus.ACTIVE || user.deletedAt) return false;
    if (!user.notificationPreferences || typeof user.notificationPreferences !== 'object') return false;
    return (user.notificationPreferences as Record<string, unknown>).push_activity === true;
  }

  private notificationText(notification: {
    type: NotificationType;
    actor: { name: string } | null;
    payload: Prisma.JsonValue;
  }) {
    const actor = notification.actor?.name || 'Someone';
    const payload =
      notification.payload && typeof notification.payload === 'object' && !Array.isArray(notification.payload)
        ? (notification.payload as Record<string, unknown>)
        : {};
    const recipe = typeof payload.recipeName === 'string' ? payload.recipeName : 'your recipe';
    const story = typeof payload.storyTitle === 'string' ? payload.storyTitle : 'your story';

    switch (notification.type) {
      case NotificationType.FOLLOW:
        return `${actor} started following your kitchen.`;
      case NotificationType.RECIPE_LIKE:
        return `${actor} liked ${recipe}.`;
      case NotificationType.STORY_LIKE:
        return `${actor} liked ${story}.`;
      case NotificationType.RECIPE_COMMENT:
      case NotificationType.RECIPE_COMMENT_REPLY:
        return `${actor} commented on ${recipe}.`;
      case NotificationType.STORY_COMMENT:
      case NotificationType.STORY_COMMENT_REPLY:
        return `${actor} commented on ${story}.`;
      case NotificationType.RECIPE_REVIEW:
      case NotificationType.RECIPE_REVIEW_REPLY:
        return `${actor} reviewed ${recipe}.`;
      default:
        return 'There is new activity in your kitchen.';
    }
  }

  private safeTargetPath(targetPath: string | null) {
    return targetPath?.startsWith('/') && !targetPath.startsWith('//') ? targetPath : '/notifications';
  }

  private statusCode(error: unknown) {
    return typeof error === 'object' && error && 'statusCode' in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : undefined;
  }

  private isConfigured() {
    return Boolean(
      this.config.get('NOTIFICATION_PUSH_ENABLED', { infer: true }) &&
        this.config.get('VAPID_PUBLIC_KEY', { infer: true }) &&
        this.config.get('VAPID_PRIVATE_KEY', { infer: true }),
    );
  }

  private configureWebPush() {
    webpush.setVapidDetails(
      this.config.get('VAPID_SUBJECT', { infer: true }),
      this.config.get('VAPID_PUBLIC_KEY', { infer: true })!,
      this.config.get('VAPID_PRIVATE_KEY', { infer: true })!,
    );
  }

  private connectionOptions() {
    const redisUrl = new URL(this.config.get('REDIS_URL', { infer: true }));
    return {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username || undefined,
      password: redisUrl.password || undefined,
      maxRetriesPerRequest: null,
    };
  }
}
