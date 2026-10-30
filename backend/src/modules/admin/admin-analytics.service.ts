import { Injectable } from '@nestjs/common';
import { AccountStatus, RecipeStatus, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const publishedRecipes = { status: RecipeStatus.PUBLISHED, deletedAt: null };
    const publishedStories = { status: StoryStatus.PUBLISHED, deletedAt: null };
    const activeUsers = { status: AccountStatus.ACTIVE, deletedAt: null };
    const joinedSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      userCount,
      recentUserCount,
      recipeCount,
      storyCount,
      recipeTotals,
      storyTotals,
      topRecipes,
      topStories,
    ] = await Promise.all([
      this.prisma.user.count({ where: activeUsers }),
      this.prisma.user.count({ where: { ...activeUsers, createdAt: { gte: joinedSince } } }),
      this.prisma.recipe.count({ where: publishedRecipes }),
      this.prisma.story.count({ where: publishedStories }),
      this.prisma.recipe.aggregate({ where: publishedRecipes, _sum: { views: true, likes: true } }),
      this.prisma.story.aggregate({ where: publishedStories, _sum: { views: true, likes: true } }),
      this.prisma.recipe.findMany({
        where: publishedRecipes,
        orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: { id: true, slug: true, name: true, views: true, likes: true },
      }),
      this.prisma.story.findMany({
        where: publishedStories,
        orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        select: { id: true, slug: true, title: true, views: true, likes: true },
      }),
    ]);

    return {
      totals: {
        activeUsers: userCount,
        usersJoinedLast30Days: recentUserCount,
        publishedRecipes: recipeCount,
        publishedStories: storyCount,
        contentViews: (recipeTotals._sum.views || 0) + (storyTotals._sum.views || 0),
        contentLikes: (recipeTotals._sum.likes || 0) + (storyTotals._sum.likes || 0),
      },
      topRecipes: topRecipes.map((recipe) => ({
        id: recipe.id,
        slug: recipe.slug,
        title: recipe.name,
        views: recipe.views,
        likes: recipe.likes,
      })),
      topStories: topStories.map((story) => ({
        id: story.id,
        slug: story.slug,
        title: story.title,
        views: story.views,
        likes: story.likes,
      })),
    };
  }
}
