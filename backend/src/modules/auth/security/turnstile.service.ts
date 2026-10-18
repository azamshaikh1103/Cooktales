import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/env.validation';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEVELOPMENT_SECRET_KEY = '1x0000000000000000000000000000000AA';

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class TurnstileService {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async verify(token: string | undefined, ipAddress?: string) {
    if (!token) return false;

    const secret =
      this.config.get('CLOUDFLARE_TURNSTILE_SECRET_KEY', { infer: true }) ||
      (this.config.get('NODE_ENV', { infer: true }) === 'production' ? '' : DEVELOPMENT_SECRET_KEY);

    if (!secret) {
      throw new ServiceUnavailableException('Turnstile is not configured');
    }

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: ipAddress,
      }),
    });

    const result = (await response.json()) as TurnstileResponse;

    if (!result.success) {
      console.warn('Turnstile validation failed:', result['error-codes']);
    }

    return result.success;
  }
}
