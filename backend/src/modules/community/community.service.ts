import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryResourceType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { MediaService } from '../media/media.service';
import { POINTS, PointsService } from '../points/points.service';
import { CommunityAbuseService } from './community-abuse.service';
import { CreateCommentDto, CreateDiscussionDto, ListDiscussionsQueryDto, ListLeaderboardQueryDto } from './dto/community.dto';

const userSelect = { id: true, name: true, username: true, image: true, isPro: true, points: true } satisfies Prisma.UserSelect;

// Shown instead of the author once a thread or comment is deleted.
const DELETED_AUTHOR = { id: '', name: '[deleted]', username: null, image: null, isPro: false, points: 0 };

type CommentLike = { deletedAt: Date | null; status: string };
type DeletedCommentPlaceholder<Replies> = {
  id: string;
  createdAt: Date;
  content: string;
  author: typeof DELETED_AUTHOR;
  likes: never[];
  replies: Replies;
  deleted: true;
};

// Counts that ignore deleted comments, so listings never show numbers for content nobody can see.
const listCount = { select: { likes: true, comments: { where: { deletedAt: null, status: 'VISIBLE' as const } } } };
const discussionInclude = {
  author: { select: userSelect },
  _count: listCount,
  comments: {
    where: { parentId: null }, orderBy: { createdAt: 'asc' as const },
    include: {
      author: { select: userSelect }, likes: { select: { userId: true } },
      replies: { orderBy: { createdAt: 'asc' as const }, include: { author: { select: userSelect }, likes: { select: { userId: true } } } },
    },
  },
} satisfies Prisma.DiscussionInclude;

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abuse: CommunityAbuseService,
    private readonly media: MediaService,
    private readonly points: PointsService,
  ) {}

  async snapshot() {
    const [topDiscussions, activeChallenge, topChefs, totalRecipes, totalStories, totalChefs, totalDiscussions] = await this.prisma.$transaction([
      this.prisma.discussion.findMany({ where: { deletedAt: null }, take: 5, orderBy: [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }], include: { author: { select: userSelect }, _count: listCount } }),
      this.prisma.challenge.findFirst({ where: { isActive: true, endDate: { gt: new Date() } }, orderBy: { endDate: 'asc' }, include: { _count: { select: { entries: true } } } }),
      this.prisma.user.findMany({ where: { deletedAt: null, role: 'CHEF', points: { gt: 0 } }, take: 5, orderBy: [{ points: 'desc' }, { createdAt: 'asc' }], select: userSelect }),
      this.prisma.recipe.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.story.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.discussion.count({ where: { deletedAt: null } }),
    ]);
    return { topDiscussions, activeChallenge, topChefs, totalRecipes, totalStories, totalChefs, totalDiscussions };
  }

  async listDiscussions(query: ListDiscussionsQueryDto) {
    const page = query.page || 1; const limit = query.limit || 20; const skip = (page - 1) * limit;
    const where: Prisma.DiscussionWhereInput = { deletedAt: null };
    if (query.category && query.category !== 'All Topics') where.category = query.category;
    if (query.search) where.OR = [{ title: { contains: query.search, mode: 'insensitive' } }, { content: { contains: query.search, mode: 'insensitive' } }];
    const orderBy = query.sort === 'popular' ? [{ likes: { _count: 'desc' as const } }, { createdAt: 'desc' as const }] : [{ createdAt: 'desc' as const }];
    const [discussions, total] = await this.prisma.$transaction([
      this.prisma.discussion.findMany({ where, skip, take: limit, orderBy, include: { author: { select: userSelect }, _count: listCount } }),
      this.prisma.discussion.count({ where }),
    ]);
    return { discussions, page, limit, total, hasMore: skip + discussions.length < total };
  }

  async getDiscussion(slug: string) {
    const discussion = await this.prisma.discussion.findUnique({ where: { slug }, include: discussionInclude });
    if (!discussion) throw new NotFoundException('Discussion not found');
    const comments = this.visibleComments(discussion.comments);
    if (discussion.deletedAt) {
      // The page stays reachable so links and replies keep their context, but nothing is leaked.
      return {
        discussion: {
          ...discussion,
          title: '[deleted]',
          content: '',
          author: DELETED_AUTHOR,
          comments,
          deleted: true as const,
          removedBy: discussion.deletedById === discussion.authorId ? ('author' as const) : ('moderator' as const),
        },
        attachments: { recipes: [], stories: [] },
      };
    }
    const ids = this.extractAttachmentIds(discussion.content);
    const [recipes, stories] = await Promise.all([
      ids.recipes.length ? this.prisma.recipe.findMany({ where: { id: { in: ids.recipes } }, select: { id: true, name: true, mainImage: true, ratings: true, author: { select: { name: true } } } }) : [],
      ids.stories.length ? this.prisma.story.findMany({ where: { id: { in: ids.stories }, deletedAt: null }, select: { id: true, title: true, shortDesc: true, coverImage: true, author: { select: { name: true } } } }) : [],
    ]);
    return { discussion: { ...discussion, comments, deleted: false as const }, attachments: { recipes, stories } };
  }

  async leaderboard(query: ListLeaderboardQueryDto) {
    const page = query.page || 1; const limit = query.limit || 50; const skip = (page - 1) * limit;
    const where = { deletedAt: null, role: 'CHEF' as const, points: { gt: 0 } };
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: [{ points: 'desc' }, { createdAt: 'asc' }], select: userSelect }),
      this.prisma.user.count({ where }),
    ]);
    return { users, page, limit, total, hasMore: skip + users.length < total };
  }

  async listChallenges() {
    const challenges = await this.prisma.challenge.findMany({ orderBy: [{ isActive: 'desc' }, { endDate: 'desc' }], include: { _count: { select: { entries: true } } } });
    return { challenges };
  }

  async getChallenge(id: string) {
    const challenge = await this.prisma.challenge.findUnique({ where: { id }, include: { _count: { select: { entries: true } }, entries: { take: 24, orderBy: { createdAt: 'desc' }, include: { recipe: { select: { id: true, slug: true, name: true, mainImage: true, likes: true } }, user: { select: userSelect } } } } });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return { challenge };
  }

  async createDiscussion(userId: string, dto: CreateDiscussionDto) {
    await this.abuse.checkUserAction(userId, 'create', 5, 60 * 60);
    const imagePublicIds = (dto.attachments || []).filter((attachment) => attachment.type === 'image').map((attachment) => attachment.publicId).filter((id): id is string => Boolean(id));
    if (imagePublicIds.length !== (dto.attachments || []).filter((attachment) => attachment.type === 'image').length) {
      throw new BadRequestException('Image attachments must include a verified media id');
    }
    await this.media.assertAttachableUploads(userId, imagePublicIds);
    const id = randomUUID();
    const moved = await this.media.relocateThreadUploads(userId, id, imagePublicIds);
    const attachments = (dto.attachments || []).map((attachment) => {
      const replacement = attachment.publicId ? moved.get(attachment.publicId) : undefined;
      return replacement ? { ...attachment, id: replacement.url, publicId: replacement.publicId } : attachment;
    });
    const content = this.appendAttachments(dto.content, attachments);
    let discussion;
    try {
      discussion = await this.prisma.discussion.create({ data: { id, title: dto.title, content, category: dto.category, authorId: userId, slug: await this.uniqueSlug(dto.title) }, include: { author: { select: userSelect }, _count: listCount } });
    } catch (error) {
      await this.media.scheduleDeletion(userId, [...moved.values()].map((asset) => ({ publicId: asset.publicId, resourceType: CloudinaryResourceType.IMAGE })));
      throw error;
    }
    return { discussion };
  }

  async createComment(userId: string, discussionId: string, dto: CreateCommentDto) {
    await this.abuse.checkUserAction(userId, 'comment', 20, 60 * 60);
    const exists = await this.prisma.discussion.findFirst({ where: { id: discussionId, deletedAt: null }, select: { id: true } });
    if (!exists) throw new NotFoundException('Discussion not found');
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({ where: { id: dto.parentId, discussionId, parentId: null, deletedAt: null, status: 'VISIBLE' }, select: { id: true } });
      if (!parent) throw new BadRequestException('Replies can only be made to a top-level discussion comment');
    }
    const comment = await this.prisma.comment.create({ data: { content: dto.content, authorId: userId, discussionId, parentId: dto.parentId }, include: { author: { select: userSelect }, likes: { select: { userId: true } } } });
    await this.points.award(userId, POINTS.COMMENT, 'Posted a comment', `discussion-comment:${comment.id}`, POINTS.COMMENT_DAILY_LIMIT);
    return { comment };
  }

  async like(userId: string, discussionId: string) {
    await this.abuse.checkUserAction(userId, 'like', 60, 60);
    await this.ensureDiscussion(discussionId);
    await this.prisma.like.createMany({ data: [{ userId, discussionId }], skipDuplicates: true });
    return this.likeState(userId, discussionId);
  }

  async unlike(userId: string, discussionId: string) {
    await this.abuse.checkUserAction(userId, 'unlike', 60, 60);
    await this.ensureDiscussion(discussionId);
    await this.prisma.like.deleteMany({ where: { userId, discussionId } });
    return this.likeState(userId, discussionId);
  }

  /**
   * Deleting a thread keeps the page reachable (links and replies keep their context) but removes
   * it from every listing, search and count. The author's deletion also wipes the title and text;
   * a moderator's removal keeps them for review. Nobody can add comments or votes afterwards.
   */
  async deleteDiscussion(actor: { id: string; role: string }, discussionId: string) {
    await this.abuse.checkUserAction(actor.id, 'delete', 20, 60 * 60);
    const discussion = await this.prisma.discussion.findFirst({
      where: { id: discussionId, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!discussion) throw new NotFoundException('Discussion not found');
    const isAuthor = discussion.authorId === actor.id;
    if (!isAuthor && actor.role !== 'ADMIN') throw new ForbiddenException('You can only delete your own threads');
    await this.prisma.discussion.update({
      where: { id: discussionId },
      data: { deletedAt: new Date(), deletedById: actor.id, ...(isAuthor ? { title: '[deleted]', content: '' } : {}) },
    });
    return { message: 'Thread deleted' };
  }

  /**
   * A deleted comment with replies stays as a "[deleted]" placeholder so the replies keep their
   * context; one without replies disappears. Points it earned are taken back.
   */
  async deleteComment(actor: { id: string; role: string }, commentId: string) {
    await this.abuse.checkUserAction(actor.id, 'delete', 60, 60 * 60);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, discussionId: { not: null }, deletedAt: null, status: 'VISIBLE' },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    const isAuthor = comment.authorId === actor.id;
    if (!isAuthor && actor.role !== 'ADMIN') throw new ForbiddenException('You can only delete your own comments');
    await this.prisma.comment.update({
      where: { id: commentId },
      data: { status: 'REMOVED', deletedAt: new Date(), ...(isAuthor ? { content: '' } : {}) },
    });
    await this.points.revoke(comment.authorId, `discussion-comment:${commentId}`, 'Comment removed');
    return { message: 'Comment deleted' };
  }

  private visibleComments<C extends CommentLike & { id: string; createdAt: Date; replies: CommentLike[] }>(comments: C[]) {
    const isLive = (item: CommentLike) => !item.deletedAt && item.status === 'VISIBLE';
    const result: Array<(C & { deleted: false }) | DeletedCommentPlaceholder<C['replies']>> = [];
    for (const comment of comments) {
      const replies = comment.replies.filter(isLive) as C['replies'];
      if (isLive(comment)) {
        result.push({ ...comment, replies, deleted: false });
      } else if (replies.length) {
        result.push({ id: comment.id, createdAt: comment.createdAt, content: '', author: DELETED_AUTHOR, likes: [], replies, deleted: true });
      }
    }
    return result;
  }

  async discussionLikeState(userId: string, discussionId: string) {
    await this.ensureDiscussion(discussionId);
    return this.likeState(userId, discussionId);
  }

  // Anyone signed in can upvote, including the author: one vote per account, and it can be taken back.
  async likeComment(userId: string, commentId: string) {
    await this.abuse.checkUserAction(userId, 'like', 60, 60);
    await this.ensureComment(commentId);
    await this.prisma.like.createMany({ data: [{ userId, commentId }], skipDuplicates: true });
    return this.commentLikeState(userId, commentId);
  }

  async unlikeComment(userId: string, commentId: string) {
    await this.abuse.checkUserAction(userId, 'unlike', 60, 60);
    await this.ensureComment(commentId);
    await this.prisma.like.deleteMany({ where: { userId, commentId } });
    return this.commentLikeState(userId, commentId);
  }

  async recordView(id: string, ip?: string, userAgent?: string) {
    await this.ensureDiscussion(id);
    await this.abuse.checkUserAction(`${ip || 'unknown'}:${userAgent || 'unknown'}`, 'view', 120, 60);
    return this.prisma.discussion.update({ where: { id }, data: { views: { increment: 1 } }, select: { views: true } });
  }

  private async ensureDiscussion(id: string) { if (!await this.prisma.discussion.findFirst({ where: { id, deletedAt: null }, select: { id: true } })) throw new NotFoundException('Discussion not found'); }
  private async ensureComment(id: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, discussionId: { not: null }, deletedAt: null, status: 'VISIBLE', discussion: { deletedAt: null } },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
  }

  private async commentLikeState(userId: string, commentId: string) {
    const [likes, liked] = await Promise.all([
      this.prisma.like.count({ where: { commentId } }),
      this.prisma.like.findUnique({ where: { userId_commentId: { userId, commentId } }, select: { id: true } }),
    ]);
    return { likes, liked: Boolean(liked) };
  }

  private async likeState(userId: string, discussionId: string) { const [likes, liked] = await Promise.all([this.prisma.like.count({ where: { discussionId } }), this.prisma.like.findUnique({ where: { userId_discussionId: { userId, discussionId } }, select: { id: true } })]); return { likes, liked: Boolean(liked) }; }
  private async uniqueSlug(title: string) { const base = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 110) || 'discussion'; for (let suffix = 0; suffix < 20; suffix += 1) { const candidate = suffix ? `${base}-${suffix + 1}` : base; if (!await this.prisma.discussion.findUnique({ where: { slug: candidate }, select: { id: true } })) return candidate; } return `${base}-${randomUUID().slice(0, 8)}`; }
  private appendAttachments(content: string, attachments: { type: 'image' | 'recipe' | 'story'; id: string; publicId?: string }[]) { if (attachments.length > 12) throw new BadRequestException('A discussion can have at most 12 attachments'); const markers = attachments.map((item) => { if (item.type === 'image') { try { const url = new URL(item.id); if (url.protocol !== 'https:' || !item.publicId) throw new Error(); this.media.assertCloudinaryUrl(url.toString()); return `![Image](${url.toString()})`; } catch { throw new BadRequestException('Image attachments must use verified secure URLs'); } } if (!/^[a-zA-Z0-9-]{1,64}$/.test(item.id)) throw new BadRequestException('Invalid attached content'); return `[${item.type === 'recipe' ? 'RECIPE' : 'BLOG'}:${item.id}]`; }); return markers.length ? `${content}\n\n${markers.join('\n')}` : content; }
  private extractAttachmentIds(content: string) { return { recipes: [...content.matchAll(/\[RECIPE:([a-zA-Z0-9-]+)\]/g)].map((match) => match[1]).slice(0, 12), stories: [...content.matchAll(/\[BLOG:([a-zA-Z0-9-]+)\]/g)].map((match) => match[1]).slice(0, 12) }; }
}
