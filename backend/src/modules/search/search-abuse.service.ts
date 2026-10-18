import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { AppConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class SearchAbuseService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  async check(ipAddress: string | undefined, kind: 'query' | 'suggestion') {
    const limit =
      kind === 'suggestion'
        ? this.config.get('SEARCH_SUGGESTIONS_IP_LIMIT', { infer: true })
        : this.config.get('SEARCH_QUERY_IP_LIMIT', { infer: true });
    const windowSeconds = this.config.get('SEARCH_RATE_LIMIT_WINDOW_SECONDS', { infer: true });
    const key = `search:rl:${kind}:${this.hash(ipAddress || 'unknown')}`;
    const redis = this.redis.getClient();
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    if (count <= limit) return;

    throw new HttpException(
      { message: 'Too many search requests. Try again shortly.', retryAfter: Math.max(await redis.ttl(key), 1) },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
