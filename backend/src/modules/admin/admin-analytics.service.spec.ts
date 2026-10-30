import type { PrismaService } from '../../database/prisma.service';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('AdminAnalyticsService', () => {
  it('returns aggregate platform totals and the most viewed published content', async () => {
    const prisma = {
      user: { count: jest.fn().mockResolvedValueOnce(42).mockResolvedValueOnce(7) },
      recipe: {
        count: jest.fn().mockResolvedValue(18),
        aggregate: jest.fn().mockResolvedValue({ _sum: { views: 1200, likes: 80 } }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'recipe-1', slug: 'roast', name: 'Sunday roast', views: 300, likes: 21 },
        ]),
      },
      story: {
        count: jest.fn().mockResolvedValue(4),
        aggregate: jest.fn().mockResolvedValue({ _sum: { views: 200, likes: 20 } }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'story-1', slug: 'kitchen-notes', title: 'Kitchen notes', views: 90, likes: 8 },
        ]),
      },
    } as unknown as PrismaService;

    const service = new AdminAnalyticsService(prisma);

    await expect(service.overview()).resolves.toEqual({
      totals: {
        activeUsers: 42,
        usersJoinedLast30Days: 7,
        publishedRecipes: 18,
        publishedStories: 4,
        contentViews: 1400,
        contentLikes: 100,
      },
      topRecipes: [{ id: 'recipe-1', slug: 'roast', title: 'Sunday roast', views: 300, likes: 21 }],
      topStories: [{ id: 'story-1', slug: 'kitchen-notes', title: 'Kitchen notes', views: 90, likes: 8 }],
    });
  });
});
