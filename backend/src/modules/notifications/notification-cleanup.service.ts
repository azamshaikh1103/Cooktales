import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker } from 'bullmq';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';

type CleanupJob = Record<string, never>;

const QUEUE_NAME = 'notification-cleanup';
const SCHEDULER_ID = 'daily-notification-cleanup';

@Injectable()
export class NotificationCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationCleanupService.name);
  private readonly queue: Queue<CleanupJob, void, string>;
  private worker?: Worker<CleanupJob, void, string>;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {
    this.queue = new Queue<CleanupJob, void, string>(QUEUE_NAME, { connection: this.connectionOptions() });
  }

  async onModuleInit() {
    if (
      this.config.get('APP_MODE', { infer: true }) !== 'worker' ||
      !this.config.get('NOTIFICATION_CLEANUP_ENABLED', { infer: true })
    ) {
      return;
    }

    this.worker = new Worker<CleanupJob, void, string>(QUEUE_NAME, async () => {
      await this.deleteExpiredReadNotifications();
    }, { connection: this.connectionOptions(), concurrency: 1 });
    this.worker.on('failed', (job, error) => {
      this.logger.error(`Notification cleanup ${job?.id || 'unknown'} failed`, error.stack);
    });
    await this.queue.upsertJobScheduler(
      SCHEDULER_ID,
      { every: 24 * 60 * 60 * 1000 },
      { name: 'cleanup', data: {}, opts: { removeOnComplete: { age: 7 * 24 * 60 * 60, count: 20 } } },
    );
    this.logger.log('Notification cleanup scheduler started');
  }

  async deleteExpiredReadNotifications(now = new Date()) {
    const olderThan = new Date(
      now.getTime() - this.config.get('NOTIFICATION_READ_RETENTION_DAYS', { infer: true }) * 24 * 60 * 60 * 1000,
    );
    const candidates = await this.prisma.notification.findMany({
      where: { readAt: { not: null, lt: olderThan } },
      orderBy: { readAt: 'asc' },
      take: this.config.get('NOTIFICATION_CLEANUP_BATCH_SIZE', { infer: true }),
      select: { id: true },
    });
    if (!candidates.length) return { deleted: 0 };
    const deleted = await this.prisma.notification.deleteMany({ where: { id: { in: candidates.map((item) => item.id) } } });
    return { deleted: deleted.count };
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
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
