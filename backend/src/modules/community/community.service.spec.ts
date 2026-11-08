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

  describe('upvotes', () => {
    const authorId = 'author-1';

    const build = (overrides: Record<string, unknown> = {}) => {
      const prisma = {
        discussion: { findUnique: jest.fn().mockResolvedValue({ id: 'thread-1' }) },
        comment: { findFirst: jest.fn().mockResolvedValue({ id: 'comment-1' }) },
        like: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          count: jest.fn().mockResolvedValue(1),
          findUnique: jest.fn().mockResolvedValue({ id: 'like-1' }),
        },
        ...overrides,
      };
      const abuse = { checkUserAction: jest.fn().mockResolvedValue(undefined) };
      const service = new CommunityService(
        prisma as unknown as PrismaService,
        abuse as never,
        {} as never,
        {} as never,
      );
      return { service, prisma, abuse };
    };

    it('lets the author upvote their own thread', async () => {
      const { service, prisma } = build();

      await expect(service.like(authorId, 'thread-1')).resolves.toEqual({ likes: 1, liked: true });

      expect(prisma.like.createMany).toHaveBeenCalledWith({
        data: [{ userId: authorId, discussionId: 'thread-1' }],
        skipDuplicates: true,
      });
    });

    it('lets the author upvote their own comment', async () => {
      const { service, prisma } = build();

      await expect(service.likeComment(authorId, 'comment-1')).resolves.toEqual({ likes: 1, liked: true });

      expect(prisma.like.createMany).toHaveBeenCalledWith({
        data: [{ userId: authorId, commentId: 'comment-1' }],
        skipDuplicates: true,
      });
    });

    it('takes back only the caller\'s own comment vote', async () => {
      const { service, prisma } = build({
        like: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          count: jest.fn().mockResolvedValue(0),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      });

      await expect(service.unlikeComment('reader-1', 'comment-1')).resolves.toEqual({ likes: 0, liked: false });

      expect(prisma.like.deleteMany).toHaveBeenCalledWith({ where: { userId: 'reader-1', commentId: 'comment-1' } });
    });

    it('rejects votes on comments that are deleted, hidden or not in a discussion', async () => {
      const { service, prisma } = build({ comment: { findFirst: jest.fn().mockResolvedValue(null) } });

      await expect(service.likeComment('reader-1', 'gone')).rejects.toThrow('Comment not found');

      expect(prisma.like.createMany).not.toHaveBeenCalled();
    });

    it('reports the signed-in reader\'s own vote state for a thread', async () => {
      const { service } = build({
        like: { count: jest.fn().mockResolvedValue(4), findUnique: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.discussionLikeState('reader-1', 'thread-1')).resolves.toEqual({ likes: 4, liked: false });
    });
  });
});
