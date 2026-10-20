import { ForbiddenException, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AccountStatus, RecipeStatus, StoryStatus, UserRole } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { MediaService } from '../src/modules/media/media.service';

const validPassword = 'Password123';

describe('Profile API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;

  const media = {
    assertCloudinaryUrl: jest.fn(),
    assertOwnedProfileAsset: jest.fn(),
    deleteOwnAsset: jest.fn().mockResolvedValue({ result: 'ok' }),
    deleteAsset: jest.fn().mockResolvedValue({ result: 'ok' }),
    markAttached: jest.fn().mockResolvedValue(undefined),
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
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@profile.test' } } });
    jest.clearAllMocks();
    media.deleteOwnAsset.mockResolvedValue({ result: 'ok' });
  });

  afterAll(async () => {
    await app.close();
  });

  async function createUser(input: {
    email: string;
    username: string;
    password?: string | null;
    status?: AccountStatus;
    deletedAt?: Date | null;
  }) {
    return prisma.user.create({
      data: {
        name: input.username,
        email: input.email,
        username: input.username,
        password: input.password === null ? null : await hash(input.password || validPassword, 12),
        emailVerified: new Date(),
        status: input.status || AccountStatus.ACTIVE,
        deletedAt: input.deletedAt,
      },
    });
  }

  async function accessToken(user: { id: string; email: string; role: UserRole }) {
    return jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: 900,
      },
    );
  }

  function authorized(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  it('returns only safe public data and published recipes', async () => {
    const user = await createUser({
      email: 'public@profile.test',
      username: 'public_chef',
    });
    await prisma.recipe.createMany({
      data: [
        {
          name: 'Published Recipe',
          authorId: user.id,
          status: RecipeStatus.PUBLISHED,
          publishedAt: new Date(),
          tags: [],
          moreImages: [],
        },
        {
          name: 'Private Draft',
          authorId: user.id,
          status: RecipeStatus.DRAFT,
          tags: [],
          moreImages: [],
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/profiles/public_chef')
      .expect(200);

    expect(response.body.profile).not.toHaveProperty('email');
    expect(response.body.profile).not.toHaveProperty('password');
    expect(response.body.profile._count.recipes).toBe(1);
    expect(response.body.profile.recipes.map((recipe: { name: string }) => recipe.name)).toEqual([
      'Published Recipe',
    ]);
  });

  it('hides missing, suspended, and deactivated profiles', async () => {
    await createUser({
      email: 'suspended@profile.test',
      username: 'suspended_chef',
      status: AccountStatus.SUSPENDED,
    });
    await createUser({
      email: 'deleted@profile.test',
      username: 'deleted_chef',
      status: AccountStatus.DELETED,
      deletedAt: new Date(),
    });

    await request(app.getHttpServer()).get('/api/v1/profiles/missing_chef').expect(404);
    await request(app.getHttpServer()).get('/api/v1/profiles/suspended_chef').expect(404);
    await request(app.getHttpServer()).get('/api/v1/profiles/deleted_chef').expect(404);
  });

  it('protects private profile data and validates profile updates', async () => {
    const user = await createUser({ email: 'owner@profile.test', username: 'profile_owner' });
    const duplicate = await createUser({
      email: 'duplicate@profile.test',
      username: 'reserved_name',
    });
    const token = await accessToken(user);

    await request(app.getHttpServer()).get('/api/v1/profile/me').expect(401);

    const me = await request(app.getHttpServer())
      .get('/api/v1/profile/me')
      .set(authorized(token))
      .expect(200);
    expect(me.body.user.email).toBe(user.email);
    expect(me.body.user).not.toHaveProperty('password');

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ role: 'ADMIN' })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ username: duplicate.username })
      .expect(409);

    const updated = await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ name: 'Updated Chef', username: 'Updated_Chef', about: 'Testing profile APIs.' })
      .expect(200);
    expect(updated.body.user).toMatchObject({
      name: 'Updated Chef',
      username: 'updated_chef',
      about: 'Testing profile APIs.',
    });
  });

  it('returns a private, paginated saved library with published recipes and stories only', async () => {
    const owner = await createUser({ email: 'saved@profile.test', username: 'saved_owner' });
    const stranger = await createUser({ email: 'saved-other@profile.test', username: 'saved_other' });
    const [publishedRecipe, draftRecipe, publishedStory, draftStory] = await Promise.all([
      prisma.recipe.create({
        data: {
          name: 'Saved published recipe',
          slug: 'saved-published-recipe',
          authorId: owner.id,
          status: RecipeStatus.PUBLISHED,
          publishedAt: new Date(),
          tags: [],
          moreImages: [],
        },
      }),
      prisma.recipe.create({
        data: {
          name: 'Saved draft recipe',
          authorId: owner.id,
          status: RecipeStatus.DRAFT,
          tags: [],
          moreImages: [],
        },
      }),
      prisma.story.create({
        data: {
          title: 'Saved published story',
          slug: 'saved-published-story',
          authorId: owner.id,
          status: StoryStatus.PUBLISHED,
          publishedAt: new Date(),
          tags: [],
        },
      }),
      prisma.story.create({
        data: {
          title: 'Saved draft story',
          authorId: owner.id,
          status: StoryStatus.DRAFT,
          tags: [],
        },
      }),
    ]);
    await prisma.bookmark.createMany({
      data: [
        { userId: owner.id, recipeId: publishedRecipe.id },
        { userId: owner.id, recipeId: draftRecipe.id },
        { userId: owner.id, blogId: publishedStory.id },
        { userId: owner.id, blogId: draftStory.id },
      ],
    });
    const ownerToken = await accessToken(owner);
    const strangerToken = await accessToken(stranger);

    await request(app.getHttpServer()).get('/api/v1/profile/bookmarks').expect(401);

    const all = await request(app.getHttpServer())
      .get('/api/v1/profile/bookmarks?type=all&page=1&limit=12')
      .set(authorized(ownerToken))
      .expect(200);
    expect(all.body).toMatchObject({ total: 2, page: 1, hasMore: false });
    expect(all.body.items.map((item: { recipe?: unknown; story?: unknown }) => Boolean(item.recipe || item.story))).toEqual([true, true]);
    expect(all.body.items.some((item: { recipe?: { id: string } }) => item.recipe?.id === draftRecipe.id)).toBe(false);
    expect(all.body.items.some((item: { story?: { id: string } }) => item.story?.id === draftStory.id)).toBe(false);

    const recipes = await request(app.getHttpServer())
      .get('/api/v1/profile/bookmarks?type=recipes&page=1&limit=12')
      .set(authorized(ownerToken))
      .expect(200);
    expect(recipes.body).toMatchObject({ total: 1 });
    expect(recipes.body.items[0].recipe.id).toBe(publishedRecipe.id);

    const other = await request(app.getHttpServer())
      .get('/api/v1/profile/bookmarks?type=all&page=1&limit=12')
      .set(authorized(strangerToken))
      .expect(200);
    expect(other.body).toMatchObject({ total: 0, items: [] });

    const viewer = await request(app.getHttpServer())
      .get('/api/v1/profiles/saved_owner/viewer')
      .set(authorized(ownerToken))
      .expect(200);
    expect(viewer.body).toMatchObject({ isOwnProfile: true, savedCount: 2 });
    expect(viewer.body).not.toHaveProperty('bookmarks');
  });

  it('updates profile media only as a URL/public-ID pair and cleans up replaced assets', async () => {
    const user = await createUser({ email: 'media@profile.test', username: 'media_owner' });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        image: 'https://res.cloudinary.com/test/image/upload/old.jpg',
        imagePublicId: `cooktale/users/${user.id}/avatar/old`,
      },
    });
    const token = await accessToken(user);

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ image: 'https://res.cloudinary.com/test/image/upload/missing-id.jpg' })
      .expect(400);

    const newPublicId = `cooktale/users/${user.id}/avatar/new`;
    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({
        image: 'https://res.cloudinary.com/test/image/upload/new.jpg',
        imagePublicId: newPublicId,
      })
      .expect(200);

    expect(media.assertCloudinaryUrl).toHaveBeenCalled();
    expect(media.assertOwnedProfileAsset).toHaveBeenCalledWith(user.id, newPublicId, 'USER_AVATAR');
    expect(media.deleteOwnAsset).toHaveBeenCalledWith(user.id, {
      publicId: `cooktale/users/${user.id}/avatar/old`,
      resourceType: 'image',
    });

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ image: null, imagePublicId: null })
      .expect(200);
    expect((await prisma.user.findUnique({ where: { id: user.id } }))?.image).toBeNull();
  });

  it('rejects media that the user does not own', async () => {
    const user = await createUser({ email: 'intruder@profile.test', username: 'intruder' });
    const token = await accessToken(user);
    media.assertOwnedProfileAsset.mockImplementationOnce(() => {
      throw new ForbiddenException('Profile media does not belong to this user');
    });

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({
        image: 'https://res.cloudinary.com/test/image/upload/stolen.jpg',
        imagePublicId: 'cooktale/users/someone-else/avatar/stolen',
      })
      .expect(403);
  });

  it('makes follow and unfollow idempotent and prevents self-following', async () => {
    const follower = await createUser({
      email: 'follower@profile.test',
      username: 'follower_user',
    });
    const creator = await createUser({
      email: 'creator@profile.test',
      username: 'creator_user',
    });
    const token = await accessToken(follower);

    await request(app.getHttpServer())
      .post(`/api/v1/profiles/${follower.id}/follow`)
      .set(authorized(token))
      .send({})
      .expect(400);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await request(app.getHttpServer())
        .post(`/api/v1/profiles/${creator.id}/follow`)
        .set(authorized(token))
        .send({})
        .expect(200);
    }
    expect(await prisma.follower.count({ where: { userId: creator.id } })).toBe(1);
    expect(await prisma.following.count({ where: { userId: follower.id } })).toBe(1);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await request(app.getHttpServer())
        .delete(`/api/v1/profiles/${creator.id}/follow`)
        .set(authorized(token))
        .expect(200);
    }
    expect(await prisma.follower.count({ where: { userId: creator.id } })).toBe(0);
    expect(await prisma.following.count({ where: { userId: follower.id } })).toBe(0);
  });

  it('paginates published recipes, stories, followers, and following', async () => {
    const creator = await createUser({ email: 'pages@profile.test', username: 'pages_user' });
    const followers = await Promise.all(
      Array.from({ length: 7 }, (_, index) =>
        createUser({ email: `list-${index}@profile.test`, username: `list_user_${index}` }),
      ),
    );
    await prisma.recipe.createMany({
      data: [
        ...Array.from({ length: 13 }, (_, index) => ({
          name: `Published ${index}`,
          authorId: creator.id,
          status: RecipeStatus.PUBLISHED,
          publishedAt: new Date(Date.now() + index),
          tags: [],
          moreImages: [],
        })),
        {
          name: 'Hidden Draft',
          authorId: creator.id,
          status: RecipeStatus.DRAFT,
          tags: [],
          moreImages: [],
        },
      ],
    });
    await prisma.story.createMany({
      data: Array.from({ length: 8 }, (_, index) => ({
        title: `Story ${index}`,
        slug: `pages-story-${index}`,
        shortDesc: 'Story',
        tags: [],
        authorId: creator.id,
        status: 'PUBLISHED',
        publishedAt: new Date(Date.now() + index),
      })),
    });
    await prisma.follower.createMany({
      data: followers.map((follower) => ({ userId: creator.id, followerId: follower.id })),
    });
    await prisma.following.createMany({
      data: followers.map((following) => ({ userId: creator.id, followingId: following.id })),
    });

    const recipes = await request(app.getHttpServer())
      .get('/api/v1/profiles/pages_user/recipes?page=2&limit=5')
      .expect(200);
    expect(recipes.body).toMatchObject({ page: 2, limit: 5, total: 13, hasMore: true });
    expect(recipes.body.items).toHaveLength(5);
    expect(recipes.body.items.map((item: { name: string }) => item.name)).not.toContain(
      'Hidden Draft',
    );

    const stories = await request(app.getHttpServer())
      .get('/api/v1/profiles/pages_user/stories?page=2&limit=5')
      .expect(200);
    expect(stories.body).toMatchObject({ total: 8, hasMore: false });
    expect(stories.body.items).toHaveLength(3);

    const followerList = await request(app.getHttpServer())
      .get('/api/v1/profiles/pages_user/followers?page=1&limit=3')
      .expect(200);
    expect(followerList.body).toMatchObject({ total: 7, hasMore: true });
    expect(followerList.body.items[0]).not.toHaveProperty('email');

    const followingList = await request(app.getHttpServer())
      .get('/api/v1/profiles/pages_user/following?page=3&limit=3')
      .expect(200);
    expect(followingList.body.items).toHaveLength(1);
  });

  it('keeps old profile URLs and enforces the username change cooldown', async () => {
    const user = await createUser({ email: 'rename@profile.test', username: 'original_name' });
    const token = await accessToken(user);

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ username: 'current_name' })
      .expect(200);

    const oldProfile = await request(app.getHttpServer())
      .get('/api/v1/profiles/original_name')
      .expect(200);
    expect(oldProfile.body).toMatchObject({
      canonicalHandle: 'current_name',
      redirectedFrom: 'original_name',
    });

    await request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set(authorized(token))
      .send({ username: 'another_name' })
      .expect(429);
  });

  it('updates preferences and notifications with validated fields', async () => {
    const user = await createUser({ email: 'settings@profile.test', username: 'settings_user' });
    const token = await accessToken(user);

    await request(app.getHttpServer())
      .patch('/api/v1/profile/preferences')
      .set(authorized(token))
      .send({ measurementSystem: 'IMPERIAL', timezone: 'Asia/Kolkata' })
      .expect(200)
      .expect(({ body }) => expect(body.user.measurementSystem).toBe('IMPERIAL'));

    await request(app.getHttpServer())
      .patch('/api/v1/profile/notifications')
      .set(authorized(token))
      .send({ email_digest: true, admin_override: true })
      .expect(400);
  });

  it('changes the password and revokes every refresh session', async () => {
    const user = await createUser({ email: 'password@profile.test', username: 'password_user' });
    const token = await accessToken(user);
    await prisma.authSession.createMany({
      data: [
        {
          userId: user.id,
          refreshTokenHash: 'session-one',
          expiresAt: new Date(Date.now() + 60_000),
        },
        {
          userId: user.id,
          refreshTokenHash: 'session-two',
          expiresAt: new Date(Date.now() + 60_000),
        },
      ],
    });

    await request(app.getHttpServer())
      .post('/api/v1/profile/change-password')
      .set(authorized(token))
      .send({ currentPassword: 'wrong-password', newPassword: 'NewPassword456' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/profile/change-password')
      .set(authorized(token))
      .send({ currentPassword: validPassword, newPassword: 'NewPassword456' })
      .expect(200);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await compare('NewPassword456', updated.password as string)).toBe(true);
    expect(await prisma.authSession.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
  });

  it('deactivates the account, revokes sessions, removes media, and rejects the old access token', async () => {
    const user = await createUser({ email: 'deactivate@profile.test', username: 'leaving_user' });
    const imagePublicId = `cooktale/users/${user.id}/avatar/current`;
    const bannerPublicId = `cooktale/users/${user.id}/banner/current`;
    await prisma.user.update({
      where: { id: user.id },
      data: { imagePublicId, bannerImagePublicId: bannerPublicId },
    });
    await prisma.authSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: 'active-session',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const token = await accessToken(user);

    await request(app.getHttpServer())
      .delete('/api/v1/profile/me')
      .set(authorized(token))
      .expect(200);

    const deactivated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(deactivated.status).toBe(AccountStatus.DELETED);
    expect(deactivated.deletedAt).not.toBeNull();
    expect(await prisma.authSession.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);
    expect(media.deleteOwnAsset).toHaveBeenCalledTimes(2);

    await request(app.getHttpServer()).get('/api/v1/profile/me').set(authorized(token)).expect(401);
    await request(app.getHttpServer()).get('/api/v1/profiles/leaving_user').expect(404);
  });

  it('requires authentication for data export', async () => {
    const user = await createUser({ email: 'export@profile.test', username: 'export_user' });
    const token = await accessToken(user);

    await request(app.getHttpServer()).get('/api/v1/profile/export').expect(401);
    const response = await request(app.getHttpServer())
      .get('/api/v1/profile/export')
      .set(authorized(token))
      .expect(200);
    expect(response.body.data.account.email).toBe(user.email);
    expect(response.body.data).toMatchObject({ schemaVersion: 1 });
    expect(response.body.data).toHaveProperty('recipes');
    expect(response.body.data).toHaveProperty('followers');
    expect(response.body.data.account).not.toHaveProperty('password');
    expect(JSON.stringify(response.body.data)).not.toContain('refreshTokenHash');
    expect(JSON.stringify(response.body.data)).not.toContain('access_token');
  });
});
