import { Prisma } from '@prisma/client';
import type { PrismaService } from '../src/database/prisma.service';
import { PointsService } from '../src/modules/points/points.service';

describe('PointsService', () => {
  const tx = {
    pointHistory: { create: jest.fn(), count: jest.fn().mockResolvedValue(0) },
    user: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<void>) => callback(tx)),
  } as unknown as PrismaService;
  const service = new PointsService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('records an award and increments the chef score together', async () => {
    await expect(service.award('chef-1', 40, 'Published a recipe', 'recipe-published:recipe-1')).resolves.toBe(true);

    expect(tx.pointHistory.create).toHaveBeenCalledWith({
      data: { userId: 'chef-1', amount: 40, reason: 'Published a recipe', eventKey: 'recipe-published:recipe-1' },
    });
    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: 'chef-1' },
      data: { points: { increment: 40 } },
    });
  });

  it('does not add points again when the same action is retried', async () => {
    tx.pointHistory.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Duplicate event', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.award('chef-1', 40, 'Published a recipe', 'recipe-published:recipe-1')).resolves.toBe(false);
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('limits comment points without preventing the comment itself', async () => {
    tx.pointHistory.count.mockResolvedValueOnce(5);

    await expect(service.award('chef-1', 3, 'Posted a comment', 'recipe-comment:comment-1', 5)).resolves.toBe(false);
    expect(tx.pointHistory.create).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
