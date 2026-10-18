import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../src/config/env.validation';
import { RedisService } from '../src/redis/redis.service';
import { AuthRateLimitService } from '../src/modules/auth/security/auth-rate-limit.service';

const values: Partial<AppConfig> = {
    REDIS_URL: process.env.REDIS_URL || 'redis://127.0.0.1:6380/0',
  AUTH_RATE_LIMIT_ENABLED: true,
  AUTH_LOGIN_IP_LIMIT: 50,
  AUTH_LOGIN_IP_WINDOW_SECONDS: 60,
  AUTH_LOGIN_LOCK_SHORT_ATTEMPTS: 5,
  AUTH_LOGIN_LOCK_SHORT_SECONDS: 60,
  AUTH_LOGIN_LOCK_LONG_ATTEMPTS: 10,
  AUTH_LOGIN_LOCK_LONG_SECONDS: 120,
  AUTH_OTP_RESEND_COOLDOWN_SECONDS: 60,
  AUTH_OTP_RESEND_EMAIL_LIMIT: 5,
  AUTH_OTP_RESEND_EMAIL_WINDOW_SECONDS: 60,
  AUTH_OTP_RESEND_IP_LIMIT: 20,
  AUTH_OTP_RESEND_IP_WINDOW_SECONDS: 60,
};

const config = {
  get(key: keyof AppConfig) {
    const value = values[key];
    if (value === undefined) throw new Error(`Missing test config value: ${key}`);
    return value;
  },
} as ConfigService<AppConfig, true>;

describe('Auth rate limiting with Redis', () => {
  let redis: RedisService;
  let rateLimit: AuthRateLimitService;

  beforeAll(() => {
    redis = new RedisService(config);
    rateLimit = new AuthRateLimitService(config, redis);
  });

  beforeEach(async () => {
    await redis.getClient().flushdb();
  });

  afterAll(async () => {
    await redis.onModuleDestroy();
  });

  it('locks an email after five failed login attempts', async () => {
    const email = 'locked@example.test';
    const meta = { ipAddress: '127.0.0.10' };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await rateLimit.recordFailedLogin(email, meta);
    }

    await expect(rateLimit.checkLoginStart(email, meta)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('enforces the verification resend cooldown', async () => {
    const email = 'resend@example.test';
    const meta = { ipAddress: '127.0.0.11' };

    await rateLimit.checkResendVerification(email, meta);

    await expect(rateLimit.checkResendVerification(email, meta)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });
});
