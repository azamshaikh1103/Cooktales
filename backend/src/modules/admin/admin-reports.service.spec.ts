import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { AdminReportsService } from './admin-reports.service';

const ids = {
  discussion: '00000000-0000-4000-8000-000000000001',
  comment: '00000000-0000-4000-8000-000000000002',
  recipe: '00000000-0000-4000-8000-000000000003',
  story: '00000000-0000-4000-8000-000000000004',
  gone: '00000000-0000-4000-8000-000000000005',
};
const author = { id: 'author-1', name: 'Chef Ana' };
const at = (day: number) => new Date(`2026-11-0${day}T10:00:00.000Z`);

describe('AdminReportsService', () => {
  const build = () => {
    const prisma = {
      report: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      discussion: { findMany: jest.fn().mockResolvedValue([]) },
      comment: { findMany: jest.fn().mockResolvedValue([]) },
      recipe: { findMany: jest.fn().mockResolvedValue([]) },
      story: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const community = {
      deleteDiscussion: jest.fn().mockResolvedValue({}),
      deleteComment: jest.fn().mockResolvedValue({}),
    };
    const recipes = { hide: jest.fn().mockResolvedValue({}) };
    const stories = { hide: jest.fn().mockResolvedValue({}) };
    const service = new AdminReportsService(prisma as unknown as PrismaService, community as never, recipes as never, stories as never);
    return { service, prisma, community, recipes, stories };
  };

  describe('list', () => {
    it('groups reports per target with the target summary', async () => {
      const { service, prisma } = build();
      const group = (targetType: string, targetId: string, count: number, day: number) => ({
        targetType, targetId, _count: { _all: count }, _max: { createdAt: at(day) },
      });
      prisma.report.groupBy
        .mockResolvedValueOnce([
          group('DISCUSSION', ids.discussion, 3, 5),
          group('COMMENT', ids.comment, 2, 4),
          group('RECIPE', ids.recipe, 1, 3),
          group('STORY', ids.story, 1, 2),
          group('RECIPE', ids.gone, 1, 1),
        ])
        .mockResolvedValueOnce(new Array(7).fill({}));
      const row = (targetType: string, targetId: string, reason: string, details: string | null, day: number) => ({
        targetType, targetId, reason, details, createdAt: at(day), reporter: { name: `Reporter ${day}` },
      });
      prisma.report.findMany.mockResolvedValue([
        row('DISCUSSION', ids.discussion, 'SPAM', 'buy now', 5),
        row('DISCUSSION', ids.discussion, 'SPAM', '   ', 4),
        row('DISCUSSION', ids.discussion, 'HARASSMENT', null, 3),
        row('COMMENT', ids.comment, 'OTHER', 'rude', 4),
        row('COMMENT', ids.comment, 'OTHER', null, 3),
        row('RECIPE', ids.recipe, 'COPYRIGHT', null, 3),
        row('STORY', ids.story, 'SPAM', null, 2),
        row('RECIPE', ids.gone, 'SPAM', null, 1),
      ]);
      prisma.discussion.findMany.mockResolvedValue([
        { id: ids.discussion, title: 'Best knife?', content: `<p>${'word '.repeat(80)}</p>`, slug: 'best-knife', deletedAt: null, author },
      ]);
      prisma.comment.findMany.mockResolvedValue([
        { id: ids.comment, content: '<p>Hello &amp; welcome</p>', status: 'REMOVED', deletedAt: null, author, discussion: { title: 'Best knife?', slug: 'best-knife' } },
      ]);
      prisma.recipe.findMany.mockResolvedValue([
        { id: ids.recipe, name: 'Dal', about: 'Lentils', slug: 'dal', status: 'PUBLISHED', deletedAt: null, author },
      ]);
      prisma.story.findMany.mockResolvedValue([
        { id: ids.story, title: 'My trip', shortDesc: 'Goa', slug: 'my-trip', status: 'ARCHIVED', deletedAt: null, author },
      ]);

      const result = await service.list({ status: 'OPEN', page: 1, limit: 5 });

      expect(prisma.report.groupBy).toHaveBeenCalledTimes(2);
      expect(prisma.report.findMany).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ page: 1, limit: 5, total: 7, hasMore: true });
      const [discussion, comment, recipe, story, gone] = result.reports;

      expect(discussion).toMatchObject({
        targetType: 'DISCUSSION',
        status: 'OPEN',
        reportCount: 3,
        lastReportedAt: at(5).toISOString(),
        reasons: { SPAM: 2, HARASSMENT: 1 },
        notes: [{ reason: 'SPAM', details: 'buy now', reporterName: 'Reporter 5', createdAt: at(5).toISOString() }],
        target: { title: 'Best knife?', author, url: '/community/discussion/best-knife', state: 'ACTIVE' },
      });
      expect(discussion.target.excerpt.length).toBeLessThanOrEqual(200);
      expect(discussion.target.excerpt).not.toContain('<');
      expect(comment.target).toEqual({
        title: 'Response in "Best knife?"', excerpt: 'Hello & welcome', author, url: '/community/discussion/best-knife', state: 'REMOVED',
      });
      expect(recipe.target).toEqual({ title: 'Dal', excerpt: 'Lentils', author, url: '/recipe/dal', state: 'ACTIVE' });
      expect(story.target).toEqual({ title: 'My trip', excerpt: 'Goa', author, url: '/stories/my-trip', state: 'REMOVED' });
      expect(gone.target).toEqual({ title: '[deleted]', excerpt: '', author: null, url: null, state: 'REMOVED' });
    });

    it('returns an empty page without further queries', async () => {
      const { service, prisma } = build();
      prisma.report.groupBy.mockResolvedValue([]);

      await expect(service.list({ status: 'DISMISSED', page: 1, limit: 20 })).resolves.toEqual({
        reports: [], page: 1, limit: 20, total: 0, hasMore: false,
      });
      expect(prisma.report.findMany).not.toHaveBeenCalled();
    });
  });

  describe('dismiss', () => {
    it('only resolves OPEN reports of the target', async () => {
      const { service, prisma } = build();

      await expect(service.dismiss('admin-1', 'RECIPE', ids.recipe, 'not an issue')).resolves.toEqual({ dismissed: 3 });

      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: { targetType: 'RECIPE', targetId: ids.recipe, status: 'OPEN' },
        data: { status: 'DISMISSED', resolvedById: 'admin-1', resolvedAt: expect.any(Date), resolutionNote: 'not an issue' },
      });
    });
  });

  describe('remove', () => {
    const actioned = (prisma: ReturnType<typeof build>['prisma'], note: string | null = null) =>
      expect(prisma.report.updateMany).toHaveBeenCalledWith({
        where: { targetType: expect.any(String), targetId: expect.any(String), status: 'OPEN' },
        data: { status: 'ACTIONED', resolvedById: 'admin-1', resolvedAt: expect.any(Date), resolutionNote: note },
      });

    it('deletes a discussion as an admin and marks reports actioned', async () => {
      const { service, prisma, community } = build();

      await expect(service.remove('admin-1', 'DISCUSSION', ids.discussion)).resolves.toEqual({ removed: true });

      expect(community.deleteDiscussion).toHaveBeenCalledWith({ id: 'admin-1', role: 'ADMIN' }, ids.discussion);
      actioned(prisma);
    });

    it('deletes a comment as an admin', async () => {
      const { service, prisma, community } = build();

      await service.remove('admin-1', 'COMMENT', ids.comment, 'abusive');

      expect(community.deleteComment).toHaveBeenCalledWith({ id: 'admin-1', role: 'ADMIN' }, ids.comment);
      actioned(prisma, 'abusive');
    });

    it('hides a recipe with the note, or a default reason', async () => {
      const { service, recipes } = build();

      await service.remove('admin-1', 'RECIPE', ids.recipe, 'Plagiarised');
      await service.remove('admin-1', 'RECIPE', ids.recipe);
      await service.remove('admin-1', 'RECIPE', ids.recipe, 'x');

      expect(recipes.hide).toHaveBeenNthCalledWith(1, 'admin-1', ids.recipe, { reason: 'Plagiarised' });
      expect(recipes.hide).toHaveBeenNthCalledWith(2, 'admin-1', ids.recipe, { reason: 'Removed after community reports' });
      expect(recipes.hide).toHaveBeenNthCalledWith(3, 'admin-1', ids.recipe, { reason: 'Removed after community reports' });
    });

    it('hides a story', async () => {
      const { service, stories, prisma } = build();

      await service.remove('admin-1', 'STORY', ids.story);

      expect(stories.hide).toHaveBeenCalledWith('admin-1', ids.story, { reason: 'Removed after community reports' });
      actioned(prisma);
    });

    it.each([
      ['NotFound', new NotFoundException()],
      ['Conflict', new ConflictException()],
    ])('still resolves reports when content is already gone (%s)', async (_name, error) => {
      const { service, prisma, community } = build();
      community.deleteDiscussion.mockRejectedValue(error);

      await expect(service.remove('admin-1', 'DISCUSSION', ids.discussion)).resolves.toEqual({ removed: true });
      actioned(prisma);
    });

    it('does not resolve reports when removal fails for another reason', async () => {
      const { service, prisma, community } = build();
      community.deleteComment.mockRejectedValue(new ForbiddenException());

      await expect(service.remove('admin-1', 'COMMENT', ids.comment)).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.report.updateMany).not.toHaveBeenCalled();
    });
  });
});
