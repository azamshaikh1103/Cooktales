import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RecipeAbuseService } from './recipe-abuse.service';

const PENDING_KEY = 'recipe:views:pending';

@Injectable()
export class RecipeViewService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RecipeViewService.name);
  private timer?: ReturnType<typeof globalThis.setInterval>;
  private flushing = false;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly abuse: RecipeAbuseService,
  ) {}

  onModuleInit() {
    if (this.config.get('APP_MODE', { infer: true }) !== 'worker') return;
    const interval = this.config.get('RECIPE_VIEW_FLUSH_INTERVAL_SECONDS', { infer: true }) * 1000;
    this.timer = globalThis.setInterval(() => {
      void this.flush().catch((error: unknown) => {
        this.logger.error('Failed to flush recipe views', error);
      });
    }, interval);
  }

  async onModuleDestroy() {
    if (this.timer) globalThis.clearInterval(this.timer);
    if (this.config.get('APP_MODE', { infer: true }) === 'worker') await this.flush();
  }

  async record(recipeId: string, ipAddress?: string, userAgent?: string) {
    await this.abuse.checkView(ipAddress);
    const redis = this.redis.getClient();
    const fingerprint = this.hash(`${ipAddress || 'unknown'}|${userAgent || 'unknown'}`);
    const dedupeKey = `recipe:view:seen:${recipeId}:${fingerprint}`;
    const accepted = await redis.set(
      dedupeKey,
      '1',
      'EX',
      this.config.get('RECIPE_VIEW_DEDUPE_SECONDS', { infer: true }),
      'NX',
    );
    if (!accepted) return { counted: false };

    await redis.hincrby(PENDING_KEY, recipeId, 1);
    return { counted: true };
  }

  async flush() {
    if (this.flushing) return;
    this.flushing = true;

    const redis = this.redis.getClient();
    const processingKey = `${PENDING_KEY}:processing`;
    try {
      const processingExists = await redis.exists(processingKey);
      if (!processingExists) {
        const moved = await redis.renamenx(PENDING_KEY, processingKey).catch(() => 0);
        if (!moved) return;
      }

      const pending = await redis.hgetall(processingKey);
      if (Object.keys(pending).length === 0) {
        await redis.del(processingKey);
        return;
      }

      await this.prisma.$transaction(
        Object.entries(pending).map(([id, count]) =>
          this.prisma.recipe.updateMany({
            where: { id, status: 'PUBLISHED', deletedAt: null },
            data: { views: { increment: Number(count) } },
          }),
        ),
      );
      await redis.del(processingKey);
    } catch (error) {
      const pending = await redis.hgetall(processingKey);
      for (const [id, count] of Object.entries(pending)) {
        await redis.hincrby(PENDING_KEY, id, Number(count));
      }
      await redis.del(processingKey);
      throw error;
    } finally {
      this.flushing = false;
    }
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
