import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AccountStatus, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { MediaService } from '../src/modules/media/media.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';

describe('Optional onboarding survey API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailQueueService)
      .useValue({ enqueue: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(TurnstileService)
      .useValue({ verify: jest.fn().mockResolvedValue(true) })
      .overrideProvider(MediaService)
      .useValue({
        assertCloudinaryUrl: jest.fn(),
        assertAttachableUploads: jest.fn().mockResolvedValue(undefined),
        markAttached: jest.fn().mockResolvedValue(undefined),
        scheduleDeletion: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
    config = app.get(ConfigService);
    configureApp(app, config);
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@onboarding.test' } } });
  });

  afterAll(async () => app.close());

  async function createUser(email: string) {
    return prisma.user.create({
      data: {
        name: 'Onboarding User',
        email,
        username: email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').slice(0, 20),
        password: await hash('Password123', 12),
        emailVerified: new Date(),
        status: AccountStatus.ACTIVE,
      },
    });
  }

  async function tokenFor(user: { id: string; email: string; role: UserRole }) {
    return jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn: 900 },
    );
  }

  it('saves structured marketing answers only for the authenticated user', async () => {
    const user = await createUser('answers@onboarding.test');
    const token = await tokenFor(user);

    await request(app.getHttpServer())
      .post('/api/v1/onboarding/survey')
      .set('Authorization', `Bearer ${token}`)
      .send({
        discoverySource: 'INSTAGRAM',
        primaryGoal: 'SHARE_RECIPES_OR_STORIES',
        cookingIdentity: 'FOOD_CREATOR',
      })
      .expect(200)
      .expect({
        survey: {
          surveyCompleted: true,
          surveySkippedAt: null,
          discoverySource: 'INSTAGRAM',
          discoverySourceDetail: null,
          onboardingGoal: 'SHARE_RECIPES_OR_STORIES',
          cookingIdentity: 'FOOD_CREATOR',
        },
      });

    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.onboardedAt).toBeInstanceOf(Date);
    expect(saved.surveySkippedAt).toBeNull();
  });

  it('allows users to skip and rejects missing or invalid answers', async () => {
    const user = await createUser('skip@onboarding.test');
    const token = await tokenFor(user);

    await request(app.getHttpServer()).get('/api/v1/onboarding/survey').expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/onboarding/survey')
      .set('Authorization', `Bearer ${token}`)
      .send({ discoverySource: 'OTHER', primaryGoal: 'FIND_RECIPES', cookingIdentity: 'HOME_COOK' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/onboarding/survey')
      .set('Authorization', `Bearer ${token}`)
      .send({ discoverySource: 'NOT_A_SOURCE', primaryGoal: 'FIND_RECIPES', cookingIdentity: 'HOME_COOK' })
      .expect(400);

    const skipResponse = await request(app.getHttpServer())
      .post('/api/v1/onboarding/survey/skip')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    expect(skipResponse.body.survey).toMatchObject({
      surveyCompleted: true,
      surveySkippedAt: expect.any(String),
    });

    const saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(saved.surveySkippedAt).toBeInstanceOf(Date);
    expect(saved.discoverySource).toBeNull();
  });
});
