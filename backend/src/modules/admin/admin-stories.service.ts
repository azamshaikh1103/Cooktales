import { ConflictException, Injectable } from '@nestjs/common';
import { AdminStoryModerationActionType, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { HideAdminStoryDto, ListAdminStoriesQueryDto } from './dto/admin-stories.dto';

const storyListSelect = {
  id: true,
  slug: true,
  title: true,
  shortDesc: true,
  coverImage: true,
  status: true,
  views: true,
  likes: true,
  commentsCount: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  author: { select: { id: true, name: true, username: true } },
  adminModerationActions: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: { action: true, reason: true, createdAt: true, admin: { select: { name: true, email: true } } },
  },
};

@Injectable()
export class AdminStoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAdminStoriesQueryDto) {
    const where = {
      ...(query.status ? { status: query.status, deletedAt: query.status === StoryStatus.DELETED ? { not: null } : null } : {}),
      ...(query.search ? {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' as const } },
          { author: { is: { username: { contains: query.search, mode: 'insensitive' as const } } } },
          { author: { is: { name: { contains: query.search, mode: 'insensitive' as const } } } },
        ],
      } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.story.findMany({
        where,
        select: storyListSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.story.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / query.pageSize),
      },
    };
  }

  async hide(adminId: string, id: string, dto: HideAdminStoryDto) {
    const story = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.story.updateMany({
        where: { id, status: StoryStatus.PUBLISHED, deletedAt: null },
        data: { status: StoryStatus.ARCHIVED, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Only a currently published story can be hidden. Reload and try again.');
      }
      await tx.adminStoryModerationAction.create({
        data: { storyId: id, adminId, action: AdminStoryModerationActionType.HIDDEN, reason: dto.reason },
      });
      return tx.story.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    });
    return { story };
  }

  async restore(adminId: string, id: string) {
    const story = await this.prisma.$transaction(async (tx) => {
      const lastAction = await tx.adminStoryModerationAction.findFirst({
        where: { storyId: id },
        orderBy: { createdAt: 'desc' },
        select: { action: true },
      });
      if (lastAction?.action !== AdminStoryModerationActionType.HIDDEN) {
        throw new ConflictException('Only a story hidden by an administrator can be restored here.');
      }
      const updated = await tx.story.updateMany({
        where: { id, status: StoryStatus.ARCHIVED, deletedAt: null },
        data: { status: StoryStatus.PUBLISHED, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new ConflictException('This story is no longer available to restore. Reload and try again.');
      }
      await tx.adminStoryModerationAction.create({
        data: { storyId: id, adminId, action: AdminStoryModerationActionType.RESTORED },
      });
      return tx.story.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    });
    return { story };
  }
}
