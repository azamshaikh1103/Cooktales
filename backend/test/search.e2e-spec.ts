import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { RecipeStatus, StoryStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { RedisService } from '../src/redis/redis.service';

describe('Global search API', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailQueueService)
      .useValue({ enqueue: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(TurnstileService)
      .useValue({ verify: jest.fn().mockResolvedValue(true) })
      .compile();
    app = moduleRef.createNestApplication();
    const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
    config.set('SEARCH_SUGGESTIONS_IP_LIMIT', 2);
    configureApp(app, config);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@search.test' } } });
    const redis = app.get(RedisService);
    const keys = await redis.getClient().keys('search:*');
    if (keys.length) await redis.getClient().del(...keys);
  });

  afterAll(async () => app.close());

  async function seed() {
    const chef = await prisma.user.create({
      data: {
        name: 'Maya Chickpea Chef',
        username: `maya_chickpea_${Date.now()}`,
        email: `maya_${Date.now()}@search.test`,
        about: 'Plant-based weeknight recipes',
      },
    });
    const recipe = await prisma.recipe.create({
      data: {
        name: 'Smoky Chickpea Tikka',
        about: 'A fast vegan dinner with roasted chickpeas and warm spices.',
        mainImage: 'https://example.com/chickpea.jpg',
        tags: ['vegan', 'weeknight'],
        cuisine: 'Indian',
        totalTimeReq: 30,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: chef.id,
      },
    });
    const story = await prisma.story.create({
      data: {
        title: 'Chickpea pantry notes',
        shortDesc: 'How I keep quick vegan dinners interesting.',
        tags: ['vegan', 'pantry'],
        status: StoryStatus.PUBLISHED,
        publishedAt: new Date(),
        authorId: chef.id,
      },
    });
    await prisma.recipe.create({
      data: {
        name: 'Private chickpea draft',
        tags: ['vegan'],
        status: RecipeStatus.DRAFT,
        authorId: chef.id,
      },
    });
    await prisma.recipe.create({
      data: {
        name: 'Slow butter chicken',
        tags: ['dinner'],
        cuisine: 'Indian',
        totalTimeReq: 90,
        status: RecipeStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 60_000),
        authorId: chef.id,
      },
    });
    return { chef, recipe, story };
  }

  it('returns ranked public recipes, stories, and chefs but never drafts', async () => {
    const { chef, recipe, story } = await seed();
    const response = await request(app.getHttpServer()).get('/api/v1/search?q=chickpea').expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(3);
    expect(response.body.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: recipe.id, type: 'recipe', title: recipe.name }),
        expect.objectContaining({ id: story.id, type: 'story', title: story.title }),
        expect.objectContaining({ id: chef.id, type: 'chef', slug: chef.username }),
      ]),
    );
    expect(response.body.results.some((item: { title: string }) => item.title === 'Private chickpea draft')).toBe(false);
  });

  it('supports typo-tolerant suggestions and recipe filters', async () => {
    const { recipe } = await seed();
    const typo = await request(app.getHttpServer())
      .get('/api/v1/search/suggestions?q=chikpea&type=recipe')
      .expect(200);
    expect(typo.body.suggestions).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: recipe.id, type: 'recipe' })]),
    );

    const filtered = await request(app.getHttpServer())
      .get('/api/v1/search?q=butter&type=recipe&cuisine=Indian&maxMinutes=45')
      .expect(200);
    expect(filtered.body.results).toEqual([]);
  });

  it('validates short, malformed, and unknown query fields', async () => {
    await seed();
    await request(app.getHttpServer()).get('/api/v1/search?q=x').expect(400);
    await request(app.getHttpServer()).get('/api/v1/search?q=chickpea&unexpected=true').expect(400);
    await request(app.getHttpServer()).get('/api/v1/search?q=%27%3Bdrop%20table%20%22User%22%3B--').expect(200);
  });

  it('limits repeated autocomplete requests from one visitor', async () => {
    await seed();
    await request(app.getHttpServer()).get('/api/v1/search/suggestions?q=chickpea').expect(200);
    await request(app.getHttpServer()).get('/api/v1/search/suggestions?q=chickpea').expect(200);
    await request(app.getHttpServer()).get('/api/v1/search/suggestions?q=chickpea').expect(429);
  });
});
