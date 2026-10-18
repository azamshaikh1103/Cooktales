import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import type { AppConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class NewsletterRateLimitService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  async checkSignup(email: string, ipAddress?: string) {
    if (!this.config.get('AUTH_RATE_LIMIT_ENABLED', { infer: true })) return;

    await this.consume('email', email, this.config.get('NEWSLETTER_SIGNUP_EMAIL_LIMIT', { infer: true }));
    await this.consume('ip', ipAddress || 'unknown', this.config.get('NEWSLETTER_SIGNUP_IP_LIMIT', { infer: true }));
  }

  private async consume(scope: 'email' | 'ip', value: string, limit: number) {
    const key = `newsletter:rl:signup:${scope}:${this.hash(value)}`;
    const redis = this.redis.getClient();
    const count = await redis.incr(key);
    const windowSeconds = this.config.get('NEWSLETTER_SIGNUP_WINDOW_SECONDS', { infer: true });
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count <= limit) return;

    const retryAfter = Math.max(await redis.ttl(key), 1);
    throw new HttpException(
      { message: 'Please wait before requesting another confirmation email.', retryAfter },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private hash(value: string) {
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
  }
}
