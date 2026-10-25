import { RecipeStatus, StoryStatus } from '@prisma/client';
import { StudioService } from '../src/modules/studio/studio.service';

describe('StudioService dashboard', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    recipe: { aggregate: jest.fn(), findFirst: jest.fn() },
    story: { aggregate: jest.fn(), findFirst: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns only the signed-in creator’s published content and real totals', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({
      _count: { recipes: 2, stories: 1, followers: 4 },
    });
    prisma.recipe.aggregate.mockResolvedValueOnce({ _sum: { views: 12, likes: 3 } });
    prisma.story.aggregate.mockResolvedValueOnce({ _sum: { views: 8, likes: 2 } });
    prisma.recipe.findFirst.mockResolvedValueOnce({
      id: 'recipe-1',
      slug: 'newest-recipe',
      name: 'Newest recipe',
      mainImage: 'https://images.test/recipe.jpg',
      views: 12,
      likes: 3,
      totalTimeReq: 35,
      calories: 420,
      createdAt: new Date('2026-10-24T10:00:00.000Z'),
    });
    prisma.story.findFirst.mockResolvedValueOnce({
      id: 'story-1',
      slug: 'newest-story',
      title: 'Newest story',
      coverImage: 'https://images.test/story.jpg',
      views: 8,
      likes: 2,
      shortDesc: 'A real story.',
      createdAt: new Date('2026-10-24T11:00:00.000Z'),
    });

    const service = new StudioService(prisma as never);

    await expect(service.dashboard('creator-1')).resolves.toEqual({
      stats: { points: 0, recipes: 2, stories: 1, followers: 4, totalViews: 20, totalLikes: 5 },
      latestRecipe: expect.objectContaining({ id: 'recipe-1', createdAt: '2026-10-24T10:00:00.000Z' }),
      latestStory: expect.objectContaining({ id: 'story-1', createdAt: '2026-10-24T11:00:00.000Z' }),
    });

    expect(prisma.recipe.aggregate).toHaveBeenCalledWith({
      where: { authorId: 'creator-1', status: RecipeStatus.PUBLISHED, deletedAt: null },
      _sum: { views: true, likes: true },
    });
    expect(prisma.story.aggregate).toHaveBeenCalledWith({
      where: { authorId: 'creator-1', status: StoryStatus.PUBLISHED, deletedAt: null },
      _sum: { views: true, likes: true },
    });
  });
});
