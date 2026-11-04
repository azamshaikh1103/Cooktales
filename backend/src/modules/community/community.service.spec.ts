import type { PrismaService } from '../../database/prisma.service';
import { CommunityService } from './community.service';

describe('CommunityService', () => {
  it('only ranks chefs who have earned points', async () => {
    const prisma = {
      $transaction: jest.fn((queries: unknown[]) => Promise.all(queries as Promise<unknown>[])),
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    } as unknown as PrismaService;
    const service = new CommunityService(prisma, {} as never, {} as never, {} as never);

    await service.leaderboard({ page: 1, limit: 50 });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null, role: 'CHEF', points: { gt: 0 } },
      }),
    );
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { deletedAt: null, role: 'CHEF', points: { gt: 0 } },
    });
  });
});
