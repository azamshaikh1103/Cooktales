import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { AppConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class CommunityAbuseService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  async checkUserAction(userId: string, action: string, limit: number, windowSeconds: number) {
    if (!this.config.get('AUTH_RATE_LIMIT_ENABLED', { infer: true })) return;
    const key = `community:rl:${action}:${this.hash(userId)}`;
    const client = this.redis.getClient();
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, windowSeconds);
    if (count <= limit) return;
    throw new HttpException(
      { message: 'Too many requests. Try again later.', retryAfter: Math.max(await client.ttl(key), 1) },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
