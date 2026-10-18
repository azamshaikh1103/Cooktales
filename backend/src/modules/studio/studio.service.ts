import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StudioService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string) {
    const [user, latestRecipe] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          points: true,
          _count: { select: { recipes: true, followers: true } },
          recipes: { select: { views: true, likes: true } },
        },
      }),
      this.prisma.recipe.findFirst({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          views: true,
          likes: true,
          totalTimeReq: true,
          calories: true,
        },
      }),
    ]);

    const recipes = user?.recipes || [];
    return {
      stats: {
        points: user?.points || 0,
        recipes: user?._count.recipes || 0,
        followers: user?._count.followers || 0,
        totalViews: recipes.reduce((total, recipe) => total + recipe.views, 0),
        totalLikes: recipes.reduce((total, recipe) => total + recipe.likes, 0),
      },
      latestRecipe,
    };
  }

  async analytics(userId: string) {
    const [user, recipes] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      }),
      this.prisma.recipe.findMany({
        where: { authorId: userId },
        orderBy: { views: 'desc' },
        take: 5,
        select: { id: true, name: true, mainImage: true, views: true, likes: true },
      }),
    ]);

    return { user: { isPro: user?.isPro || false }, recipes };
  }
}
