import { HttpException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import type { RedisService } from '../../redis/redis.service';
import { AffiliateService, linkDomain } from './affiliate.service';

const RECIPE_ID = '11111111-1111-4111-8111-111111111111';
const ITEM_ID = '22222222-2222-4222-8222-222222222222';
const dto = { recipeId: RECIPE_ID, itemKind: 'ingredient' as const, itemId: ITEM_ID };
const context = { userId: 'user-1', ipAddress: '1.2.3.4', userAgent: 'jest', country: 'IN' };

const item = {
  id: ITEM_ID,
  name: 'Saffron',
  link: 'https://www.amazon.in/dp/B000?tag=cooktale-21',
  recipe: { id: RECIPE_ID, slug: 'paella', name: 'Paella', authorId: 'creator-1', author: { name: 'Chef Ana' } },
};

describe('linkDomain', () => {
  it('keeps the domain only and drops www', () => {
    expect(linkDomain('https://www.amazon.in/dp/B000?tag=x')).toBe('amazon.in');
    expect(linkDomain('http://shop.example.com/a')).toBe('shop.example.com');
  });

  it('rejects anything that is not an http(s) link', () => {
    expect(linkDomain('javascript:alert(1)')).toBeNull();
    expect(linkDomain('not a url')).toBeNull();
  });
});

describe('AffiliateService', () => {
  const build = ({ found = item as unknown, seen = false, used = 1 } = {}) => {
    const redisClient = {
      incr: jest.fn().mockResolvedValue(used),
      expire: jest.fn().mockResolvedValue(1),
      set: jest.fn().mockResolvedValue(seen ? null : 'OK'),
    };
    const prisma = {
      ingredient: { findFirst: jest.fn().mockResolvedValue(found) },
      equipment: { findFirst: jest.fn().mockResolvedValue(found) },
      affiliateClick: { create: jest.fn().mockResolvedValue({}) },
    };
    const service = new AffiliateService(
      prisma as unknown as PrismaService,
      { getClient: () => redisClient } as unknown as RedisService,
    );
    return { service, prisma, redisClient };
  };

  it('logs the click with details copied from the item, never from the client', async () => {
    const { service, prisma } = build();

    await expect(service.record(dto, context)).resolves.toEqual({ counted: true });

    expect(prisma.affiliateClick.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipeId: RECIPE_ID,
        recipeName: 'Paella',
        creatorId: 'creator-1',
        creatorName: 'Chef Ana',
        itemKind: 'ingredient',
        itemName: 'Saffron',
        domain: 'amazon.in',
        userId: 'user-1',
        country: 'IN',
      }),
    });
  });

  it('looks equipment up in the equipment table', async () => {
    const { service, prisma } = build();
    await service.record({ ...dto, itemKind: 'equipment' }, context);
    expect(prisma.equipment.findFirst).toHaveBeenCalled();
    expect(prisma.ingredient.findFirst).not.toHaveBeenCalled();
  });

  it('counts a repeat click within the dedupe window once', async () => {
    const { service, prisma } = build({ seen: true });
    await expect(service.record(dto, context)).resolves.toEqual({ counted: false });
    expect(prisma.affiliateClick.create).not.toHaveBeenCalled();
  });

  it('refuses unknown items and items without a link', async () => {
    await expect(build({ found: null }).service.record(dto, context)).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      build({ found: { ...item, link: null } }).service.record(dto, context),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rate limits a noisy visitor', async () => {
    const { service, prisma } = build({ used: 61 });
    await expect(service.record(dto, context)).rejects.toBeInstanceOf(HttpException);
    expect(prisma.affiliateClick.create).not.toHaveBeenCalled();
  });

  it('stores no country when the header is not a two-letter code', async () => {
    const { service, prisma } = build();
    await service.record(dto, { ...context, country: 'XX1' });
    expect(prisma.affiliateClick.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ country: null }),
    });
  });
});
