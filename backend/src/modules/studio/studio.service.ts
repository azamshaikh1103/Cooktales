import { Injectable } from '@nestjs/common';
import { RecipeStatus, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StudioService {
  constructor(private readonly prisma: PrismaService) {}

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
      latestRecipe: latestRecipe && { ...latestRecipe, createdAt: latestRecipe.createdAt.toISOString() },
      latestStory: latestStory && { ...latestStory, createdAt: latestStory.createdAt.toISOString() },
    };
  }

  async analytics(userId: string) {
    const [user, recipes] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      }),
      this.prisma.recipe.findMany({
        where: { authorId: userId },
        orderBy: { views: 'desc' },
        take: 5,
        select: { id: true, name: true, mainImage: true, views: true, likes: true },
      }),
    ]);

    return { user: { isPro: user?.isPro || false }, recipes };
  }
}
