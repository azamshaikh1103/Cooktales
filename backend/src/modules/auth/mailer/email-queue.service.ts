import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobsOptions, Queue, Worker } from 'bullmq';
import type { AppConfig } from '../../../config/env.validation';
import { PrismaService } from '../../../database/prisma.service';
import { AuthMailerService } from './auth-mailer.service';

export type EmailJob = {
  to: string;
  subject: string;
  html: string;
  notificationDigestUserId?: string;
};

const QUEUE_NAME = 'auth-email';

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue<EmailJob, void, 'send'>;
  private worker?: Worker<EmailJob>;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly mailer: AuthMailerService,
    private readonly prisma: PrismaService,
  ) {
    this.queue = new Queue<EmailJob, void, 'send'>(QUEUE_NAME, {
      connection: this.getConnectionOptions(),
    });
  }

  onModuleInit() {
    if (this.config.get('APP_MODE', { infer: true }) !== 'worker') return;

    this.worker = new Worker<EmailJob>(
      QUEUE_NAME,
      async (job) => {
        await this.mailer.sendEmail(job.data);
        if (job.data.notificationDigestUserId) {
          await this.prisma.user.updateMany({
            where: { id: job.data.notificationDigestUserId, deletedAt: null },
            data: { lastNotificationDigestAt: new Date() },
          });
        }
      },
      {
        connection: this.getConnectionOptions(),
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, error) => {
      console.error('Auth email job failed:', {
        jobId: job?.id,
        to: job?.data.to,
        reason: error.message,
      });
    });

    console.log(`Email worker started for queue "${QUEUE_NAME}"`);
  }

  async enqueue(input: EmailJob, inputOptions?: { jobId?: string }) {
    const jobOptions: JobsOptions = {
      attempts: 5,
      backoff: { type: 'exponential', delay: 5000 },
      jobId: inputOptions?.jobId,
      removeOnComplete: { age: 7 * 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 24 * 60 * 60 },
    };

    await this.queue.add('send', input, jobOptions);
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue.close();
  }

  private getConnectionOptions() {
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
