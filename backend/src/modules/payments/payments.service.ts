import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type { AppConfig } from '../../config/env.validation';
import { PrismaService } from '../../database/prisma.service';

type LemonSqueezyPayload = {
  meta?: { event_name?: string; custom_data?: Record<string, unknown> };
  data?: { id?: string; attributes?: Record<string, unknown> };
};

const LEMON_SQUEEZY_API = 'https://api.lemonsqueezy.com/v1';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async createCheckout(userId: string, plan: 'monthly' | 'yearly' | 'lifetime') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new UnauthorizedException('User is not active');

    const storeId = this.requiredConfig('LEMONSQUEEZY_STORE_ID');
    const variantId = this.variantIdFor(plan);
    const response = await this.lemonRequest('/checkouts', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: { user_id: user.id, plan_type: plan },
            },
            product_options: {
              redirect_url: `${this.config.get('FRONTEND_URL', { infer: true })}/?upgrade=success`,
              receipt_button_text: 'Return to CookTale',
              receipt_thank_you_note: 'Welcome to the Sous Chef Club!',
            },
          },
          relationships: {
            store: { data: { type: 'stores', id: storeId } },
            variant: { data: { type: 'variants', id: variantId } },
          },
        },
      }),
    });
    const payload = (await response.json()) as { data?: { attributes?: { url?: string } } };
    const url = payload.data?.attributes?.url;
    if (!url) throw new ServiceUnavailableException('Checkout provider did not return a URL');
    return { url };
  }

  async getBillingPortal(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionId: true },
    });
    if (!user?.subscriptionId) throw new BadRequestException('No active subscription found');

    const response = await this.lemonRequest(`/subscriptions/${encodeURIComponent(user.subscriptionId)}`);
    const payload = (await response.json()) as {
      data?: { attributes?: { urls?: { customer_portal?: string } } };
    };
    const url = payload.data?.attributes?.urls?.customer_portal;
    if (!url) throw new ServiceUnavailableException('Billing portal is unavailable');
    return { url };
  }

  async getMembership(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true, plan: true, planStatus: true, planEndsAt: true, subscriptionId: true },
    });
    if (!user) throw new UnauthorizedException('User is not active');
    return { membership: user };
  }

  async handleLemonSqueezyWebhook(rawBody: Buffer | undefined, signature: string | string[] | undefined) {
    if (!rawBody?.length || typeof signature !== 'string') {
      throw new BadRequestException('Missing webhook signature');
    }

    const secret = this.requiredConfig('LEMONSQUEEZY_WEBHOOK_SECRET');
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const actual = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    let payload: LemonSqueezyPayload;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as LemonSqueezyPayload;
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};
    const userId = typeof customData.user_id === 'string' ? customData.user_id : undefined;
    const planType = customData.plan_type;
    const payloadHash = createHash('sha256').update(rawBody).digest('hex');
    const providerEventId = payloadHash;

    if (!eventName || !userId) {
      throw new BadRequestException('Webhook is missing its event or user reference');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentWebhookEvent.findUnique({ where: { providerEventId } });
      if (existing) return { duplicate: true };

      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) {
        await tx.paymentWebhookEvent.create({
          data: { provider: 'lemon-squeezy', providerEventId, eventName, payloadHash, status: 'ignored' },
        });
        return { duplicate: false };
      }

      const attributes = payload.data?.attributes || {};
      const update = this.membershipUpdate(eventName, planType, payload.data?.id, attributes);
      if (update) await tx.user.update({ where: { id: userId }, data: update });

      await tx.paymentWebhookEvent.create({
        data: {
          provider: 'lemon-squeezy',
          providerEventId,
          eventName,
          payloadHash,
          status: update ? 'processed' : 'ignored',
          processedAt: new Date(),
        },
      });
      return { duplicate: false };
    });

    return { received: true, duplicate: result.duplicate };
  }

  private membershipUpdate(
    eventName: string,
    planType: unknown,
    providerId: string | undefined,
    attributes: Record<string, unknown>,
  ) {
    const isLifetime = planType === 'lifetime';
    const isSubscription = eventName.startsWith('subscription_');
    const providerStatus = typeof attributes.status === 'string' ? attributes.status : '';

    if (eventName === 'order_created' && isLifetime && providerStatus === 'paid') {
      return { isPro: true, plan: SubscriptionPlan.SOUS_CHEF, planStatus: SubscriptionStatus.ACTIVE, planEndsAt: null };
    }
    if (isSubscription && ['subscription_created', 'subscription_updated'].includes(eventName) && ['active', 'on_trial'].includes(providerStatus)) {
      return {
        isPro: true,
        plan: SubscriptionPlan.SOUS_CHEF,
        planStatus: SubscriptionStatus.ACTIVE,
        subscriptionId: providerId || undefined,
        planEndsAt: this.dateValue(attributes.renews_at) || this.dateValue(attributes.ends_at),
      };
    }
    if (eventName === 'subscription_cancelled') {
      return { planStatus: SubscriptionStatus.CANCELED, planEndsAt: this.dateValue(attributes.ends_at) };
    }
    if (['subscription_expired', 'subscription_paused'].includes(eventName)) {
      return { isPro: false, planStatus: SubscriptionStatus.CANCELED };
    }
    return null;
  }

  private dateValue(value: unknown) {
    if (typeof value !== 'string') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private variantIdFor(plan: 'monthly' | 'yearly' | 'lifetime') {
    if (plan === 'monthly') return this.requiredConfig('LEMONSQUEEZY_VARIANT_MONTHLY');
    if (plan === 'yearly') return this.requiredConfig('LEMONSQUEEZY_VARIANT_YEARLY');
    return this.requiredConfig('LEMONSQUEEZY_VARIANT_LIFETIME');
  }

  private requiredConfig(key: 'LEMONSQUEEZY_API_KEY' | 'LEMONSQUEEZY_STORE_ID' | 'LEMONSQUEEZY_VARIANT_MONTHLY' | 'LEMONSQUEEZY_VARIANT_YEARLY' | 'LEMONSQUEEZY_VARIANT_LIFETIME' | 'LEMONSQUEEZY_WEBHOOK_SECRET') {
    const value = this.config.get(key, { infer: true });
    if (!value) throw new ServiceUnavailableException('Payments are not configured');
    return value;
  }

  private async lemonRequest(path: string, init?: RequestInit) {
    const response = await fetch(`${LEMON_SQUEEZY_API}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.api+json',
        Authorization: `Bearer ${this.requiredConfig('LEMONSQUEEZY_API_KEY')}`,
        ...(init?.body ? { 'Content-Type': 'application/vnd.api+json' } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) throw new ServiceUnavailableException('Payment provider is unavailable');
    return response;
  }
}
