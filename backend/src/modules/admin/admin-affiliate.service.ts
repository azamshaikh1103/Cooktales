import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const TOP_LIMIT = 20;
const RECENT_LIMIT = 50;

@Injectable()
export class AdminAffiliateService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where = { createdAt: { gte: since } };

    const [total, byItem, byDomain, byCountry, recent] = await Promise.all([
      this.prisma.affiliateClick.count({ where }),
      this.prisma.affiliateClick.groupBy({
        by: ['recipeId', 'recipeName', 'recipeSlug', 'creatorName', 'itemKind', 'itemName', 'domain'],
        where,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: TOP_LIMIT,
      }),
      this.prisma.affiliateClick.groupBy({
        by: ['domain'],
        where,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: TOP_LIMIT,
      }),
      this.prisma.affiliateClick.groupBy({
        by: ['country'],
        where,
        _count: { _all: true },
        orderBy: { _count: { id: 'desc' } },
        take: TOP_LIMIT,
      }),
      this.prisma.affiliateClick.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: {
          id: true,
          createdAt: true,
          recipeName: true,
          recipeSlug: true,
          creatorName: true,
          itemKind: true,
          itemName: true,
          domain: true,
          country: true,
          user: { select: { name: true, username: true } },
        },
      }),
    ]);

    return {
      days,
      total,
      topItems: byItem.map((row) => ({
        recipeId: row.recipeId,
        recipeName: row.recipeName,
        recipeSlug: row.recipeSlug,
        creatorName: row.creatorName,
        itemKind: row.itemKind,
        itemName: row.itemName,
        domain: row.domain,
        clicks: row._count._all,
      })),
      topDomains: byDomain.map((row) => ({ domain: row.domain, clicks: row._count._all })),
      topCountries: byCountry.map((row) => ({ country: row.country, clicks: row._count._all })),
      recent: recent.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        recipeName: row.recipeName,
        recipeSlug: row.recipeSlug,
        creatorName: row.creatorName,
        itemKind: row.itemKind,
        itemName: row.itemName,
        domain: row.domain,
        country: row.country,
        visitor: row.user ? { name: row.user.name, username: row.user.username } : null,
      })),
    };
  }
}
