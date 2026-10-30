import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AdminRecipeModerationActionType, RecipeStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { HideAdminRecipeDto, ListAdminRecipesQueryDto } from './dto/admin-recipes.dto';

const recipeListSelect = {
  id: true,
  slug: true,
  name: true,
  mainImage: true,
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
export class AdminRecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAdminRecipesQueryDto) {
    const where = {
      ...(query.status ? { status: query.status, deletedAt: query.status === RecipeStatus.DELETED ? { not: null } : null } : {}),
      ...(query.search ? {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { author: { is: { username: { contains: query.search, mode: 'insensitive' as const } } } },
          { author: { is: { name: { contains: query.search, mode: 'insensitive' as const } } } },
        ],
      } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        select: recipeListSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.recipe.count({ where }),
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

  async get(id: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      select: {
        ...recipeListSelect,
        about: true,
        totalTimeReq: true,
        yield: true,
        tags: true,
        adminModerationActions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, action: true, reason: true, createdAt: true, admin: { select: { name: true, email: true } } },
        },
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return { recipe };
  }

  async hide(adminId: string, id: string, dto: HideAdminRecipeDto) {
    const recipe = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.recipe.updateMany({
        where: { id, status: RecipeStatus.PUBLISHED, deletedAt: null },
        data: { status: RecipeStatus.ARCHIVED, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Only a currently published recipe can be hidden. Reload and try again.');
      }
      await tx.adminRecipeModerationAction.create({
        data: { recipeId: id, adminId, action: AdminRecipeModerationActionType.HIDDEN, reason: dto.reason },
      });
      return tx.recipe.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    });
    return { recipe };
  }

  async restore(adminId: string, id: string) {
    const recipe = await this.prisma.$transaction(async (tx) => {
      const lastAction = await tx.adminRecipeModerationAction.findFirst({
        where: { recipeId: id },
        orderBy: { createdAt: 'desc' },
        select: { action: true },
      });
      if (lastAction?.action !== AdminRecipeModerationActionType.HIDDEN) {
        throw new ConflictException('Only a recipe hidden by an administrator can be restored here.');
      }
      const updated = await tx.recipe.updateMany({
        where: { id, status: RecipeStatus.ARCHIVED, deletedAt: null },
        data: { status: RecipeStatus.PUBLISHED, version: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new ConflictException('This recipe is no longer available to restore. Reload and try again.');
      }
      await tx.adminRecipeModerationAction.create({
        data: { recipeId: id, adminId, action: AdminRecipeModerationActionType.RESTORED },
      });
      return tx.recipe.findUniqueOrThrow({ where: { id }, select: { id: true, status: true } });
    });
    return { recipe };
  }
}
