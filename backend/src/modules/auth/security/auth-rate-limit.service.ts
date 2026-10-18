import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { AppConfig } from '../../../config/env.validation';
import { RedisService } from '../../../redis/redis.service';

type RateLimitRule = {
  key: string;
  limit: number;
  windowSeconds: number;
  message?: string;
};

type AuthRateLimitMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuthRateLimitService {
  private readonly logger = new Logger(AuthRateLimitService.name);

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  async checkSignup(email: string, meta: AuthRateLimitMeta) {
    await this.consumeMany([
      {
        key: this.key('signup', 'email', email),
        limit: this.config.get('AUTH_SIGNUP_EMAIL_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_SIGNUP_EMAIL_WINDOW_SECONDS', { infer: true }),
      },
      {
        key: this.key('signup', 'ip', this.ipKey(meta.ipAddress)),
        limit: this.config.get('AUTH_SIGNUP_IP_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_SIGNUP_IP_WINDOW_SECONDS', { infer: true }),
      },
    ]);
  }

  async checkLoginStart(email: string, meta: AuthRateLimitMeta) {
    await this.throwIfBlocked(
      this.key('login-lock', 'email', email),
      'Too many failed login attempts. Try again later.',
    );
    await this.consume({
      key: this.key('login', 'ip', this.ipKey(meta.ipAddress)),
      limit: this.config.get('AUTH_LOGIN_IP_LIMIT', { infer: true }),
      windowSeconds: this.config.get('AUTH_LOGIN_IP_WINDOW_SECONDS', { infer: true }),
      message: 'Too many login attempts. Try again later.',
    });
  }

  async recordFailedLogin(email: string, meta: AuthRateLimitMeta) {
    if (!this.enabled()) return;

    const redis = this.redis.getClient();
    const attemptsKey = this.key('login-fail', 'email', email);
    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(
        attemptsKey,
        this.config.get('AUTH_LOGIN_LOCK_LONG_SECONDS', { infer: true }),
      );
    }

    const shortAttempts = this.config.get('AUTH_LOGIN_LOCK_SHORT_ATTEMPTS', { infer: true });
    const longAttempts = this.config.get('AUTH_LOGIN_LOCK_LONG_ATTEMPTS', { infer: true });

    if (attempts >= longAttempts) {
      await this.blockLogin(
        email,
        this.config.get('AUTH_LOGIN_LOCK_LONG_SECONDS', { infer: true }),
        attempts,
        meta,
      );
      return;
    }

    if (attempts >= shortAttempts) {
      await this.blockLogin(
        email,
        this.config.get('AUTH_LOGIN_LOCK_SHORT_SECONDS', { infer: true }),
        attempts,
        meta,
      );
    }
  }

  async clearFailedLogin(email: string) {
    if (!this.enabled()) return;
    await this.redis
      .getClient()
      .del(this.key('login-fail', 'email', email), this.key('login-lock', 'email', email));
  }

  async checkResendVerification(email: string, meta: AuthRateLimitMeta) {
    const cooldownKey = this.key('otp-resend-cooldown', 'email', email);
    await this.throwIfBlocked(
      cooldownKey,
      'Please wait before requesting another verification code.',
    );

    await this.consumeMany([
      {
        key: this.key('otp-resend', 'email', email),
        limit: this.config.get('AUTH_OTP_RESEND_EMAIL_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_OTP_RESEND_EMAIL_WINDOW_SECONDS', { infer: true }),
      },
      {
        key: this.key('otp-resend', 'ip', this.ipKey(meta.ipAddress)),
        limit: this.config.get('AUTH_OTP_RESEND_IP_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_OTP_RESEND_IP_WINDOW_SECONDS', { infer: true }),
      },
    ]);

    await this.block(
      cooldownKey,
      this.config.get('AUTH_OTP_RESEND_COOLDOWN_SECONDS', { infer: true }),
    );
  }

  async checkVerifyEmail(email: string, meta: AuthRateLimitMeta) {
    await this.consumeMany([
      {
        key: this.key('otp-verify', 'email', email),
        limit: this.config.get('EMAIL_VERIFICATION_MAX_ATTEMPTS', { infer: true }),
        windowSeconds: this.config.get('EMAIL_VERIFICATION_CODE_TTL_SECONDS', { infer: true }),
        message: 'Too many verification attempts. Request a new code.',
      },
      {
        key: this.key('otp-verify', 'ip', this.ipKey(meta.ipAddress)),
        limit: this.config.get('AUTH_OTP_VERIFY_IP_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_OTP_VERIFY_IP_WINDOW_SECONDS', { infer: true }),
      },
    ]);
  }

  async clearVerifyEmail(email: string) {
    if (!this.enabled()) return;
    await this.redis.getClient().del(this.key('otp-verify', 'email', email));
  }

  async checkForgotPassword(email: string, meta: AuthRateLimitMeta) {
    await this.consumeMany([
      {
        key: this.key('forgot-password', 'email', email),
        limit: this.config.get('AUTH_FORGOT_PASSWORD_EMAIL_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_FORGOT_PASSWORD_EMAIL_WINDOW_SECONDS', {
          infer: true,
        }),
      },
      {
        key: this.key('forgot-password', 'ip', this.ipKey(meta.ipAddress)),
        limit: this.config.get('AUTH_FORGOT_PASSWORD_IP_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_FORGOT_PASSWORD_IP_WINDOW_SECONDS', { infer: true }),
      },
    ]);
  }

  async checkResetPassword(email: string, token: string, meta: AuthRateLimitMeta) {
    await this.consumeMany([
      {
        key: this.key('reset-password', 'email', email),
        limit: this.config.get('AUTH_RESET_PASSWORD_EMAIL_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_RESET_PASSWORD_EMAIL_WINDOW_SECONDS', { infer: true }),
      },
      {
        key: this.key('reset-password', 'token', token),
        limit: this.config.get('AUTH_RESET_PASSWORD_EMAIL_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_RESET_PASSWORD_EMAIL_WINDOW_SECONDS', { infer: true }),
      },
      {
        key: this.key('reset-password', 'ip', this.ipKey(meta.ipAddress)),
        limit: this.config.get('AUTH_RESET_PASSWORD_IP_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_RESET_PASSWORD_IP_WINDOW_SECONDS', { infer: true }),
      },
    ]);
  }

  async checkRefresh(refreshToken: string | undefined, meta: AuthRateLimitMeta) {
    await this.consumeMany([
      {
        key: this.key('refresh', 'ip', this.ipKey(meta.ipAddress)),
        limit: this.config.get('AUTH_REFRESH_IP_LIMIT', { infer: true }),
        windowSeconds: this.config.get('AUTH_REFRESH_IP_WINDOW_SECONDS', { infer: true }),
      },
      ...(refreshToken
        ? [
            {
              key: this.key('refresh', 'token', refreshToken),
              limit: this.config.get('AUTH_REFRESH_TOKEN_LIMIT', { infer: true }),
              windowSeconds: this.config.get('AUTH_REFRESH_TOKEN_WINDOW_SECONDS', { infer: true }),
            },
          ]
        : []),
    ]);
  }

  async checkGoogle(meta: AuthRateLimitMeta) {
    await this.consume({
      key: this.key('google', 'ip', this.ipKey(meta.ipAddress)),
      limit: this.config.get('AUTH_GOOGLE_IP_LIMIT', { infer: true }),
      windowSeconds: this.config.get('AUTH_GOOGLE_IP_WINDOW_SECONDS', { infer: true }),
    });
  }

  private async consumeMany(rules: RateLimitRule[]) {
    for (const rule of rules) {
      await this.consume(rule);
    }
  }

  private async consume(rule: RateLimitRule) {
    if (!this.enabled()) return;

    const redis = this.redis.getClient();
    const count = await redis.incr(rule.key);

    if (count === 1) {
      await redis.expire(rule.key, rule.windowSeconds);
    }

    if (count > rule.limit) {
      const retryAfter = await redis.ttl(rule.key);
      this.logger.warn({ event: 'auth_rate_limited', key: rule.key, retryAfter });
      throw new HttpException(
        {
          message: rule.message || 'Too many attempts. Try again later.',
          retryAfter: Math.max(retryAfter, 1),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async throwIfBlocked(key: string, message: string) {
    if (!this.enabled()) return;
    const ttl = await this.redis.getClient().ttl(key);
    if (ttl > 0) {
      throw new HttpException({ message, retryAfter: ttl }, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async blockLogin(
    email: string,
    ttlSeconds: number,
    attempts: number,
    meta: AuthRateLimitMeta,
  ) {
    await this.block(this.key('login-lock', 'email', email), ttlSeconds);
    this.logger.warn({
      event: 'auth_login_locked',
      emailHash: this.hash(email),
      ipHash: this.hash(this.ipKey(meta.ipAddress)),
      attempts,
      ttlSeconds,
    });
  }

  private async block(key: string, ttlSeconds: number) {
    if (!this.enabled()) return;
    await this.redis.getClient().set(key, '1', 'EX', ttlSeconds);
  }

  private key(action: string, scope: string, value: string) {
    return `auth:rl:${action}:${scope}:${this.hash(value)}`;
  }

  private ipKey(ipAddress?: string) {
    return ipAddress || 'unknown';
  }

  private hash(value: string) {
    return createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  private enabled() {
    return this.config.get('AUTH_RATE_LIMIT_ENABLED', { infer: true });
  }
}
