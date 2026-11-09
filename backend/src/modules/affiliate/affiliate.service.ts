import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { RecipeStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import type { AffiliateItemKind, RecordAffiliateClickDto } from './dto/affiliate-click.dto';

const DEDUPE_SECONDS = 30;
const RATE_LIMIT = 60;
const RATE_WINDOW_SECONDS = 600;

export type AffiliateClickContext = {
  userId: string | null;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
};

const itemSelect = {
  id: true,
  name: true,
  link: true,
  recipe: {
    select: {
      id: true,
      slug: true,
      name: true,
      authorId: true,
      author: { select: { name: true } },
    },
  },
} as const;

/** Domain only, without a leading "www.", or null when the link is not a valid http(s) URL. */
export function linkDomain(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

@Injectable()
export class AffiliateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async record(dto: RecordAffiliateClickDto, context: AffiliateClickContext) {
    const redis = this.redis.getClient();
    const fingerprint = this.hash(`${context.ipAddress ?? 'unknown'}|${context.userAgent ?? 'unknown'}`);

    const rateKey = `affiliate:rl:${fingerprint}`;
    const used = await redis.incr(rateKey);
    if (used === 1) await redis.expire(rateKey, RATE_WINDOW_SECONDS);
    if (used > RATE_LIMIT) {
      throw new HttpException('Too many requests. Please slow down.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // A double click or a retry counts once.
    const accepted = await redis.set(
      `affiliate:seen:${dto.itemId}:${fingerprint}`,
      '1',
      'EX',
      DEDUPE_SECONDS,
      'NX',
    );
    if (!accepted) return { counted: false };

    const item = await this.findItem(dto.itemKind, dto.itemId, dto.recipeId);
    const domain = item?.link ? linkDomain(item.link) : null;
    if (!item || !item.link || !domain) throw new NotFoundException('Link not found.');

    await this.prisma.affiliateClick.create({
      data: {
        recipeId: item.recipe.id,
        recipeSlug: item.recipe.slug ?? '',
        recipeName: item.recipe.name,
        creatorId: item.recipe.authorId,
        creatorName: item.recipe.author.name,
        itemKind: dto.itemKind,
        itemId: item.id,
        itemName: item.name,
        linkUrl: item.link.slice(0, 2000),
        domain,
        userId: context.userId,
        country: context.country && /^[A-Z]{2}$/.test(context.country) ? context.country : null,
      },
    });
    return { counted: true };
  }

  private findItem(kind: AffiliateItemKind, itemId: string, recipeId: string) {
    const where = {
      id: itemId,
      recipeId,
      recipe: { status: RecipeStatus.PUBLISHED, deletedAt: null },
    };
    return kind === 'ingredient'
      ? this.prisma.ingredient.findFirst({ where, select: itemSelect })
      : this.prisma.equipment.findFirst({ where, select: itemSelect });
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex').slice(0, 32);
  }
}
