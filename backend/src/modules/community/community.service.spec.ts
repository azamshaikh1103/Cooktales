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
        discussion: { findFirst: jest.fn().mockResolvedValue({ id: 'thread-1' }) },
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

  describe('deleting', () => {
    const author = { id: 'author-1', role: 'CHEF' };
    const admin = { id: 'admin-1', role: 'ADMIN' };
    const stranger = { id: 'reader-1', role: 'CHEF' };

    const build = (overrides: Record<string, unknown> = {}) => {
      const prisma = {
        $transaction: jest.fn((queries: unknown[]) => Promise.all(queries as Promise<unknown>[])),
        discussion: {
          findFirst: jest.fn().mockResolvedValue({ id: 'thread-1', authorId: 'author-1' }),
          findUnique: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(0),
          update: jest.fn().mockResolvedValue({}),
        },
        comment: {
          findFirst: jest.fn().mockResolvedValue({ id: 'comment-1', authorId: 'author-1' }),
          update: jest.fn().mockResolvedValue({}),
        },
        ...overrides,
      };
      const abuse = { checkUserAction: jest.fn().mockResolvedValue(undefined) };
      const points = { revoke: jest.fn().mockResolvedValue(true), award: jest.fn() };
      const service = new CommunityService(prisma as unknown as PrismaService, abuse as never, {} as never, points as never);
      return { service, prisma, points };
    };

    it('wipes the title and text when the author deletes their thread', async () => {
      const { service, prisma } = build();

      await service.deleteDiscussion(author, 'thread-1');

      expect(prisma.discussion.update).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
        data: { deletedAt: expect.any(Date), deletedById: 'author-1', title: '[deleted]', content: '' },
      });
    });

    it('keeps the text for review when an admin removes someone else\'s thread', async () => {
      const { service, prisma } = build();

      await service.deleteDiscussion(admin, 'thread-1');

      expect(prisma.discussion.update).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
        data: { deletedAt: expect.any(Date), deletedById: 'admin-1' },
      });
    });

    it('does not let other users delete a thread', async () => {
      const { service, prisma } = build();

      await expect(service.deleteDiscussion(stranger, 'thread-1')).rejects.toThrow('You can only delete your own threads');

      expect(prisma.discussion.update).not.toHaveBeenCalled();
    });

    it('cannot delete a thread twice or one that does not exist', async () => {
      const { service, prisma } = build({
        discussion: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() },
      });

      await expect(service.deleteDiscussion(author, 'thread-1')).rejects.toThrow('Discussion not found');

      expect(prisma.discussion.update).not.toHaveBeenCalled();
    });

    it('removes a comment, wipes its text and takes back the points it earned', async () => {
      const { service, prisma, points } = build();

      await service.deleteComment(author, 'comment-1');

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { status: 'REMOVED', deletedAt: expect.any(Date), content: '' },
      });
      expect(points.revoke).toHaveBeenCalledWith('author-1', 'discussion-comment:comment-1', 'Comment removed');
    });

    it('lets an admin remove a comment but keeps the text for review', async () => {
      const { service, prisma, points } = build();

      await service.deleteComment(admin, 'comment-1');

      expect(prisma.comment.update).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
        data: { status: 'REMOVED', deletedAt: expect.any(Date) },
      });
      expect(points.revoke).toHaveBeenCalledWith('author-1', 'discussion-comment:comment-1', 'Comment removed');
    });

    it('does not let other users delete a comment', async () => {
      const { service, prisma, points } = build();

      await expect(service.deleteComment(stranger, 'comment-1')).rejects.toThrow('You can only delete your own comments');

      expect(prisma.comment.update).not.toHaveBeenCalled();
      expect(points.revoke).not.toHaveBeenCalled();
    });

    it('shows a deleted thread as [deleted] without leaking its author or text', async () => {
      const { service, prisma } = build();
      prisma.discussion.findUnique.mockResolvedValue({
        id: 'thread-1',
        authorId: 'author-1',
        title: 'Secret title',
        content: 'Secret text',
        deletedAt: new Date(),
        deletedById: 'author-1',
        author: { id: 'author-1', name: 'Real Name', username: 'real', image: null, isPro: false, points: 5 },
        comments: [],
      });

      const { discussion, attachments } = await service.getDiscussion('thread');

      expect(discussion).toMatchObject({ title: '[deleted]', content: '', deleted: true, removedBy: 'author' });
      expect(discussion.author.name).toBe('[deleted]');
      expect(attachments).toEqual({ recipes: [], stories: [] });
    });

    it('keeps a deleted comment as a placeholder only when it has replies', async () => {
      const { service, prisma } = build();
      const at = new Date('2026-11-01T00:00:00Z');
      const live = (id: string) => ({ id, createdAt: at, deletedAt: null, status: 'VISIBLE', content: id, replies: [] });
      const gone = (id: string) => ({ id, createdAt: at, deletedAt: at, status: 'REMOVED', content: '', replies: [] });
      prisma.discussion.findUnique.mockResolvedValue({
        id: 'thread-1',
        authorId: 'author-1',
        title: 'Hello',
        content: 'plain text',
        deletedAt: null,
        comments: [
          { ...gone('parent-with-reply'), replies: [live('reply-1'), gone('reply-2')] },
          { ...gone('parent-alone') },
          { ...live('parent-live'), replies: [gone('reply-3')] },
        ],
      });

      const { discussion } = await service.getDiscussion('thread');

      expect(discussion.deleted).toBe(false);
      expect(discussion.comments.map((comment) => comment.id)).toEqual(['parent-with-reply', 'parent-live']);
      const [placeholder, remaining] = discussion.comments;
      expect(placeholder).toMatchObject({ deleted: true, content: '' });
      expect(placeholder.replies.map((reply) => reply.id)).toEqual(['reply-1']);
      expect(remaining.replies).toEqual([]);
    });

    it('hides deleted threads from listings', async () => {
      const { service, prisma } = build();

      await service.listDiscussions({ page: 1, limit: 20, sort: 'latest' });

      expect(prisma.discussion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
      );
      expect(prisma.discussion.count).toHaveBeenCalledWith({ where: expect.objectContaining({ deletedAt: null }) });
    });

    it('does not accept new comments on a deleted thread', async () => {
      const { service, prisma } = build({
        discussion: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.createComment('reader-1', 'thread-1', { content: 'hi' } as never)).rejects.toThrow(
        'Discussion not found',
      );

      expect(prisma.comment.update).not.toHaveBeenCalled();
    });
  });
});
