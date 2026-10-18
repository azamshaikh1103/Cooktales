import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CloudinaryResourceType,
  CommentStatus,
  Prisma,
  RecipeStatus,
  ReviewStatus,
  VoteType,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MediaService } from '../media/media.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateRecipeDraftDto,
  CreateRecipeCommentDto,
  CreateRecipeReviewDto,
  ListRecipeReviewsQueryDto,
  ListRecipeCommentsQueryDto,
  ListRecipesQueryDto,
  ListOwnedRecipesQueryDto,
  RecipeRatingDto,
  RecipeReviewVoteDto,
  ReplyToRecipeReviewDto,
  UpdateRecipeDto,
  UpdateRecipeCommentDto,
} from './dto/recipe.dto';
import { RecipeAbuseService } from './recipe-abuse.service';

const recipeInclude = {
  author: {
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      about: true,
      _count: { select: { recipes: true } },
    },
  },
  ingredients: { orderBy: { position: 'asc' as const } },
  equipments: { orderBy: { position: 'asc' as const } },
  steps: { orderBy: { position: 'asc' as const } },
  faqs: { orderBy: { position: 'asc' as const } },
  media: { orderBy: [{ kind: 'asc' as const }, { position: 'asc' as const }] },
  reviews: {
    where: { status: ReviewStatus.VISIBLE, deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    select: {
      id: true,
      stars: true,
      text: true,
      createdAt: true,
      editedAt: true,
      authorReply: true,
      authorReplyAt: true,
      upvotes: true,
      downvotes: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  },
  _count: {
    select: {
      reviews: { where: { status: ReviewStatus.VISIBLE, deletedAt: null } },
    },
  },
} satisfies Prisma.RecipeInclude;

const commentAuthorSelect = {
  id: true,
  name: true,
  username: true,
  image: true,
} satisfies Prisma.UserSelect;

const commentInclude = {
  author: { select: commentAuthorSelect },
  _count: { select: { likes: true, replies: true } },
  replies: {
    where: { status: { in: [CommentStatus.VISIBLE, CommentStatus.REMOVED] } },
    orderBy: { createdAt: 'asc' as const },
    take: 50,
    include: {
      author: { select: commentAuthorSelect },
      _count: { select: { likes: true } },
    },
  },
} satisfies Prisma.CommentInclude;

@Injectable()
export class RecipesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
    private readonly abuse: RecipeAbuseService,
    private readonly notifications: NotificationsService,
  ) {}

  async createDraft(userId: string, dto: CreateRecipeDraftDto) {
    const name = dto.name?.trim() || 'Untitled Recipe';
    const recipe = dto.clientDraftId
      ? await this.prisma.recipe.upsert({
          where: {
            authorId_clientDraftId: { authorId: userId, clientDraftId: dto.clientDraftId },
          },
          create: {
            clientDraftId: dto.clientDraftId,
            name,
            authorId: userId,
            status: RecipeStatus.DRAFT,
            tags: [],
            moreImages: [],
          },
          update: {},
          select: this.ownerRecipeSelect(),
        })
      : await this.prisma.recipe.create({
          data: {
            name,
            authorId: userId,
            status: RecipeStatus.DRAFT,
            tags: [],
            moreImages: [],
          },
          select: this.ownerRecipeSelect(),
        });

    return { recipe: this.serializeRecipe(recipe) };
  }

  async listOwned(userId: string, query: ListOwnedRecipesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const where: Prisma.RecipeWhereInput = {
      authorId: userId,
      deletedAt: query.status === RecipeStatus.DELETED ? { not: null } : null,
      ...(query.status ? { status: query.status } : { status: { not: RecipeStatus.DELETED } }),
    };
    const [recipes, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: this.ownerRecipeSelect(),
      }),
      this.prisma.recipe.count({ where }),
    ]);
    return {
      recipes: recipes.map((recipe) => this.serializeRecipe(recipe)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  async list(query: ListRecipesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;
    const where: Prisma.RecipeWhereInput = {
      status: RecipeStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.tag && query.tag !== 'All') where.tags = { has: query.tag };
    if (query.cuisine) where.cuisine = query.cuisine;
    if (query.diet) where.diet = query.diet;
    if (query.difficulty) where.difficulty = query.difficulty;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { about: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    const orderBy = this.resolveOrderBy(query.sortBy);
    const [recipes, total] = await this.prisma.$transaction([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: this.listRecipeSelect(),
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      recipes: recipes.map((recipe) => this.serializeRecipe(recipe)),
      page,
      limit,
      total,
      hasMore: skip + recipes.length < total,
    };
  }

  async getPublic(slug: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: {
        slug,
        status: RecipeStatus.PUBLISHED,
        deletedAt: null,
      },
      include: recipeInclude,
    });

    if (!recipe) throw new NotFoundException('Recipe not found');

    return { recipe: this.serializeRecipe(recipe) };
  }

  async getCookMode(slug: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { slug, status: RecipeStatus.PUBLISHED, deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        about: true,
        mainImage: true,
        totalTimeReq: true,
        yield: true,
        calories: true,
        diet: true,
        cuisine: true,
        difficulty: true,
        tipsAndTricks: true,
        storingFreezing: true,
        ingredients: { orderBy: { position: 'asc' } },
        equipments: { orderBy: { position: 'asc' } },
        steps: { orderBy: { position: 'asc' } },
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return { recipe: this.serializeRecipe(recipe) };
  }

  async listReviews(slug: string, query: ListRecipeReviewsQueryDto) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { slug, status: RecipeStatus.PUBLISHED, deletedAt: null },
      select: { id: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const page = query.page || 1;
    const limit = query.limit || 10;
    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: { recipeId: recipe.id, status: ReviewStatus.VISIBLE, deletedAt: null },
        orderBy: this.reviewOrderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
      }),
      this.prisma.review.count({
        where: { recipeId: recipe.id, status: ReviewStatus.VISIBLE, deletedAt: null },
      }),
    ]);

    return {
      reviews: reviews.map((review) => this.serializeRecipe(review)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  async listComments(slug: string, query: ListRecipeCommentsQueryDto) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { slug, status: RecipeStatus.PUBLISHED, deletedAt: null },
      select: { id: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const page = query.page || 1;
    const limit = query.limit || 10;
    const where: Prisma.CommentWhereInput = {
      recipeId: recipe.id,
      parentId: null,
      status: { in: [CommentStatus.VISIBLE, CommentStatus.REMOVED] },
    };
    const [comments, total] = await this.prisma.$transaction([
      this.prisma.comment.findMany({
        where,
        orderBy: { createdAt: query.sort === 'oldest' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: commentInclude,
      }),
      this.prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((comment) => this.serializeComment(comment)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    };
  }

  async createComment(userId: string, id: string, dto: CreateRecipeCommentDto) {
    await this.abuse.checkComment(userId, dto.parentId ? 'reply' : 'create');
    await this.assertCanComment(userId, id);

    const comment = await this.prisma.$transaction(async (tx) => {
      let parentAuthorId: string | null = null;
      if (dto.parentId) {
        const parent = await tx.comment.findFirst({
          where: {
            id: dto.parentId,
            recipeId: id,
            parentId: null,
            status: CommentStatus.VISIBLE,
          },
          select: { id: true, authorId: true },
        });
        if (!parent) throw new NotFoundException('Comment not found');
        parentAuthorId = parent.authorId;
      }

      const saved = await tx.comment.create({
        data: { recipeId: id, authorId: userId, content: dto.content.trim(), parentId: dto.parentId },
        include: commentInclude,
      });
      await tx.recipe.update({ where: { id }, data: { commentsCount: { increment: 1 } } });
      return { saved, parentAuthorId };
    });

    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true, name: true, slug: true },
    });
    if (recipe) {
      const isReply = Boolean(dto.parentId);
      await this.notifications.create({
        recipientId: comment.parentAuthorId || recipe.authorId,
        actorId: userId,
        type: isReply ? 'RECIPE_COMMENT_REPLY' : 'RECIPE_COMMENT',
        targetPath: `/recipe/${recipe.slug || id}#comment-${comment.saved.id}`,
        payload: { recipeName: recipe.name },
        dedupeKey: `recipe-comment:${comment.saved.id}`,
      });
    }

    return { comment: this.serializeComment(comment.saved) };
  }

  async updateComment(userId: string, id: string, commentId: string, dto: UpdateRecipeCommentDto) {
    await this.abuse.checkComment(userId, 'edit');
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        recipeId: id,
        authorId: userId,
        status: CommentStatus.VISIBLE,
        deletedAt: null,
      },
      select: { id: true, createdAt: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (Date.now() - comment.createdAt.getTime() > 15 * 60 * 1000) {
      throw new ForbiddenException('Comments can only be edited for 15 minutes');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content.trim(), editedAt: new Date() },
      include: commentInclude,
    });
    return { comment: this.serializeComment(updated) };
  }

  async deleteComment(userId: string, id: string, commentId: string) {
    await this.abuse.checkComment(userId, 'delete');
    const existing = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        recipeId: id,
        authorId: userId,
        status: CommentStatus.VISIBLE,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Comment not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { status: CommentStatus.REMOVED, deletedAt: new Date(), content: '' },
      });
      await tx.recipe.updateMany({
        where: { id, commentsCount: { gt: 0 } },
        data: { commentsCount: { decrement: 1 } },
      });
    });
    return { message: 'Comment removed' };
  }

  async likeComment(userId: string, id: string, commentId: string) {
    await this.abuse.checkComment(userId, 'like');
    await this.assertCanComment(userId, id);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, recipeId: id, status: CommentStatus.VISIBLE, deletedAt: null },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId === userId) throw new ForbiddenException('You cannot like your own comment');
    await this.prisma.like.createMany({ data: [{ userId, commentId }], skipDuplicates: true });
    return this.commentLikeState(userId, commentId);
  }

  async unlikeComment(userId: string, id: string, commentId: string) {
    await this.abuse.checkComment(userId, 'unlike');
    await this.assertPublished(id);
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, recipeId: id, status: CommentStatus.VISIBLE, deletedAt: null },
      select: { id: true },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.prisma.like.deleteMany({ where: { userId, commentId } });
    return this.commentLikeState(userId, commentId);
  }

  async commentViewerState(userId: string, id: string, commentIds: string[]) {
    await this.assertPublished(id);
    if (!commentIds.length) return { likedCommentIds: [] };
    const likes = await this.prisma.like.findMany({
      where: {
        userId,
        commentId: { in: commentIds },
        comment: { recipeId: id, status: CommentStatus.VISIBLE, deletedAt: null },
      },
      select: { commentId: true },
    });
    return { likedCommentIds: likes.flatMap((like) => (like.commentId ? [like.commentId] : [])) };
  }

  async getOwnerRecipe(userId: string, id: string) {
    const recipe = await this.findOwnedRecipe(userId, id);
    return { recipe: this.serializeRecipe(recipe) };
  }

  async update(userId: string, id: string, dto: UpdateRecipeDto) {
    const current = await this.findOwnedRecipe(userId, id);
    await this.validateRecipeMediaUpdate(userId, current, dto);
    const scalarData = this.resolveRecipeData(dto);
    const expectedVersion = dto.expectedVersion ?? current.version;
    const removedMedia = dto.media
      ? current.media
          .filter((media) => !dto.media?.some((next) => next.publicId === media.publicId))
          .map((media) => ({ publicId: media.publicId, resourceType: media.resourceType }))
      : [];
    const removedMain =
      dto.mainImagePublicId !== undefined &&
      current.mainImagePublicId &&
      current.mainImagePublicId !== dto.mainImagePublicId
        ? [{ publicId: current.mainImagePublicId, resourceType: CloudinaryResourceType.IMAGE }]
        : [];

    const recipe = await this.prisma.$transaction(async (tx) => {
      if (dto.ingredients) {
        await tx.ingredient.deleteMany({ where: { recipeId: id } });
        if (dto.ingredients.length) {
          await tx.ingredient.createMany({
            data: dto.ingredients.map((ingredient, position) => ({
              recipeId: id,
              name: ingredient.name.trim(),
              detail: ingredient.detail?.trim() || null,
              image: ingredient.image || null,
              link: ingredient.link || null,
              regionalName: Prisma.JsonNull,
              position,
            })),
          });
        }
      }

      if (dto.equipments) {
        await tx.equipment.deleteMany({ where: { recipeId: id } });
        if (dto.equipments.length) {
          await tx.equipment.createMany({
            data: dto.equipments.map((equipment, position) => ({
              recipeId: id,
              name: equipment.name.trim(),
              detail: equipment.detail?.trim() || null,
              image: equipment.image || null,
              link: equipment.link || null,
              regionalName: Prisma.JsonNull,
              position,
            })),
          });
        }
      }

      if (dto.steps) {
        await tx.step.deleteMany({ where: { recipeId: id } });
        if (dto.steps.length) {
          await tx.step.createMany({
            data: dto.steps.map((step, position) => ({
              recipeId: id,
              name: step.name.trim(),
              detail: step.detail?.trim() || null,
              timeReq: step.timeReq || null,
              videoUrl: step.videoUrl || null,
              image: step.image || null,
              link: step.link || null,
              position,
            })),
          });
        }
      }

      if (dto.faqs) {
        await tx.fAQ.deleteMany({ where: { recipeId: id } });
        if (dto.faqs.length) {
          await tx.fAQ.createMany({
            data: dto.faqs.map((faq, position) => ({
              recipeId: id,
              question: faq.question.trim(),
              answer: faq.answer.trim(),
              position,
            })),
          });
        }
      }

      if (dto.media) {
        await tx.recipeMedia.deleteMany({ where: { recipeId: id } });
        if (dto.media.length) {
          await tx.recipeMedia.createMany({
            data: dto.media.map((media) => ({
              recipeId: id,
              publicId: media.publicId,
              url: media.url,
              resourceType: media.resourceType || CloudinaryResourceType.IMAGE,
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

      const updated = await tx.recipe.updateMany({
        where: { id, authorId: userId, deletedAt: null, version: expectedVersion },
        data: {
          ...scalarData,
          lastEditedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException('This recipe was updated elsewhere. Reload before saving.');
      }
      return tx.recipe.findUniqueOrThrow({ where: { id }, include: recipeInclude });
    });

    await this.mediaService.scheduleDeletion(userId, [...removedMedia, ...removedMain]);
    await this.mediaService.markAttached(userId, [
      recipe.mainImagePublicId,
      ...recipe.media.map((media) => media.publicId),
    ]);

    return { recipe: this.serializeRecipe(recipe) };
  }

  async publish(userId: string, id: string) {
    const recipe = await this.findOwnedRecipe(userId, id);
    this.assertPublishable(recipe);

    const slug = await this.generateUniqueSlug(recipe.name, recipe.id);
    const published = await this.prisma.recipe.update({
      where: { id },
      data: {
        slug,
        status: RecipeStatus.PUBLISHED,
        publishedAt: recipe.publishedAt || new Date(),
        submittedAt: recipe.submittedAt || new Date(),
        lastEditedAt: new Date(),
        version: { increment: 1 },
      },
      include: recipeInclude,
    });

    return { recipe: this.serializeRecipe(published) };
  }

  async softDelete(userId: string, id: string) {
    const current = await this.findOwnedRecipe(userId, id);
    await this.prisma.recipe.update({
      where: { id },
      data: {
        status: RecipeStatus.DELETED,
        statusBeforeDelete: current.status,
        deletedAt: new Date(),
        version: { increment: 1 },
      },
    });

    return { message: 'Recipe deleted' };
  }

  async restore(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, authorId: userId, status: RecipeStatus.DELETED, deletedAt: { not: null } },
      select: { statusBeforeDelete: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    const restored = await this.prisma.recipe.update({
      where: { id },
      data: {
        status: recipe.statusBeforeDelete || RecipeStatus.DRAFT,
        statusBeforeDelete: null,
        deletedAt: null,
        version: { increment: 1 },
      },
      include: recipeInclude,
    });
    return { recipe: this.serializeRecipe(restored) };
  }

  async like(userId: string, id: string) {
    await this.abuse.checkReaction(userId, 'like');
    await this.assertPublished(id);
    const created = await this.prisma.$transaction(async (tx) => {
      const created = await tx.like.createMany({
        data: [{ userId, recipeId: id }],
        skipDuplicates: true,
      });
      if (created.count) {
        await tx.recipe.update({ where: { id }, data: { likes: { increment: 1 } } });
      }
      return Boolean(created.count);
    });

    if (created) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id },
        select: { authorId: true, name: true, slug: true },
      });
      if (recipe) {
        await this.notifications.create({
          recipientId: recipe.authorId,
          actorId: userId,
          type: 'RECIPE_LIKE',
          targetPath: `/recipe/${recipe.slug || id}`,
          payload: { recipeName: recipe.name },
          dedupeKey: `recipe-like:${userId}:${id}`,
        });
      }
    }

    return this.recipeInteractionState(userId, id);
  }

  async unlike(userId: string, id: string) {
    await this.abuse.checkReaction(userId, 'unlike');
    await this.assertPublished(id);
    await this.prisma.$transaction(async (tx) => {
      const removed = await tx.like.deleteMany({ where: { userId, recipeId: id } });
      if (removed.count) {
        await tx.recipe.updateMany({
          where: { id, likes: { gt: 0 } },
          data: { likes: { decrement: 1 } },
        });
      }
    });

    return this.recipeInteractionState(userId, id);
  }

  async bookmark(userId: string, id: string) {
    await this.abuse.checkReaction(userId, 'bookmark');
    await this.assertPublished(id);
    await this.prisma.bookmark.upsert({
      where: { userId_recipeId: { userId, recipeId: id } },
      create: { userId, recipeId: id },
      update: {},
    });

    return this.recipeInteractionState(userId, id);
  }

  async unbookmark(userId: string, id: string) {
    await this.abuse.checkReaction(userId, 'unbookmark');
    await this.assertPublished(id);
    await this.prisma.bookmark.deleteMany({ where: { userId, recipeId: id } });
    return this.recipeInteractionState(userId, id);
  }

  async rate(userId: string, id: string, dto: RecipeRatingDto) {
    await this.abuse.checkReview(userId, 'rate');
    await this.assertCanReview(userId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.rating.upsert({
        where: { userId_recipeId: { userId, recipeId: id } },
        create: { userId, recipeId: id, stars: dto.stars },
        update: { stars: dto.stars },
      });
      await this.recalculateRecipeRating(tx, id);
    });

    return this.recipeInteractionState(userId, id);
  }

  async createReview(userId: string, id: string, dto: CreateRecipeReviewDto) {
    await this.abuse.checkReview(userId, 'create');
    await this.assertCanReview(userId, id);
    const review = await this.prisma.$transaction(async (tx) => {
      await tx.rating.upsert({
        where: { userId_recipeId: { userId, recipeId: id } },
        create: { userId, recipeId: id, stars: dto.stars },
        update: { stars: dto.stars },
      });

      const reviewInclude = {
        user: { select: { id: true, name: true, username: true, image: true } },
      } satisfies Prisma.ReviewInclude;
      const existing = await tx.review.findUnique({
        where: { userId_recipeId: { userId, recipeId: id } },
        select: { status: true },
      });
      const restoringRemovedReview = Boolean(existing && existing.status !== ReviewStatus.VISIBLE);
      if (restoringRemovedReview) {
        await tx.reviewVote.deleteMany({
          where: { review: { userId, recipeId: id } },
        });
      }
      const saved = await tx.review.upsert({
        where: { userId_recipeId: { userId, recipeId: id } },
        create: { recipeId: id, userId, stars: dto.stars, text: dto.text.trim() },
        update: {
          stars: dto.stars,
          text: dto.text.trim(),
          status: ReviewStatus.VISIBLE,
          deletedAt: null,
          editedAt: new Date(),
          ...(restoringRemovedReview
            ? { upvotes: 0, downvotes: 0, authorReply: null, authorReplyAt: null }
            : {}),
        },
        include: reviewInclude,
      });

      await this.recalculateRecipeRating(tx, id);
      return saved;
    });

    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true, name: true, slug: true },
    });
    if (recipe) {
      await this.notifications.create({
        recipientId: recipe.authorId,
        actorId: userId,
        type: 'RECIPE_REVIEW',
        targetPath: `/recipe/${recipe.slug || id}#review-${review.id}`,
        payload: { recipeName: recipe.name, stars: review.stars },
        dedupeKey: `recipe-review:${review.id}`,
      });
    }

    return { review: this.serializeRecipe(review) };
  }

  async updateReview(userId: string, id: string, reviewId: string, dto: CreateRecipeReviewDto) {
    await this.abuse.checkReview(userId, 'update');
    await this.assertCanReview(userId, id);
    const existing = await this.prisma.review.findFirst({
      where: { id: reviewId, recipeId: id, userId, status: ReviewStatus.VISIBLE, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Review not found');

    const review = await this.prisma.$transaction(async (tx) => {
      await tx.rating.upsert({
        where: { userId_recipeId: { userId, recipeId: id } },
        create: { userId, recipeId: id, stars: dto.stars },
        update: { stars: dto.stars },
      });
      const saved = await tx.review.update({
        where: { id: reviewId },
        data: { stars: dto.stars, text: dto.text.trim(), editedAt: new Date() },
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
      });
      await this.recalculateRecipeRating(tx, id);
      return saved;
    });
    return { review: this.serializeRecipe(review) };
  }

  async deleteReview(userId: string, id: string, reviewId: string) {
    await this.abuse.checkReview(userId, 'delete');
    const existing = await this.prisma.review.findFirst({
      where: { id: reviewId, recipeId: id, userId, status: ReviewStatus.VISIBLE, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Review not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { status: ReviewStatus.REMOVED, deletedAt: new Date() },
      });
      await tx.rating.deleteMany({ where: { userId, recipeId: id } });
      await this.recalculateRecipeRating(tx, id);
    });
    return { message: 'Review deleted' };
  }

  async voteOnReview(userId: string, id: string, reviewId: string, dto: RecipeReviewVoteDto) {
    await this.abuse.checkReaction(userId, 'review-vote');
    await this.assertPublished(id);
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, recipeId: id, status: ReviewStatus.VISIBLE, deletedAt: null },
      select: { id: true, userId: true },
    });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId === userId)
      throw new ForbiddenException('You cannot vote on your own review');

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.reviewVote.findUnique({
        where: { userId_reviewId: { userId, reviewId } },
      });
      let myVote: VoteType | null = dto.type;
      if (existing?.type === dto.type) {
        await tx.reviewVote.delete({ where: { id: existing.id } });
        myVote = null;
      } else if (existing) {
        await tx.reviewVote.update({ where: { id: existing.id }, data: { type: dto.type } });
      } else {
        await tx.reviewVote.create({ data: { userId, reviewId, type: dto.type } });
      }

      const [upvotes, downvotes] = await Promise.all([
        tx.reviewVote.count({ where: { reviewId, type: VoteType.UP } }),
        tx.reviewVote.count({ where: { reviewId, type: VoteType.DOWN } }),
      ]);
      await tx.review.update({ where: { id: reviewId }, data: { upvotes, downvotes } });
      return { upvotes, downvotes, myVote };
    });
  }

  async replyToReview(userId: string, id: string, reviewId: string, dto: ReplyToRecipeReviewDto) {
    await this.abuse.checkReview(userId, 'reply');
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      select: { authorId: true, name: true, slug: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.authorId !== userId)
      throw new ForbiddenException('Only the recipe author can reply');

    const targetReview = await this.prisma.review.findFirst({
      where: { id: reviewId, recipeId: id, status: ReviewStatus.VISIBLE, deletedAt: null },
      select: { id: true, userId: true },
    });
    if (!targetReview) throw new NotFoundException('Review not found');

    const review = await this.prisma.review.update({
      where: { id: targetReview.id },
      data: {
        authorReply: dto.reply.trim(),
        authorReplyAt: new Date(),
      },
    });

    await this.notifications.create({
      recipientId: targetReview.userId,
      actorId: userId,
      type: 'RECIPE_REVIEW_REPLY',
      targetPath: `/recipe/${recipe.slug || id}#review-${review.id}`,
      payload: { recipeName: recipe.name },
      dedupeKey: `recipe-review-reply:${review.id}`,
    });

    return { review: this.serializeRecipe(review) };
  }

  async deleteReviewReply(userId: string, id: string, reviewId: string) {
    await this.abuse.checkReview(userId, 'delete-reply');
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, authorId: userId, status: RecipeStatus.PUBLISHED, deletedAt: null },
      select: { id: true },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');
    const changed = await this.prisma.review.updateMany({
      where: { id: reviewId, recipeId: id, status: ReviewStatus.VISIBLE, deletedAt: null },
      data: { authorReply: null, authorReplyAt: null },
    });
    if (!changed.count) throw new NotFoundException('Review not found');
    return { message: 'Reply deleted' };
  }

  async viewerState(userId: string, id: string) {
    await this.assertPublished(id);
    return this.recipeInteractionState(userId, id);
  }

  private async findOwnedRecipe(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, authorId: userId, deletedAt: null },
      include: recipeInclude,
    });

    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async assertPublished(id: string) {
    const exists = await this.prisma.recipe.findFirst({
      where: { id, status: RecipeStatus.PUBLISHED, deletedAt: null },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Recipe not found');
  }

  private async assertCanReview(userId: string, id: string) {
    const [recipe, user] = await Promise.all([
      this.prisma.recipe.findFirst({
        where: { id, status: RecipeStatus.PUBLISHED, deletedAt: null },
        select: { authorId: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } }),
    ]);
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (!user?.emailVerified) {
      throw new ForbiddenException('Verify your email before rating or reviewing recipes');
    }
    if (recipe.authorId === userId) {
      throw new ForbiddenException('You cannot rate or review your own recipe');
    }
  }

  private async assertCanComment(userId: string, id: string) {
    const [recipe, user] = await Promise.all([
      this.prisma.recipe.findFirst({
        where: { id, status: RecipeStatus.PUBLISHED, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } }),
    ]);
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (!user?.emailVerified) {
      throw new ForbiddenException('Verify your email before commenting on recipes');
    }
  }

  private async commentLikeState(userId: string, commentId: string) {
    const [like, likes] = await Promise.all([
      this.prisma.like.findUnique({ where: { userId_commentId: { userId, commentId } } }),
      this.prisma.like.count({ where: { commentId } }),
    ]);
    return { liked: Boolean(like), likes };
  }

  private assertPublishable(recipe: Awaited<ReturnType<RecipesService['findOwnedRecipe']>>) {
    if (!recipe.name?.trim() || recipe.name === 'Untitled Recipe') {
      throw new BadRequestException('Recipe title is required');
    }
    if (!recipe.mainImage) throw new BadRequestException('Cover image is required');
    if (!recipe.totalTimeReq || recipe.totalTimeReq < 1) {
      throw new BadRequestException('Total time is required');
    }
    if (!recipe.ingredients.length) throw new BadRequestException('Add at least one ingredient');
    if (!recipe.steps.length) throw new BadRequestException('Add at least one step');
  }

  private resolveRecipeData(dto: UpdateRecipeDto): Prisma.RecipeUpdateInput {
    const data: Prisma.RecipeUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.about !== undefined) data.about = dto.about?.trim() || null;
    if (dto.mainImage !== undefined) data.mainImage = dto.mainImage;
    if (dto.mainImagePublicId !== undefined) data.mainImagePublicId = dto.mainImagePublicId;
    if (dto.moreImages !== undefined) data.moreImages = dto.moreImages;
    if (dto.totalTimeReq !== undefined) data.totalTimeReq = dto.totalTimeReq;
    if (dto.yield !== undefined) data.yield = dto.yield;
    if (dto.calories !== undefined) data.calories = dto.calories;
    if (dto.diet !== undefined) data.diet = dto.diet;
    if (dto.cuisine !== undefined) data.cuisine = dto.cuisine?.trim() || 'NA';
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
    if (dto.tipsAndTricks !== undefined) data.tipsAndTricks = dto.tipsAndTricks?.trim() || null;
    if (dto.storingFreezing !== undefined)
      data.storingFreezing = dto.storingFreezing?.trim() || null;
    if (dto.tags !== undefined)
      data.tags = dto.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12);
    return data;
  }

  private async validateRecipeMediaUpdate(
    userId: string,
    current: Awaited<ReturnType<RecipesService['findOwnedRecipe']>>,
    dto: UpdateRecipeDto,
  ) {
    const changesCover = dto.mainImage !== undefined || dto.mainImagePublicId !== undefined;
    if (changesCover) {
      if (!dto.mainImage || !dto.mainImagePublicId) {
        throw new BadRequestException('Cover image URL and public ID must be updated together');
      }
      this.mediaService.assertCloudinaryUrl(dto.mainImage);
    }
    for (const media of dto.media || []) this.mediaService.assertCloudinaryUrl(media.url);

    const existing = new Set([
      current.mainImagePublicId,
      ...current.media.map((media) => media.publicId),
    ]);
    const requested = [dto.mainImagePublicId, ...(dto.media || []).map((media) => media.publicId)]
      .filter((publicId): publicId is string => Boolean(publicId))
      .filter((publicId) => !existing.has(publicId));
    await this.mediaService.assertAttachableUploads(userId, requested);
  }

  private async recipeInteractionState(userId: string, recipeId: string) {
    const [recipe, like, bookmark, rating, review] = await Promise.all([
      this.prisma.recipe.findUnique({
        where: { id: recipeId },
        select: { likes: true, ratings: true, ratingCount: true },
      }),
      this.prisma.like.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
        select: { id: true },
      }),
      this.prisma.bookmark.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
        select: { id: true },
      }),
      this.prisma.rating.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
        select: { stars: true },
      }),
      this.prisma.review.findFirst({
        where: {
          userId,
          recipeId,
          status: ReviewStatus.VISIBLE,
          deletedAt: null,
        },
        select: { id: true, stars: true, text: true, createdAt: true, editedAt: true },
      }),
    ]);

    return {
      liked: Boolean(like),
      bookmarked: Boolean(bookmark),
      myRating: rating?.stars || null,
      myReview: review ? this.serializeRecipe(review) : null,
      likes: Math.max(recipe?.likes || 0, 0),
      ratings: recipe?.ratings || 0,
      ratingCount: recipe?.ratingCount || 0,
    };
  }

  private async recalculateRecipeRating(tx: Prisma.TransactionClient, recipeId: string) {
    const [reviews, ratings] = await Promise.all([
      tx.review.findMany({
        where: {
          recipeId,
          stars: { not: null },
          status: ReviewStatus.VISIBLE,
          deletedAt: null,
        },
        select: { userId: true, stars: true },
      }),
      tx.rating.findMany({
        where: { recipeId },
        select: { userId: true, stars: true },
      }),
    ]);

    const perUser = new Map<string, number>();
    for (const review of reviews) {
      if (review.stars) perUser.set(review.userId, review.stars);
    }
    for (const rating of ratings) {
      perUser.set(rating.userId, rating.stars);
    }

    const values = [...perUser.values()];
    const total = values.length;
    const average = total === 0 ? 0 : values.reduce((sum, stars) => sum + stars, 0) / total;

    await tx.recipe.update({
      where: { id: recipeId },
      data: {
        ratings: Number(average.toFixed(2)),
        ratingCount: total,
      },
    });
  }

  private async generateUniqueSlug(name: string, recipeId: string) {
    const base = this.slugify(name) || 'recipe';
    let slug = base;
    let suffix = 2;

    while (
      await this.prisma.recipe.findFirst({
        where: { slug, id: { not: recipeId } },
        select: { id: true },
      })
    ) {
      slug = `${base}-${suffix++}`;
    }

    return slug;
  }

  private slugify(input: string) {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  private resolveOrderBy(sortBy?: string): Prisma.RecipeOrderByWithRelationInput[] {
    if (sortBy === 'popular') return [{ popularityScore: 'desc' }, { views: 'desc' }];
    if (sortBy === 'rating') return [{ ratings: 'desc' }, { ratingCount: 'desc' }];
    return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
  }

  private reviewOrderBy(sort: ListRecipeReviewsQueryDto['sort']): Prisma.ReviewOrderByWithRelationInput[] {
    if (sort === 'highest') return [{ stars: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'lowest') return [{ stars: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'helpful') return [{ upvotes: 'desc' }, { downvotes: 'asc' }, { createdAt: 'desc' }];
    return [{ createdAt: 'desc' }];
  }

  private serializeRecipe<T>(input: T): T {
    return JSON.parse(JSON.stringify(input)) as T;
  }

  private serializeComment<T extends { status: CommentStatus; content: string; replies?: unknown[] }>(
    comment: T,
  ) {
    const output = this.serializeRecipe(comment) as T & { replies?: unknown[] };
    if (output.status === CommentStatus.REMOVED) output.content = 'Comment removed by its author.';
    if (output.replies) {
      output.replies = output.replies.map((reply) => {
        const item = reply as { status: CommentStatus; content: string };
        return item.status === CommentStatus.REMOVED
          ? { ...item, content: 'Comment removed by its author.' }
          : item;
      });
    }
    return output;
  }

  private listRecipeSelect() {
    return {
      id: true,
      clientDraftId: true,
      version: true,
      slug: true,
      name: true,
      about: true,
      mainImage: true,
      totalTimeReq: true,
      yield: true,
      calories: true,
      diet: true,
      cuisine: true,
      difficulty: true,
      ratings: true,
      ratingCount: true,
      views: true,
      likes: true,
      tags: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    } satisfies Prisma.RecipeSelect;
  }

  private ownerRecipeSelect() {
    return {
      id: true,
      clientDraftId: true,
      version: true,
      slug: true,
      status: true,
      name: true,
      about: true,
      mainImage: true,
      mainImagePublicId: true,
      moreImages: true,
      totalTimeReq: true,
      yield: true,
      calories: true,
      diet: true,
      cuisine: true,
      difficulty: true,
      tipsAndTricks: true,
      storingFreezing: true,
      tags: true,
      publishedAt: true,
      submittedAt: true,
      lastEditedAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    } satisfies Prisma.RecipeSelect;
  }
}
