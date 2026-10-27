import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { EmailUnsubscribeService } from '../auth/mailer/email-unsubscribe.service';
import { SubscribeNewsletterDto } from './dto/newsletter.dto';
import { NewsletterRateLimitService } from './newsletter-rate-limit.service';

const ACCEPTED_MESSAGE = 'You are subscribed to CookTale.';

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
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

    await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email },
      update: {
        isActive: true,
        source: 'footer',
        confirmedAt: new Date(),
        confirmationTokenHash: null,
        confirmationExpiresAt: null,
        unsubscribedAt: null,
      },
      create: {
        email: dto.email,
        isActive: true,
        source: 'footer',
        confirmedAt: new Date(),
      },
    });

    return { accepted: true, message: ACCEPTED_MESSAGE };
  }

  async unsubscribe(token: string) {
    await this.emailUnsubscribe.unsubscribeNewsletter(token);
  }

}
