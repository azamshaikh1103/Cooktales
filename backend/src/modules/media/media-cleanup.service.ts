import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PendingMediaStatus } from '@prisma/client';
import { clearInterval, setInterval } from 'node:timers';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { MediaResourceType } from './dto/media.dto';
import { MediaService } from './media.service';

@Injectable()
export class MediaCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MediaCleanupService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  onModuleInit() {
    if (this.config.get('APP_MODE', { infer: true }) !== 'worker') return;
    const minutes = this.config.get('MEDIA_CLEANUP_INTERVAL_MINUTES', { infer: true });
    void this.cleanupExpiredUploads();
    this.timer = setInterval(() => void this.cleanupExpiredUploads(), minutes * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async cleanupExpiredUploads(limit = 100) {
    const uploads = await this.prisma.pendingMediaUpload.findMany({
      where: {
        status: {
          in: [
            PendingMediaStatus.PENDING,
            PendingMediaStatus.UPLOADED,
            PendingMediaStatus.DELETE_PENDING,
          ],
        },
        expiresAt: { lte: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });

    for (const upload of uploads) {
      try {
        await this.mediaService.deleteAsset({
          publicId: upload.publicId,
          resourceType: upload.resourceType.toLowerCase() as Exclude<
            MediaResourceType,
            MediaResourceType.AUTO
          >,
        });
        await this.prisma.pendingMediaUpload.update({
          where: { id: upload.id },
          data: { status: PendingMediaStatus.DELETED },
        });
      } catch (error) {
        this.logger.warn(
          `Could not clean abandoned upload ${upload.publicId}: ${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    return { checked: uploads.length };
  }
}
