import type { PrismaService } from '../../database/prisma.service';
import { RecipesService } from './recipes.service';

describe('recipe pagination', () => {
  it('uses a stable order when popularity and views are tied', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      recipe: { findMany, count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((queries) => Promise.all(queries)),
    } as unknown as PrismaService;
    const service = new RecipesService(prisma, {} as never, {} as never, {} as never, {} as never);

    await service.list({ page: 2, limit: 9, sortBy: 'popular' });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 9,
        take: 9,
        orderBy: [{ popularityScore: 'desc' }, { views: 'desc' }, { id: 'asc' }],
      }),
    );
  });
});
