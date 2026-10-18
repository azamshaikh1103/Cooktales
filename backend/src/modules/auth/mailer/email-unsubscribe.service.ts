import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../../config/env.validation';
import { PrismaService } from '../../../database/prisma.service';

type UnsubscribePayload = {
  kind: 'daily-digest' | 'newsletter';
  subscriberId?: string;
  userId: string;
  expiresAt: number;
};

@Injectable()
export class EmailUnsubscribeService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  createDailyDigestUrl(userId: string) {
    const expiresAt = Date.now() + 90 * 24 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ kind: 'daily-digest', userId, expiresAt } satisfies UnsubscribePayload)).toString('base64url');
    const signature = this.signature(payload);
    const baseUrl = this.config.get('PUBLIC_API_URL', { infer: true });
    return new URL(`/api/v1/email-preferences/unsubscribe?token=${encodeURIComponent(`${payload}.${signature}`)}`, baseUrl).toString();
  }

  async unsubscribeDailyDigest(token: string) {
    const payload = this.verify(token);
    if (payload.kind !== 'daily-digest') throw new UnauthorizedException('Invalid unsubscribe link');
    const current = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { notificationPreferences: true },
    });
    if (!current) throw new UnauthorizedException('Invalid unsubscribe link');

    const existing =
      current.notificationPreferences && typeof current.notificationPreferences === 'object'
        ? (current.notificationPreferences as Record<string, unknown>)
        : {};
    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { notificationPreferences: { ...existing, email_activity_digest: false, email_digest: false } },
    });
  }

  createNewsletterUrl(subscriberId: string) {
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    const payload = Buffer.from(
      JSON.stringify({ kind: 'newsletter', subscriberId, userId: '', expiresAt } satisfies UnsubscribePayload),
    ).toString('base64url');
    const signature = this.signature(payload);
    const baseUrl = this.config.get('PUBLIC_API_URL', { infer: true });
    return new URL(
      `/api/v1/newsletter/subscriptions/unsubscribe?token=${encodeURIComponent(`${payload}.${signature}`)}`,
      baseUrl,
    ).toString();
  }

  async unsubscribeNewsletter(token: string) {
    const payload = this.verify(token);
    if (payload.kind !== 'newsletter' || !payload.subscriberId) {
      throw new UnauthorizedException('Invalid unsubscribe link');
    }

    const result = await this.prisma.newsletterSubscriber.updateMany({
      where: { id: payload.subscriberId },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });
    if (result.count !== 1) throw new UnauthorizedException('Invalid unsubscribe link');
  }

  private verify(token: string) {
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !this.matchesSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid unsubscribe link');
    }

    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as UnsubscribePayload;
      if (
        !['daily-digest', 'newsletter'].includes(parsed.kind) ||
        !Number.isFinite(parsed.expiresAt) ||
        parsed.expiresAt < Date.now()
      ) {
        throw new Error('Expired');
      }
      return parsed;
    } catch {
      throw new UnauthorizedException('Invalid or expired unsubscribe link');
    }
  }

  private matchesSignature(payload: string, received: string) {
    const expected = Buffer.from(this.signature(payload), 'utf8');
    const actual = Buffer.from(received, 'utf8');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  private signature(payload: string) {
    const secret =
      this.config.get('EMAIL_UNSUBSCRIBE_SECRET', { infer: true }) ||
      this.config.get('JWT_ACCESS_SECRET', { infer: true });
    if (!secret) throw new Error('EMAIL_UNSUBSCRIBE_SECRET must be configured');
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }
}
