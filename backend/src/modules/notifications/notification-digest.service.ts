import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus, NotificationType, Prisma } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { AuthMailerService } from '../auth/mailer/auth-mailer.service';
import { EmailQueueService } from '../auth/mailer/email-queue.service';

type DigestJob = Record<string, never>;
type LocalDateTime = { date: string; hour: number };

const QUEUE_NAME = 'notification-email-digest';
const SCHEDULER_ID = 'daily-notification-email-digest';

@Injectable()
export class NotificationDigestService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDigestService.name);
  private readonly queue: Queue<DigestJob, void, string>;
  private worker?: Worker<DigestJob, void, string>;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
    private readonly mailer: AuthMailerService,
    private readonly emailQueue: EmailQueueService,
  ) {
    this.queue = new Queue<DigestJob, void, string>(QUEUE_NAME, {
      connection: this.connectionOptions(),
    });
  }

  async onModuleInit() {
    if (
      this.config.get('APP_MODE', { infer: true }) !== 'worker' ||
      !this.config.get('NOTIFICATION_EMAIL_DIGEST_ENABLED', { infer: true })
    ) {
      return;
    }

    this.worker = new Worker<DigestJob, void, string>(
      QUEUE_NAME,
      async () => {
        await this.processEligibleDigests();
      },
      { connection: this.connectionOptions(), concurrency: 1 },
    );
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Notification digest job ${job?.id || 'unknown'} failed`, error.stack);
    });

    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      {
        every: this.config.get('NOTIFICATION_EMAIL_DIGEST_RUN_EVERY_MINUTES', { infer: true }) * 60_000,
      },
      {
        name: 'dispatch',
        data: {},
        opts: {
          removeOnComplete: { age: 24 * 60 * 60, count: 100 },
          removeOnFail: { age: 7 * 24 * 60 * 60 },
        },
      },
    );

    this.logger.log('Notification email digest scheduler started');
  }

  async processEligibleDigests(now = new Date()) {
    const users = await this.prisma.user.findMany({
      where: {
        status: AccountStatus.ACTIVE,
        deletedAt: null,
        emailVerified: { not: null },
        notificationPreferences: {
          path: ['email_activity_digest'],
          equals: true,
        },
      },
      orderBy: { id: 'asc' },
      take: this.config.get('NOTIFICATION_EMAIL_DIGEST_BATCH_SIZE', { infer: true }),
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true,
        lastNotificationDigestAt: true,
      },
    });

    let enqueued = 0;
    for (const user of users) {
      const local = this.localDateTime(now, user.timezone);
      if (
        local.hour < this.config.get('NOTIFICATION_EMAIL_DIGEST_HOUR_LOCAL', { infer: true }) ||
        this.sameLocalDate(user.lastNotificationDigestAt, now, user.timezone)
      ) {
        continue;
      }

      const from =
        user.lastNotificationDigestAt ||
        new Date(
          now.getTime() -
            this.config.get('NOTIFICATION_EMAIL_DIGEST_LOOKBACK_HOURS', { infer: true }) * 60 * 60 * 1000,
        );
      const where: Prisma.NotificationWhereInput = {
        recipientId: user.id,
        readAt: null,
        createdAt: { gt: from, lte: now },
      };
      const [total, notifications] = await this.prisma.$transaction([
        this.prisma.notification.count({ where }),
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: this.config.get('NOTIFICATION_EMAIL_DIGEST_ITEM_LIMIT', { infer: true }),
          include: {
            actor: {
              select: { name: true },
            },
          },
        }),
      ]);
      if (!total) continue;

      await this.emailQueue.enqueue(
        {
          ...this.mailer.buildNotificationDigestEmail({
            recipientId: user.id,
            to: user.email,
            recipientName: user.name,
            total,
            items: notifications.map((notification) => ({
              text: this.notificationText(notification),
              targetPath: notification.targetPath,
            })),
          }),
          notificationDigestUserId: user.id,
        },
        { jobId: `notification-digest:${user.id}:${local.date}` },
      );
      enqueued += 1;
    }

    return { scanned: users.length, enqueued };
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
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
        return `${actor} commented on ${recipe}.`;
      case NotificationType.STORY_COMMENT:
        return `${actor} commented on ${story}.`;
      case NotificationType.RECIPE_COMMENT_REPLY:
        return `${actor} replied to your comment on ${recipe}.`;
      case NotificationType.STORY_COMMENT_REPLY:
        return `${actor} replied to your comment on ${story}.`;
      case NotificationType.RECIPE_REVIEW:
        return `${actor} reviewed ${recipe}.`;
      case NotificationType.RECIPE_REVIEW_REPLY:
        return `${actor} replied to your review of ${recipe}.`;
      default:
        return 'There is an update from CookTale.';
    }
  }

  private sameLocalDate(previous: Date | null, current: Date, timezone: string) {
    if (!previous) return false;
    return this.localDateTime(previous, timezone).date === this.localDateTime(current, timezone).date;
  }

  private localDateTime(value: Date, timezone: string): LocalDateTime {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
      }).formatToParts(value);
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
      const year = part('year');
      const month = part('month');
      const day = part('day');
      const hour = Number(part('hour'));
      if (!year || !month || !day || Number.isNaN(hour)) throw new Error('Invalid timezone parts');
      return { date: `${year}-${month}-${day}`, hour };
    } catch {
      return this.localDateTime(value, 'UTC');
    }
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
