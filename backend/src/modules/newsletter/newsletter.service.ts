import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';
import { AuthMailerService } from '../auth/mailer/auth-mailer.service';
import { EmailQueueService } from '../auth/mailer/email-queue.service';
import { EmailUnsubscribeService } from '../auth/mailer/email-unsubscribe.service';
import { SubscribeNewsletterDto } from './dto/newsletter.dto';
import { NewsletterRateLimitService } from './newsletter-rate-limit.service';

const ACCEPTED_MESSAGE = 'Check your inbox to confirm your subscription.';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly prisma: PrismaService,
    private readonly mailer: AuthMailerService,
    private readonly emailQueue: EmailQueueService,
    private readonly emailUnsubscribe: EmailUnsubscribeService,
    private readonly rateLimit: NewsletterRateLimitService,
  ) {}

  async subscribe(dto: SubscribeNewsletterDto, request: Request) {
    await this.rateLimit.checkSignup(dto.email, request.ip);

    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email: dto.email },
      select: { id: true, isActive: true },
    });
    if (existing?.isActive) return { accepted: true, message: ACCEPTED_MESSAGE };

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.get('NEWSLETTER_CONFIRMATION_TTL_HOURS', { infer: true }) * 60 * 60 * 1000,
    );
    const subscriber = await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email },
      update: {
        isActive: false,
        source: 'footer',
        confirmationTokenHash: this.hashToken(token),
        confirmationExpiresAt: expiresAt,
        unsubscribedAt: null,
      },
      create: {
        email: dto.email,
        isActive: false,
        source: 'footer',
        confirmationTokenHash: this.hashToken(token),
        confirmationExpiresAt: expiresAt,
      },
      select: { id: true },
    });

    const confirmationUrl = new URL(
      `/api/v1/newsletter/subscriptions/confirm?token=${encodeURIComponent(token)}`,
      this.config.get('PUBLIC_API_URL', { infer: true }),
    ).toString();
    const email = this.mailer.buildNewsletterConfirmationEmail({
      to: dto.email,
      confirmationUrl,
      unsubscribeUrl: this.emailUnsubscribe.createNewsletterUrl(subscriber.id),
    });
    await this.emailQueue.enqueue(email, { jobId: `newsletter-confirm:${subscriber.id}:${this.hashToken(token)}` });

    return { accepted: true, message: ACCEPTED_MESSAGE };
  }

  async confirm(token: string) {
    const tokenHash = this.hashToken(token);
    const result = await this.prisma.newsletterSubscriber.updateMany({
      where: {
        confirmationTokenHash: tokenHash,
        confirmationExpiresAt: { gt: new Date() },
      },
      data: {
        isActive: true,
        confirmedAt: new Date(),
        unsubscribedAt: null,
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
      },
    });
    if (result.count !== 1) throw new UnauthorizedException('Invalid or expired confirmation link');
  }

  async unsubscribe(token: string) {
    await this.emailUnsubscribe.unsubscribeNewsletter(token);
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
