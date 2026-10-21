import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CloudinaryResourceType, Prisma, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MediaService } from '../media/media.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateStoryCommentDto,
  CreateStoryDraftDto,
  ListOwnedStoriesQueryDto,
  ListStoriesQueryDto,
  UpdateStoryDto,
} from './dto/story.dto';
import { StoryAbuseService } from './story-abuse.service';

const storyInclude = {
  author: { select: { id: true, name: true, username: true, image: true, about: true } },
  content: { orderBy: { position: 'asc' as const } },
  media: { orderBy: [{ kind: 'asc' as const }, { position: 'asc' as const }] },
  comments: {
    where: { parentId: null },
    orderBy: { createdAt: 'asc' as const },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      replies: {
        orderBy: { createdAt: 'asc' as const },
        include: { author: { select: { id: true, name: true, username: true, image: true } } },
      },
    },
  },
} satisfies Prisma.StoryInclude;

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly abuse: StoryAbuseService,
    private readonly notifications: NotificationsService,
  ) {}

  async createDraft(userId: string, dto: CreateStoryDraftDto) {
    const title = dto.title?.trim() || 'Untitled Story';
    const story = dto.clientDraftId
      ? await this.prisma.story.upsert({
          where: { authorId_clientDraftId: { authorId: userId, clientDraftId: dto.clientDraftId } },
          create: { authorId: userId, clientDraftId: dto.clientDraftId, title, tags: [] },
          update: {},
          select: this.ownerStorySelect(),
        })
      : await this.prisma.story.create({
          data: { authorId: userId, title, tags: [] },
          select: this.ownerStorySelect(),
        });
    return { story: this.serialize(story) };
  }

  async list(query: ListStoriesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;
    const where: Prisma.StoryWhereInput = {
      status: StoryStatus.PUBLISHED,
      deletedAt: null,
      slug: { not: null },
    };
    if (query.ids) {
      const ids = query.ids.split(',').map((id) => id.trim()).filter(Boolean).slice(0, 50);
      where.id = { in: ids };
    }
    if (query.authorId) where.authorId = query.authorId;
    if (query.tag && query.tag !== 'All') where.tags = { has: query.tag.trim().toLowerCase() };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { shortDesc: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.trim().toLowerCase() } },
      ];
    }
    const orderBy =
      query.sortBy === 'popular'
        ? [{ popularityScore: 'desc' as const }, { views: 'desc' as const }]
        : [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }];
    const [stories, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({ where, skip, take: limit, orderBy, select: this.listStorySelect() }),
      this.prisma.story.count({ where }),
    ]);
    return { stories: stories.map((story) => this.serialize(story)), page, limit, total, hasMore: skip + stories.length < total };
  }

  async listOwned(userId: string, query: ListOwnedStoriesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const where: Prisma.StoryWhereInput = {
      authorId: userId,
      deletedAt: query.status === StoryStatus.DELETED ? { not: null } : null,
      ...(query.status ? { status: query.status } : { status: { not: StoryStatus.DELETED } }),
    };
    const [stories, total] = await this.prisma.$transaction([
      this.prisma.story.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: this.ownerStorySelect(),
      }),
      this.prisma.story.count({ where }),
    ]);
    return { stories: stories.map((story) => this.serialize(story)), page, limit, total, hasMore: page * limit < total };
  }

  async getPublic(slug: string) {
    const story = await this.prisma.story.findFirst({
      where: { slug, status: StoryStatus.PUBLISHED, deletedAt: null },
      include: storyInclude,
    });
    if (!story) throw new NotFoundException('Story not found');
    return { story: this.serialize(story) };
  }

  async getOwnerStory(userId: string, id: string) {
    const story = await this.findOwnedStory(userId, id);
    return { story: this.serialize(story) };
  }

  async update(userId: string, id: string, dto: UpdateStoryDto) {
    const current = await this.findOwnedStory(userId, id);
    await this.validateMediaUpdate(userId, current, dto);
    const expectedVersion = dto.expectedVersion ?? current.version;
    const removedMedia = dto.media
      ? current.media
          .filter((asset) => !dto.media?.some((next) => next.publicId === asset.publicId))
          .map((asset) => ({ publicId: asset.publicId, resourceType: asset.resourceType }))
      : [];
    const removedCover =
      dto.coverImagePublicId !== undefined && current.coverImagePublicId && current.coverImagePublicId !== dto.coverImagePublicId
        ? [{ publicId: current.coverImagePublicId, resourceType: CloudinaryResourceType.IMAGE }]
        : [];

    const story = await this.prisma.$transaction(async (tx) => {
      if (dto.content) {
        await tx.storyBlock.deleteMany({ where: { storyId: id } });
        if (dto.content.length) {
          await tx.storyBlock.createMany({
            data: dto.content.map((block, position) => ({
              storyId: id,
              type: block.type,
              content: block.content as Prisma.InputJsonValue,
              position,
            })),
          });
        }
      }
      if (dto.media) {
        await tx.storyMedia.deleteMany({ where: { storyId: id } });
        if (dto.media.length) {
          await tx.storyMedia.createMany({
            data: dto.media.map((media) => ({
              storyId: id,
              publicId: media.publicId,
              url: media.url,
              resourceType: media.resourceType,
              kind: media.kind,
              position: media.position || 0,
              width: media.width,
              height: media.height,
              bytes: media.bytes,
              format: media.format,
            })),
          });
        }
      }
      const updated = await tx.story.updateMany({
        where: { id, authorId: userId, deletedAt: null, version: expectedVersion },
        data: { ...this.resolveStoryData(dto), lastEditedAt: new Date(), version: { increment: 1 } },
      });
      if (updated.count !== 1) throw new ConflictException('This story was updated elsewhere. Reload before saving.');
      return tx.story.findUniqueOrThrow({ where: { id }, include: storyInclude });
    });

    await this.mediaService.scheduleDeletion(userId, [...removedMedia, ...removedCover]);
    await this.mediaService.markAttached(userId, [story.coverImagePublicId, ...story.media.map((media) => media.publicId)]);
    return { story: this.serialize(story) };
  }

  async publish(userId: string, id: string) {
    const story = await this.findOwnedStory(userId, id);
    this.assertPublishable(story);
    const published = await this.prisma.story.update({
      where: { id },
      data: {
        slug: await this.generateUniqueSlug(story.title, id),
        status: StoryStatus.PUBLISHED,
        publishedAt: story.publishedAt || new Date(),
        submittedAt: story.submittedAt || new Date(),
        lastEditedAt: new Date(),
        version: { increment: 1 },
      },
      include: storyInclude,
    });
    return { story: this.serialize(published) };
  }

  async softDelete(userId: string, id: string) {
    const story = await this.findOwnedStory(userId, id);
    await this.prisma.story.update({
      where: { id },
      data: { status: StoryStatus.DELETED, statusBeforeDelete: story.status, deletedAt: new Date(), version: { increment: 1 } },
    });
    return { message: 'Story deleted' };
  }

  async restore(userId: string, id: string) {
    const story = await this.prisma.story.findFirst({
      where: { id, authorId: userId, status: StoryStatus.DELETED, deletedAt: { not: null } },
      select: { statusBeforeDelete: true },
    });
    if (!story) throw new NotFoundException('Story not found');
    const restored = await this.prisma.story.update({
      where: { id },
      data: { status: story.statusBeforeDelete || StoryStatus.DRAFT, statusBeforeDelete: null, deletedAt: null, version: { increment: 1 } },
      include: storyInclude,
    });
    return { story: this.serialize(restored) };
  }

  async like(userId: string, id: string) {
    await this.abuse.checkUserAction(userId, 'like');
    await this.assertPublished(id);
    const created = await this.prisma.$transaction(async (tx) => {
      const created = await tx.like.createMany({ data: [{ userId, blogId: id }], skipDuplicates: true });
      if (created.count) await tx.story.update({ where: { id }, data: { likes: { increment: 1 } } });
      return Boolean(created.count);
    });
    if (created) {
      const story = await this.prisma.story.findUnique({
        where: { id },
        select: { authorId: true, title: true, slug: true },
      });
      if (story) {
        await this.notifications.create({
          recipientId: story.authorId,
          actorId: userId,
          type: 'STORY_LIKE',
          targetPath: `/stories/${story.slug || id}`,
          payload: { storyTitle: story.title },
          dedupeKey: `story-like:${userId}:${id}`,
        });
      }
    }
    return this.interactionState(userId, id);
  }

  async unlike(userId: string, id: string) {
    await this.abuse.checkUserAction(userId, 'unlike');
    await this.assertPublished(id);
    await this.prisma.$transaction(async (tx) => {
      const removed = await tx.like.deleteMany({ where: { userId, blogId: id } });
      if (removed.count) await tx.story.updateMany({ where: { id, likes: { gt: 0 } }, data: { likes: { decrement: 1 } } });
    });
    return this.interactionState(userId, id);
  }

  async bookmark(userId: string, id: string) {
    await this.abuse.checkUserAction(userId, 'bookmark');
    await this.assertPublished(id);
    await this.prisma.bookmark.upsert({ where: { userId_blogId: { userId, blogId: id } }, create: { userId, blogId: id }, update: {} });
    return this.interactionState(userId, id);
  }

  async unbookmark(userId: string, id: string) {
    await this.abuse.checkUserAction(userId, 'unbookmark');
    await this.assertPublished(id);
    await this.prisma.bookmark.deleteMany({ where: { userId, blogId: id } });
    return this.interactionState(userId, id);
  }

  async viewerState(userId: string, id: string) {
    await this.assertPublished(id);
    return this.interactionState(userId, id);
  }

  async recordView(id: string, ipAddress?: string, userAgent?: string) {
    await this.assertPublished(id);
    await this.abuse.checkUserAction(`${ipAddress || 'unknown'}:${userAgent || 'unknown'}`, 'view', 120, 60);
    return this.prisma.story.update({ where: { id }, data: { views: { increment: 1 } }, select: { views: true } });
  }

  async listComments(id: string) {
    await this.assertPublished(id);
    const comments = await this.prisma.comment.findMany({
      where: { blogId: id, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true, username: true, image: true } }, replies: { include: { author: { select: { id: true, name: true, username: true, image: true } } }, orderBy: { createdAt: 'asc' } } },
    });
    return { comments: this.serialize(comments) };
  }

  async createComment(userId: string, id: string, dto: CreateStoryCommentDto) {
    await this.abuse.checkUserAction(userId, 'comment', 15, 60);
    await this.assertPublished(id);
    let parentAuthorId: string | null = null;
    if (dto.parentId) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: dto.parentId, blogId: id },
        select: { authorId: true },
      });
      if (!parent) throw new BadRequestException('Reply target was not found');
      parentAuthorId = parent.authorId;
    }
    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: { authorId: userId, blogId: id, parentId: dto.parentId, content: dto.content.trim() },
        include: { author: { select: { id: true, name: true, username: true, image: true } } },
      });
      await tx.story.update({ where: { id }, data: { commentsCount: { increment: 1 } } });
      return created;
    });
    const story = await this.prisma.story.findUnique({
      where: { id },
      select: { authorId: true, title: true, slug: true },
    });
    if (story) {
      await this.notifications.create({
        recipientId: parentAuthorId || story.authorId,
        actorId: userId,
        type: dto.parentId ? 'STORY_COMMENT_REPLY' : 'STORY_COMMENT',
        targetPath: `/stories/${story.slug || id}#comment-${comment.id}`,
        payload: { storyTitle: story.title },
        dedupeKey: `story-comment:${comment.id}`,
      });
    }
    return { comment: this.serialize(comment) };
  }

  async deleteComment(userId: string, id: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, blogId: id }, select: { authorId: true } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('You can only delete your own comment');
    await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.comment.delete({ where: { id: commentId }, select: { _count: { select: { replies: true } } } });
      await tx.story.updateMany({ where: { id, commentsCount: { gt: 0 } }, data: { commentsCount: { decrement: deleted._count.replies + 1 } } });
    });
    return { message: 'Comment deleted' };
  }

  async assertPublished(id: string) {
    const story = await this.prisma.story.findFirst({ where: { id, status: StoryStatus.PUBLISHED, deletedAt: null }, select: { id: true } });
    if (!story) throw new NotFoundException('Story not found');
  }

  private async findOwnedStory(userId: string, id: string) {
    const story = await this.prisma.story.findFirst({ where: { id, authorId: userId, deletedAt: null }, include: storyInclude });
    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  private resolveStoryData(dto: UpdateStoryDto): Prisma.StoryUpdateInput {
    const data: Prisma.StoryUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.shortDesc !== undefined) data.shortDesc = dto.shortDesc?.trim() || '';
    if (dto.coverImage !== undefined) data.coverImage = dto.coverImage;
    if (dto.coverImagePublicId !== undefined) data.coverImagePublicId = dto.coverImagePublicId;
    if (dto.tags !== undefined) data.tags = dto.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 12);
    return data;
  }

  private async validateMediaUpdate(userId: string, current: Awaited<ReturnType<StoriesService['findOwnedStory']>>, dto: UpdateStoryDto) {
    const changesCover = dto.coverImage !== undefined || dto.coverImagePublicId !== undefined;
    if (changesCover) {
      if (!dto.coverImage || !dto.coverImagePublicId) throw new BadRequestException('Cover image URL and public ID must be updated together');
      this.mediaService.assertCloudinaryUrl(dto.coverImage);
    }
    for (const media of dto.media || []) this.mediaService.assertCloudinaryUrl(media.url);
    const existing = new Set([current.coverImagePublicId, ...current.media.map((media) => media.publicId)]);
    const requested = [dto.coverImagePublicId, ...(dto.media || []).map((media) => media.publicId)].filter(
      (id): id is string => typeof id === 'string' && id.length > 0 && !existing.has(id),
    );
    await this.mediaService.assertAttachableUploads(userId, requested);
  }

  private assertPublishable(story: Awaited<ReturnType<StoriesService['findOwnedStory']>>) {
    if (!story.title.trim() || story.title === 'Untitled Story') throw new BadRequestException('Story title is required');
    if (!story.coverImage || !story.coverImagePublicId) throw new BadRequestException('Cover image is required');
    const hasWriting = story.content.some((block) => {
      const content = block.content as Record<string, unknown>;
      return block.type === 'divider' || Boolean(typeof content?.text === 'string' && content.text.trim());
    });
    if (!hasWriting) throw new BadRequestException('Write something before publishing');
  }

  private async interactionState(userId: string, storyId: string) {
    const [story, like, bookmark] = await Promise.all([
      this.prisma.story.findUnique({ where: { id: storyId }, select: { likes: true, views: true } }),
      this.prisma.like.findUnique({ where: { userId_blogId: { userId, blogId: storyId } }, select: { id: true } }),
      this.prisma.bookmark.findUnique({ where: { userId_blogId: { userId, blogId: storyId } }, select: { id: true } }),
    ]);
    return { liked: Boolean(like), bookmarked: Boolean(bookmark), likes: Math.max(story?.likes || 0, 0), views: story?.views || 0 };
  }

  private async generateUniqueSlug(title: string, id: string) {
    const base = this.slugify(title) || 'story';
    let slug = base;
    let suffix = 2;
    while (await this.prisma.story.findFirst({ where: { slug, id: { not: id } }, select: { id: true } })) slug = `${base}-${suffix++}`;
    return slug;
  }

  private slugify(input: string) {
    return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
  }

  private listStorySelect() {
    return {
      id: true, slug: true, title: true, shortDesc: true, coverImage: true, tags: true, likes: true, views: true, commentsCount: true, publishedAt: true, createdAt: true,
      author: { select: { id: true, name: true, username: true, image: true } },
    } satisfies Prisma.StorySelect;
  }

  private ownerStorySelect() {
    return {
      id: true, clientDraftId: true, version: true, slug: true, status: true, title: true, shortDesc: true, coverImage: true, coverImagePublicId: true, tags: true,
      publishedAt: true, submittedAt: true, lastEditedAt: true, deletedAt: true, createdAt: true, updatedAt: true,
    } satisfies Prisma.StorySelect;
  }

  private serialize<T>(input: T): T {
    return JSON.parse(JSON.stringify(input)) as T;
  }
}
