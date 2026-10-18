import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { AppConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RecipeAbuseService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  async checkReaction(userId: string, action: string) {
    await this.consume(
      `recipe:rl:reaction:${action}:${this.hash(userId)}`,
      this.config.get('RECIPE_REACTION_USER_LIMIT', { infer: true }),
      this.config.get('RECIPE_REACTION_WINDOW_SECONDS', { infer: true }),
    );
  }

  async checkReview(userId: string, action: string) {
    const limit =
      action === 'create'
        ? this.config.get('RECIPE_REVIEW_CREATE_LIMIT', { infer: true })
        : action === 'update'
          ? this.config.get('RECIPE_REVIEW_UPDATE_LIMIT', { infer: true })
          : action === 'rate'
            ? this.config.get('RECIPE_REVIEW_RATE_LIMIT', { infer: true })
            : this.config.get('RECIPE_REVIEW_USER_LIMIT', { infer: true });
    await this.consume(
      `recipe:rl:review:${action}:${this.hash(userId)}`,
      limit,
      this.config.get('RECIPE_REVIEW_WINDOW_SECONDS', { infer: true }),
    );
  }

  async checkComment(userId: string, action: string) {
    const limit =
      action === 'create' || action === 'reply'
        ? this.config.get('RECIPE_COMMENT_CREATE_LIMIT', { infer: true })
        : action === 'edit'
          ? this.config.get('RECIPE_COMMENT_EDIT_LIMIT', { infer: true })
          : this.config.get('RECIPE_COMMENT_REACTION_LIMIT', { infer: true });
    await this.consume(
      `recipe:rl:comment:${action}:${this.hash(userId)}`,
      limit,
      this.config.get('RECIPE_COMMENT_WINDOW_SECONDS', { infer: true }),
    );
  }

  async checkView(ipAddress?: string) {
    await this.consume(
      `recipe:rl:view:${this.hash(ipAddress || 'unknown')}`,
      this.config.get('RECIPE_VIEW_IP_LIMIT', { infer: true }),
      this.config.get('RECIPE_VIEW_IP_WINDOW_SECONDS', { infer: true }),
    );
  }

  private async consume(key: string, limit: number, windowSeconds: number) {
    if (!this.config.get('AUTH_RATE_LIMIT_ENABLED', { infer: true })) return;
    const redis = this.redis.getClient();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count <= limit) return;

    const retryAfter = Math.max(await redis.ttl(key), 1);
    throw new HttpException(
      { message: 'Too many requests. Try again later.', retryAfter },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
