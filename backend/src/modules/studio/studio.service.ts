import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RecipeStatus, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StudioAnalyticsQueryDto } from './dto/analytics-query.dto';
import { CreatePayoutMethodDto } from './dto/payout-method.dto';
import { PayoutEncryptionService } from './payout-encryption.service';

@Injectable()
export class StudioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payoutEncryption: PayoutEncryptionService,
  ) {}

  async earnings(userId: string) {
    const wallet = await this.prisma.creatorWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        payoutMethods: { orderBy: { createdAt: 'asc' } },
        earnings: { orderBy: { period: 'desc' } },
        payouts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { payoutMethod: { select: { method: true } } },
        },
      },
    });
    return {
      wallet: {
        availableUsd: wallet.availableUsd.toString(),
        lifetimeEarnedUsd: wallet.lifetimeEarnedUsd.toString(),
      },
      payoutMethods: wallet.payoutMethods.map((method) => ({
        id: method.id,
        method: method.method,
        legalName: method.legalName,
        country: method.country,
        maskedDestination: method.maskedDestination,
        isPrimary: method.isPrimary,
        createdAt: method.createdAt,
      })),
      earnings: wallet.earnings.map((earning) => ({
        ...earning,
        amountUsd: earning.amountUsd.toString(),
      })),
      payouts: wallet.payouts.map(({ payoutMethod, ...payout }) => ({
        ...payout,
        method: payoutMethod.method,
        grossUsd: payout.grossUsd.toString(),
        feeUsd: payout.feeUsd.toString(),
        netUsd: payout.netUsd.toString(),
      })),
    };
  }

  async addPayoutMethod(userId: string, dto: CreatePayoutMethodDto) {
    const wallet = await this.prisma.creatorWallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const existing = await this.prisma.creatorPayoutMethod.findUnique({
      where: { walletId_method: { walletId: wallet.id, method: dto.method } },
    });
    if (existing)
      throw new ConflictException(
        'This payout method is already saved. Contact CookTale support to change its details.',
      );
    const primaryExists = await this.prisma.creatorPayoutMethod.count({
      where: { walletId: wallet.id, isPrimary: true },
    });
    const method = await this.prisma.$transaction(async (tx) => {
      if (dto.primary || !primaryExists)
        await tx.creatorPayoutMethod.updateMany({
          where: { walletId: wallet.id },
          data: { isPrimary: false },
        });
      return tx.creatorPayoutMethod.create({
        data: {
          walletId: wallet.id,
          method: dto.method,
          legalName: dto.legalName.trim(),
          country: dto.country.trim(),
          encryptedDestination: this.payoutEncryption.encrypt(dto.destination.trim()),
          maskedDestination: this.mask(dto.destination.trim()),
          isPrimary: dto.primary || !primaryExists,
        },
      });
    });
    return {
      payoutMethod: {
        id: method.id,
        method: method.method,
        legalName: method.legalName,
        country: method.country,
        maskedDestination: method.maskedDestination,
        isPrimary: method.isPrimary,
        createdAt: method.createdAt,
      },
    };
  }

  async setPrimaryPayoutMethod(userId: string, id: string) {
    const method = await this.prisma.creatorPayoutMethod.findFirst({
      where: { id, wallet: { userId } },
    });
    if (!method) throw new NotFoundException('Payout method not found');
    await this.prisma.$transaction([
      this.prisma.creatorPayoutMethod.updateMany({
        where: { walletId: method.walletId },
        data: { isPrimary: false },
      }),
      this.prisma.creatorPayoutMethod.update({ where: { id }, data: { isPrimary: true } }),
    ]);
    return { message: 'Primary payout method updated' };
  }

  private mask(value: string) {
    return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`;
  }

  async dashboard(userId: string) {
    const [user, recipeTotals, storyTotals, latestRecipe, latestStory] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          _count: {
            select: {
              recipes: { where: { status: RecipeStatus.PUBLISHED, deletedAt: null } },
              stories: { where: { status: StoryStatus.PUBLISHED, deletedAt: null } },
              followers: true,
            },
          },
        },
      }),
      this.prisma.recipe.aggregate({
        where: { authorId: userId, status: RecipeStatus.PUBLISHED, deletedAt: null },
        _sum: { views: true, likes: true },
      }),
      this.prisma.story.aggregate({
        where: { authorId: userId, status: StoryStatus.PUBLISHED, deletedAt: null },
        _sum: { views: true, likes: true },
      }),
      this.prisma.recipe.findFirst({
        where: { authorId: userId, status: RecipeStatus.PUBLISHED, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          mainImage: true,
          views: true,
          likes: true,
          totalTimeReq: true,
          calories: true,
          createdAt: true,
        },
      }),
      this.prisma.story.findFirst({
        where: { authorId: userId, status: StoryStatus.PUBLISHED, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          title: true,
          coverImage: true,
          views: true,
          likes: true,
          shortDesc: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      stats: {
        points: user?.points || 0,
        recipes: user?._count.recipes || 0,
        stories: user?._count.stories || 0,
        followers: user?._count.followers || 0,
        totalViews: (recipeTotals._sum.views || 0) + (storyTotals._sum.views || 0),
        totalLikes: (recipeTotals._sum.likes || 0) + (storyTotals._sum.likes || 0),
      },
      latestRecipe: latestRecipe && {
        ...latestRecipe,
        createdAt: latestRecipe.createdAt.toISOString(),
      },
      latestStory: latestStory && {
        ...latestStory,
        createdAt: latestStory.createdAt.toISOString(),
      },
    };
  }

  async analytics(userId: string, query: StudioAnalyticsQueryDto) {
    const skip = (query.page - 1) * query.limit;

    if (query.type === 'stories') {
      const where = { authorId: userId, status: StoryStatus.PUBLISHED, deletedAt: null };
      const [total, totals, stories] = await Promise.all([
        this.prisma.story.count({ where }),
        this.prisma.story.aggregate({ where, _sum: { views: true, likes: true } }),
        this.prisma.story.findMany({
          where,
          orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: query.limit,
          select: { id: true, title: true, coverImage: true, views: true, likes: true },
        }),
      ]);
      return {
        type: query.type,
        items: stories.map((story) => ({
          id: story.id,
          title: story.title,
          image: story.coverImage,
          views: story.views,
          likes: story.likes,
        })),
        total,
        page: query.page,
        limit: query.limit,
        hasMore: skip + stories.length < total,
        totalViews: totals._sum.views || 0,
        totalLikes: totals._sum.likes || 0,
      };
    }

    const where = { authorId: userId, status: RecipeStatus.PUBLISHED, deletedAt: null };
    const [total, totals, recipes] = await Promise.all([
      this.prisma.recipe.count({ where }),
      this.prisma.recipe.aggregate({ where, _sum: { views: true, likes: true } }),
      this.prisma.recipe.findMany({
        where,
        orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
        select: { id: true, name: true, mainImage: true, views: true, likes: true },
      }),
    ]);

    return {
      type: query.type,
      items: recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.name,
        image: recipe.mainImage,
        views: recipe.views,
        likes: recipe.likes,
      })),
      total,
      page: query.page,
      limit: query.limit,
      hasMore: skip + recipes.length < total,
      totalViews: totals._sum.views || 0,
      totalLikes: totals._sum.likes || 0,
    };
  }
}
