import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { CommentStatus, RecipeStatus, ReviewStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { MediaService } from '../src/modules/media/media.service';
import { RecipeViewService } from '../src/modules/recipes/recipe-view.service';
import { RedisService } from '../src/redis/redis.service';

describe('Recipe CRUD API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;
  let redis: RedisService;
  let recipeViews: RecipeViewService;

  const media = {
    assertCloudinaryUrl: jest.fn(),
    assertAttachableUploads: jest.fn().mockResolvedValue(undefined),
    markAttached: jest.fn().mockResolvedValue(undefined),
    scheduleDeletion: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailQueueService)
      .useValue({ enqueue: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(TurnstileService)
      .useValue({ verify: jest.fn().mockResolvedValue(true) })
      .overrideProvider(MediaService)
      .useValue(media)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app, app.get<ConfigService<AppConfig, true>>(ConfigService));
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    config = app.get(ConfigService);
    redis = app.get(RedisService);
    recipeViews = app.get(RecipeViewService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@recipe.test' } } });
    jest.clearAllMocks();
    media.assertAttachableUploads.mockResolvedValue(undefined);
    media.markAttached.mockResolvedValue(undefined);
    media.scheduleDeletion.mockResolvedValue(undefined);
    const keys = await redis.getClient().keys('recipe:*');
    if (keys.length) await redis.getClient().del(...keys);
  });

  afterAll(async () => app.close());

  async function createUser(label: string, verified = true) {
    const user = await prisma.user.create({
      data: {
        name: label,
        username: `${label}_${Date.now()}`,
        email: `${label}_${Date.now()}@recipe.test`,
        emailVerified: verified ? new Date() : null,
      },
    });
    const token = await jwt.signAsync(
      { sub: user.id, email: user.email, role: UserRole.USER },
      { secret: config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn: 900 },
    );
    return { user, token };
  }

  const auth = (token: string) => ({
    Authorization: `Bearer ${token}`,
    Origin: 'http://localhost:3001',
  });

  it('requires authentication and creates one draft for repeated client retries', async () => {
    const { user, token } = await createUser('retry');
    const clientDraftId = '09f4cc83-60d0-449f-a2d1-4c5e81b826f6';

    await request(app.getHttpServer())
      .post('/api/v1/recipes/drafts')
      .set('Origin', 'http://localhost:3001')
      .send({})
      .expect(401);
    const first = await request(app.getHttpServer())
      .post('/api/v1/recipes/drafts')
      .set(auth(token))
      .send({ clientDraftId, name: 'Retry-safe draft' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/v1/recipes/drafts')
      .set(auth(token))
      .send({ clientDraftId, name: 'Duplicate request' })
      .expect(201);

    expect(second.body.recipe.id).toBe(first.body.recipe.id);
    expect(second.body.recipe.version).toBe(1);
    expect(await prisma.recipe.count({ where: { authorId: user.id } })).toBe(1);
  });

  it('lists and resumes only the authenticated owner recipes', async () => {
    const owner = await createUser('owner');
    const stranger = await createUser('stranger');
    const draft = await prisma.recipe.create({
      data: { name: 'Private draft', authorId: owner.user.id, tags: [], moreImages: [] },
    });

    const list = await request(app.getHttpServer())
      .get('/api/v1/recipes/mine/list?status=DRAFT')
      .set(auth(owner.token))
      .expect(200);
    expect(list.body.total).toBe(1);
    expect(list.body.recipes[0].id).toBe(draft.id);

    await request(app.getHttpServer())
      .get(`/api/v1/recipes/${draft.id}/manage`)
      .set(auth(stranger.token))
      .expect(404);
    await request(app.getHttpServer()).get(`/api/v1/recipes/${draft.id}`).expect(404);
  });

  it('updates nested data in order and rejects a stale tab without partial writes', async () => {
    const { user, token } = await createUser('version');
    const draft = await prisma.recipe.create({
      data: { name: 'Versioned draft', authorId: user.id, tags: [], moreImages: [] },
    });
    const payload = {
      expectedVersion: 1,
      name: 'Updated draft',
      ingredients: [{ name: 'Second' }, { name: 'First' }],
      equipments: [{ name: 'Pan' }, { name: 'Spoon' }],
      steps: [
        { name: 'Prepare', detail: 'Prepare everything.' },
        { name: 'Cook', detail: 'Cook everything.' },
      ],
      faqs: [{ question: 'Can I store it?', answer: 'Yes, refrigerate it safely.' }],
    };
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${draft.id}`)
      .set(auth(token))
      .send(payload)
      .expect(200);
    expect(updated.body.recipe.version).toBe(2);
    expect(updated.body.recipe.ingredients.map((item: { name: string }) => item.name)).toEqual([
      'Second',
      'First',
    ]);

    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${draft.id}`)
      .set(auth(token))
      .send({ expectedVersion: 1, name: 'Stale overwrite', ingredients: [{ name: 'Lost' }] })
      .expect(409);
    const stored = await prisma.recipe.findUniqueOrThrow({
      where: { id: draft.id },
      include: { ingredients: { orderBy: { position: 'asc' } } },
    });
    expect(stored.name).toBe('Updated draft');
    expect(stored.ingredients.map((item) => item.name)).toEqual(['Second', 'First']);
  });

  it('validates publish requirements and exposes only a completed published recipe', async () => {
    const { user, token } = await createUser('publish');
    const draft = await prisma.recipe.create({
      data: { name: 'Untitled Recipe', authorId: user.id, tags: [], moreImages: [] },
    });
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${draft.id}/publish`)
      .set(auth(token))
      .send({})
      .expect(400);

    await prisma.recipe.update({
      where: { id: draft.id },
      data: {
        name: 'Complete Recipe',
        mainImage: 'https://res.cloudinary.com/test/image/upload/cover.jpg',
        totalTimeReq: 30,
        ingredients: { create: { name: 'Ingredient', position: 0 } },
        steps: { create: { name: 'Cook', detail: 'Cook it.', position: 0 } },
      },
    });
    const published = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${draft.id}/publish`)
      .set(auth(token))
      .send({})
      .expect(200);
    expect(published.body.recipe).toMatchObject({ status: RecipeStatus.PUBLISHED, version: 2 });
    await request(app.getHttpServer())
      .get(`/api/v1/recipes/${published.body.recipe.slug}`)
      .expect(200);
  });

  it('soft deletes and restores the previous recipe status', async () => {
    const { user, token } = await createUser('restore');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Published before delete',
        authorId: user.id,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        tags: [],
        moreImages: [],
      },
    });
    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}`)
      .set(auth(token))
      .expect(200);
    await request(app.getHttpServer()).get(`/api/v1/recipes/${recipe.id}`).expect(404);

    const restored = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/restore`)
      .set(auth(token))
      .send({})
      .expect(200);
    expect(restored.body.recipe.status).toBe(RecipeStatus.PUBLISHED);
    expect(restored.body.recipe.deletedAt).toBeNull();
  });

  it('requires paired owned Cloudinary media and schedules removed files after saving', async () => {
    const { user, token } = await createUser('media');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Media draft',
        authorId: user.id,
        mainImage: 'https://res.cloudinary.com/test/image/upload/old.jpg',
        mainImagePublicId: 'cooktale/tmp/user/old',
        tags: [],
        moreImages: [],
        media: {
          create: {
            publicId: 'cooktale/tmp/user/gallery-old',
            url: 'https://res.cloudinary.com/test/image/upload/gallery-old.jpg',
            kind: 'GALLERY',
          },
        },
      },
    });

    const loaded = await request(app.getHttpServer())
      .get(`/api/v1/recipes/${recipe.id}/manage`)
      .set(auth(token))
      .expect(200);
    expect(loaded.body.recipe.media[0]).not.toHaveProperty('id');

    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}`)
      .set(auth(token))
      .send({ expectedVersion: 1, mainImage: 'https://res.cloudinary.com/test/new.jpg' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}`)
      .set(auth(token))
      .send({
        expectedVersion: 1,
        mainImage: 'https://res.cloudinary.com/test/image/upload/new.jpg',
        mainImagePublicId: 'cooktale/tmp/user/new',
        media: [],
      })
      .expect(200);
    expect(media.assertAttachableUploads).toHaveBeenCalledWith(user.id, ['cooktale/tmp/user/new']);
    expect(media.scheduleDeletion).toHaveBeenCalledWith(
      user.id,
      expect.arrayContaining([
        expect.objectContaining({ publicId: 'cooktale/tmp/user/old' }),
        expect.objectContaining({ publicId: 'cooktale/tmp/user/gallery-old' }),
      ]),
    );
  });

  it('serves public detail and compact cook mode by slug only', async () => {
    const { user } = await createUser('public');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Slug only recipe',
        slug: 'slug-only-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: user.id,
        tags: [],
        moreImages: [],
        ingredients: { create: { name: 'Flour', position: 0 } },
        steps: { create: { name: 'Mix', position: 0 } },
      },
    });

    const detail = await request(app.getHttpServer())
      .get('/api/v1/recipes/slug-only-recipe')
      .expect(200);
    expect(detail.body.recipe.id).toBe(recipe.id);
    await request(app.getHttpServer()).get(`/api/v1/recipes/${recipe.id}`).expect(404);

    const cook = await request(app.getHttpServer())
      .get('/api/v1/recipes/slug-only-recipe/cook')
      .expect(200);
    expect(cook.body.recipe.ingredients[0].name).toBe('Flour');
    expect(cook.body.recipe).not.toHaveProperty('reviews');
    expect(cook.body.recipe).not.toHaveProperty('likes');
  });

  it('keeps likes and bookmarks idempotent under repeated requests', async () => {
    const owner = await createUser('reaction-owner');
    const viewer = await createUser('reaction-viewer');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Reaction recipe',
        slug: 'reaction-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: owner.user.id,
        tags: [],
        moreImages: [],
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/like`)
      .set(auth(viewer.token))
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/like`)
      .set(auth(viewer.token))
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/bookmark`)
      .set(auth(viewer.token))
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/bookmark`)
      .set(auth(viewer.token))
      .send({})
      .expect(200);

    expect(await prisma.like.count({ where: { recipeId: recipe.id } })).toBe(1);
    expect(await prisma.bookmark.count({ where: { recipeId: recipe.id } })).toBe(1);
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).likes).toBe(1);

    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/like`)
      .set(auth(viewer.token))
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/like`)
      .set(auth(viewer.token))
      .expect(200);
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).likes).toBe(0);
  });

  it('enforces review ownership, one review per user, voting rules, and pagination', async () => {
    const owner = await createUser('review-owner');
    const reviewer = await createUser('reviewer');
    const voter = await createUser('voter');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Review recipe',
        slug: 'review-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: owner.user.id,
        tags: [],
        moreImages: [],
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(owner.token))
      .send({ stars: 5, text: 'My own recipe is perfect' })
      .expect(403);

    const created = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(reviewer.token))
      .send({ stars: 4, text: 'Very good recipe' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(reviewer.token))
      .send({ stars: 5, text: 'Even better after retry' })
      .expect(201);
    expect(await prisma.review.count({ where: { recipeId: recipe.id } })).toBe(1);

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}/vote`)
      .set(auth(reviewer.token))
      .send({ type: 'UP' })
      .expect(403);
    const voted = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}/vote`)
      .set(auth(voter.token))
      .send({ type: 'UP' })
      .expect(200);
    expect(voted.body).toMatchObject({ upvotes: 1, downvotes: 0, myVote: 'UP' });

    const unvoted = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}/vote`)
      .set(auth(voter.token))
      .send({ type: 'UP' })
      .expect(200);
    expect(unvoted.body).toMatchObject({ upvotes: 0, myVote: null });

    const page = await request(app.getHttpServer())
      .get('/api/v1/recipes/review-recipe/reviews?page=1&limit=1')
      .expect(200);
    expect(page.body).toMatchObject({ total: 1, page: 1, limit: 1, hasMore: false });

    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}/reply`)
      .set(auth(reviewer.token))
      .send({ reply: 'Not my recipe' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}/reply`)
      .set(auth(owner.token))
      .send({ reply: 'Thank you for cooking it' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}`)
      .set(auth(reviewer.token))
      .send({ stars: 3, text: 'Updated after cooking it again' })
      .expect(200);
    expect(
      await prisma.review.findUniqueOrThrow({ where: { id: created.body.review.id } }),
    ).toMatchObject({ editedAt: expect.any(Date) });
    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}`)
      .set(auth(voter.token))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/reviews/${created.body.review.id}`)
      .set(auth(reviewer.token))
      .expect(200);
    expect(
      await prisma.review.findUniqueOrThrow({ where: { id: created.body.review.id } }),
    ).toMatchObject({ status: ReviewStatus.REMOVED, deletedAt: expect.any(Date) });
    const afterRemoval = await request(app.getHttpServer())
      .get('/api/v1/recipes/review-recipe/reviews?page=1&limit=10')
      .expect(200);
    expect(afterRemoval.body).toMatchObject({ total: 0, reviews: [] });
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).ratingCount).toBe(
      0,
    );
  });

  it('requires verified accounts and sorts only visible reviews', async () => {
    const owner = await createUser('review-sort-owner');
    const unverified = await createUser('review-sort-unverified', false);
    const lowReviewer = await createUser('review-sort-low');
    const highReviewer = await createUser('review-sort-high');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Sorted review recipe',
        slug: 'sorted-review-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: owner.user.id,
        tags: [],
        moreImages: [],
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(unverified.token))
      .send({ stars: 5, text: 'This should not be published' })
      .expect(403);

    const low = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(lowReviewer.token))
      .send({ stars: 2, text: 'Needs a little more seasoning' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/reviews`)
      .set(auth(highReviewer.token))
      .send({ stars: 5, text: 'Clear steps and a great result' })
      .expect(201);

    const highest = await request(app.getHttpServer())
      .get('/api/v1/recipes/sorted-review-recipe/reviews?sort=highest')
      .expect(200);
    expect(highest.body.reviews.map((review: { stars: number }) => review.stars)).toEqual([5, 2]);

    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/reviews/${low.body.review.id}`)
      .set(auth(lowReviewer.token))
      .expect(200);
    const visibleOnly = await request(app.getHttpServer())
      .get('/api/v1/recipes/sorted-review-recipe/reviews?sort=newest')
      .expect(200);
    expect(visibleOnly.body).toMatchObject({ total: 1 });
    expect(visibleOnly.body.reviews[0].stars).toBe(5);
  });

  it('keeps recipe comments safe, paginated, and reply depth limited to one', async () => {
    const owner = await createUser('comment-owner');
    const author = await createUser('comment-author');
    const replier = await createUser('comment-replier');
    const unverified = await createUser('comment-unverified', false);
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Comment recipe',
        slug: 'comment-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: owner.user.id,
        tags: [],
        moreImages: [],
      },
    });
    const draft = await prisma.recipe.create({
      data: { name: 'Private comments', authorId: owner.user.id, tags: [], moreImages: [] },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${draft.id}/comments`)
      .set(auth(author.token))
      .send({ content: 'This must stay private' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments`)
      .set(auth(unverified.token))
      .send({ content: 'This must be verified first' })
      .expect(403);

    const created = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments`)
      .set(auth(author.token))
      .send({ content: 'This recipe worked beautifully.' })
      .expect(201);
    const reply = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments`)
      .set(auth(replier.token))
      .send({ content: 'Glad it worked for you.', parentId: created.body.comment.id })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments`)
      .set(auth(owner.token))
      .send({ content: 'No nested reply chains.', parentId: reply.body.comment.id })
      .expect(404);

    const listed = await request(app.getHttpServer())
      .get('/api/v1/recipes/comment-recipe/comments?page=1&limit=10')
      .expect(200);
    expect(listed.body).toMatchObject({ total: 1, hasMore: false });
    expect(listed.body.comments[0].replies).toHaveLength(1);
    expect(listed.body.comments[0]._count).toMatchObject({ likes: 0, replies: 1 });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments/${created.body.comment.id}/like`)
      .set(auth(author.token))
      .send({})
      .expect(403);
    const liked = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments/${created.body.comment.id}/like`)
      .set(auth(replier.token))
      .send({})
      .expect(200);
    expect(liked.body).toMatchObject({ liked: true, likes: 1 });
    const viewer = await request(app.getHttpServer())
      .get(`/api/v1/recipes/${recipe.id}/comments/viewer?ids=${created.body.comment.id}`)
      .set(auth(replier.token))
      .expect(200);
    expect(viewer.body.likedCommentIds).toEqual([created.body.comment.id]);
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments/${created.body.comment.id}/like`)
      .set(auth(replier.token))
      .send({})
      .expect(200);
    expect(await prisma.like.count({ where: { commentId: created.body.comment.id } })).toBe(1);

    await request(app.getHttpServer())
      .patch(`/api/v1/recipes/${recipe.id}/comments/${created.body.comment.id}`)
      .set(auth(author.token))
      .send({ content: 'This recipe worked beautifully after a small change.' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/comments/${created.body.comment.id}`)
      .set(auth(replier.token))
      .expect(404);
    await request(app.getHttpServer())
      .delete(`/api/v1/recipes/${recipe.id}/comments/${created.body.comment.id}`)
      .set(auth(author.token))
      .expect(200);

    const removed = await request(app.getHttpServer())
      .get('/api/v1/recipes/comment-recipe/comments?page=1&limit=10')
      .expect(200);
    expect(removed.body.comments[0]).toMatchObject({
      status: CommentStatus.REMOVED,
      content: 'Comment removed by its author.',
    });
    expect(removed.body.comments[0].replies).toHaveLength(1);
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).commentsCount).toBe(1);
  });

  it('rate limits rapid recipe comment posting', async () => {
    const owner = await createUser('comment-rate-owner');
    const commenter = await createUser('comment-rate-user');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Comment rate recipe',
        slug: 'comment-rate-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: owner.user.id,
        tags: [],
        moreImages: [],
      },
    });

    for (let index = 0; index < 5; index += 1) {
      await request(app.getHttpServer())
        .post(`/api/v1/recipes/${recipe.id}/comments`)
        .set(auth(commenter.token))
        .send({ content: `Helpful comment number ${index + 1}` })
        .expect(201);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/comments`)
      .set(auth(commenter.token))
      .send({ content: 'This rapid sixth comment should be blocked' })
      .expect(429);
  });

  it('deduplicates engaged views and never accepts a client-provided count', async () => {
    const { user } = await createUser('view-owner');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Viewed recipe',
        slug: 'viewed-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: user.id,
        tags: [],
        moreImages: [],
      },
    });

    const first = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/views`)
      .set('Origin', 'http://localhost:3001')
      .set('User-Agent', 'recipe-view-test')
      .send({ count: 100000 })
      .expect(400);
    expect(first.body.message).toContain('property count should not exist');

    const accepted = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/views`)
      .set('Origin', 'http://localhost:3001')
      .set('User-Agent', 'recipe-view-test')
      .send({})
      .expect(200);
    const duplicate = await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/views`)
      .set('Origin', 'http://localhost:3001')
      .set('User-Agent', 'recipe-view-test')
      .send({})
      .expect(200);
    expect(accepted.body.counted).toBe(true);
    expect(duplicate.body.counted).toBe(false);
    expect(await redis.getClient().hget('recipe:views:pending', recipe.id)).toBe('1');
    await recipeViews.flush();
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).views).toBe(1);

    await redis.getClient().hset('recipe:views:pending:processing', recipe.id, 2);
    await recipeViews.flush();
    expect((await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } })).views).toBe(3);
  });

  it('rejects untrusted mutation origins and rate limits review abuse', async () => {
    const owner = await createUser('limit-owner');
    const viewer = await createUser('limit-viewer');
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Limited recipe',
        slug: 'limited-recipe',
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: owner.user.id,
        tags: [],
        moreImages: [],
      },
    });

    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/like`)
      .set('Authorization', `Bearer ${viewer.token}`)
      .set('Origin', 'https://attacker.example')
      .send({})
      .expect(403);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post(`/api/v1/recipes/${recipe.id}/ratings`)
        .set(auth(viewer.token))
        .send({ stars: 4 })
        .expect(200);
    }
    await request(app.getHttpServer())
      .post(`/api/v1/recipes/${recipe.id}/ratings`)
      .set(auth(viewer.token))
      .send({ stars: 4 })
      .expect(429);
  });
});
