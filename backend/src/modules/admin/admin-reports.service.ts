import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentStatus, RecipeStatus, ReportReason, ReportStatus, ReportTargetType, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CommunityService } from '../community/community.service';
import { AdminRecipesService } from './admin-recipes.service';
import { AdminStoriesService } from './admin-stories.service';
import type { ListAdminReportsQueryDto } from './dto/admin-reports.dto';

const NOTES_PER_GROUP = 5;
const EXCERPT_LENGTH = 200;
const DEFAULT_REMOVAL_REASON = 'Removed after community reports';

type ReportTarget = {
  title: string;
  excerpt: string;
  author: { id: string; name: string } | null;
  url: string | null;
  state: 'ACTIVE' | 'REMOVED';
};

const GONE: ReportTarget = { title: '[deleted]', excerpt: '', author: null, url: null, state: 'REMOVED' };
const authorSelect = { select: { id: true, name: true } } as const;

const targetKey = (type: ReportTargetType, id: string) => `${type}:${id}`;

function excerptOf(text: string | null | undefined) {
  const plain = (text ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > EXCERPT_LENGTH ? `${plain.slice(0, EXCERPT_LENGTH - 1).trimEnd()}…` : plain;
}

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly community: CommunityService,
    private readonly recipes: AdminRecipesService,
    private readonly stories: AdminStoriesService,
  ) {}

  async list(query: ListAdminReportsQueryDto) {
    const { status, page, limit } = query;
    const [groups, allGroups] = await Promise.all([
      this.prisma.report.groupBy({
        by: ['targetType', 'targetId'],
        where: { status },
        _count: { _all: true },
        _max: { createdAt: true },
        orderBy: [{ _count: { id: 'desc' } }, { _max: { createdAt: 'desc' } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.groupBy({ by: ['targetType', 'targetId'], where: { status } }),
    ]);
    const total = allGroups.length;
    if (!groups.length) return { reports: [], page, limit, total, hasMore: false };

    const [rows, targets] = await Promise.all([
      this.prisma.report.findMany({
        where: { status, OR: groups.map(({ targetType, targetId }) => ({ targetType, targetId })) },
        orderBy: { createdAt: 'desc' },
        select: { targetType: true, targetId: true, reason: true, details: true, createdAt: true, reporter: { select: { name: true } } },
      }),
      this.loadTargets(groups),
    ]);

    const reports = groups.map((group) => {
      const mine = rows.filter((row) => row.targetType === group.targetType && row.targetId === group.targetId);
      const reasons: Partial<Record<ReportReason, number>> = {};
      for (const row of mine) reasons[row.reason] = (reasons[row.reason] ?? 0) + 1;
      return {
        targetType: group.targetType,
        targetId: group.targetId,
        status,
        reportCount: group._count._all,
        lastReportedAt: (group._max.createdAt ?? mine[0]?.createdAt ?? new Date(0)).toISOString(),
        reasons,
        notes: mine
          .filter((row) => row.details?.trim())
          .slice(0, NOTES_PER_GROUP)
          .map((row) => ({ reason: row.reason, details: row.details as string, reporterName: row.reporter.name, createdAt: row.createdAt.toISOString() })),
        target: targets.get(targetKey(group.targetType, group.targetId)) ?? GONE,
      };
    });
    return { reports, page, limit, total, hasMore: page * limit < total };
  }

  async dismiss(adminId: string, targetType: ReportTargetType, targetId: string, note?: string) {
    const { count } = await this.resolve(adminId, targetType, targetId, ReportStatus.DISMISSED, note);
    return { dismissed: count };
  }

  async remove(adminId: string, targetType: ReportTargetType, targetId: string, note?: string) {
    try {
      await this.removeContent(adminId, targetType, targetId, note);
    } catch (error) {
      // Already removed or hidden by someone else: the reports are still resolved below.
      if (!(error instanceof NotFoundException || error instanceof ConflictException)) throw error;
    }
    await this.resolve(adminId, targetType, targetId, ReportStatus.ACTIONED, note);
    return { removed: true };
  }

  private resolve(adminId: string, targetType: ReportTargetType, targetId: string, status: ReportStatus, note?: string) {
    return this.prisma.report.updateMany({
      where: { targetType, targetId, status: ReportStatus.OPEN },
      data: { status, resolvedById: adminId, resolvedAt: new Date(), resolutionNote: note || null },
    });
  }

  private async removeContent(adminId: string, type: ReportTargetType, id: string, note?: string) {
    const actor = { id: adminId, role: 'ADMIN' };
    const reason = note && note.length >= 3 ? note : DEFAULT_REMOVAL_REASON;
    switch (type) {
      case ReportTargetType.DISCUSSION:
        return this.community.deleteDiscussion(actor, id);
      case ReportTargetType.COMMENT:
        return this.community.deleteComment(actor, id);
      case ReportTargetType.RECIPE:
        return this.recipes.hide(adminId, id, { reason });
      case ReportTargetType.STORY:
        return this.stories.hide(adminId, id, { reason });
    }
  }

  private async loadTargets(groups: Array<{ targetType: ReportTargetType; targetId: string }>) {
    const ids = (type: ReportTargetType) => groups.filter((g) => g.targetType === type).map((g) => g.targetId);
    const where = (type: ReportTargetType) => ({ id: { in: ids(type) } });
    const [discussions, comments, recipes, stories] = await Promise.all([
      ids('DISCUSSION').length
        ? this.prisma.discussion.findMany({ where: where('DISCUSSION'), select: { id: true, title: true, content: true, slug: true, deletedAt: true, author: authorSelect } })
        : [],
      ids('COMMENT').length
        ? this.prisma.comment.findMany({
            where: where('COMMENT'),
            select: { id: true, content: true, status: true, deletedAt: true, author: authorSelect, discussion: { select: { title: true, slug: true } } },
          })
        : [],
      ids('RECIPE').length
        ? this.prisma.recipe.findMany({ where: where('RECIPE'), select: { id: true, name: true, about: true, slug: true, status: true, deletedAt: true, author: authorSelect } })
        : [],
      ids('STORY').length
        ? this.prisma.story.findMany({ where: where('STORY'), select: { id: true, title: true, shortDesc: true, slug: true, status: true, deletedAt: true, author: authorSelect } })
        : [],
    ]);

    const map = new Map<string, ReportTarget>();
    for (const d of discussions) {
      map.set(targetKey('DISCUSSION', d.id), {
        title: d.title, excerpt: excerptOf(d.content), author: d.author, url: `/community/discussion/${d.slug}`, state: d.deletedAt ? 'REMOVED' : 'ACTIVE',
      });
    }
    for (const c of comments) {
      map.set(targetKey('COMMENT', c.id), {
        title: `Response in "${c.discussion?.title ?? '[deleted]'}"`,
        excerpt: excerptOf(c.content),
        author: c.author,
        url: c.discussion ? `/community/discussion/${c.discussion.slug}` : null,
        state: c.deletedAt || c.status !== CommentStatus.VISIBLE ? 'REMOVED' : 'ACTIVE',
      });
    }
    for (const r of recipes) {
      map.set(targetKey('RECIPE', r.id), {
        title: r.name,
        excerpt: excerptOf(r.about),
        author: r.author,
        url: r.slug ? `/recipe/${r.slug}` : null,
        state: r.status === RecipeStatus.PUBLISHED && !r.deletedAt ? 'ACTIVE' : 'REMOVED',
      });
    }
    for (const s of stories) {
      map.set(targetKey('STORY', s.id), {
        title: s.title,
        excerpt: excerptOf(s.shortDesc),
        author: s.author,
        url: s.slug ? `/stories/${s.slug}` : null,
        state: s.status === StoryStatus.PUBLISHED && !s.deletedAt ? 'ACTIVE' : 'REMOVED',
      });
    }
    return map;
  }
}
