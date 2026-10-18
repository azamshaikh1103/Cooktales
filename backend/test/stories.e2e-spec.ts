import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { StoryStatus, UserRole } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { MediaService } from '../src/modules/media/media.service';

describe('Stories API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;
  const media = {
    assertCloudinaryUrl: jest.fn(),
    assertAttachableUploads: jest.fn().mockResolvedValue(undefined),
    markAttached: jest.fn().mockResolvedValue(undefined),
    scheduleDeletion: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailQueueService).useValue({ enqueue: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(TurnstileService).useValue({ verify: jest.fn().mockResolvedValue(true) })
      .overrideProvider(MediaService).useValue(media).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, app.get<ConfigService<AppConfig, true>>(ConfigService));
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    config = app.get(ConfigService);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: '@story.test' } } });
    jest.clearAllMocks();
  });
  afterAll(async () => app.close());

  async function user(label: string) {
    const created = await prisma.user.create({ data: { name: label, username: `${label}_${Date.now()}`, email: `${label}_${Date.now()}@story.test`, emailVerified: new Date() } });
    const token = await jwt.signAsync({ sub: created.id, email: created.email, role: UserRole.USER }, { secret: config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn: 900 });
    return { created, token };
  }
  const auth = (token: string) => ({ Authorization: `Bearer ${token}`, Origin: 'http://localhost:3001' });

  it('creates one retry-safe draft and protects it from other users', async () => {
    const owner = await user('storyretry');
    const clientDraftId = '71983c89-c2e6-4232-9d93-8a59e64a21f2';
    const first = await request(app.getHttpServer()).post('/api/v1/stories/drafts').set(auth(owner.token)).send({ clientDraftId, title: 'A draft' }).expect(201);
    const repeat = await request(app.getHttpServer()).post('/api/v1/stories/drafts').set(auth(owner.token)).send({ clientDraftId }).expect(201);
    expect(repeat.body.story.id).toBe(first.body.story.id);
    const stranger = await user('storystranger');
    await request(app.getHttpServer()).get(`/api/v1/stories/${first.body.story.id}/manage`).set(auth(stranger.token)).expect(404);
  });

  it('autosaves ordered blocks, rejects stale writes, and cleans replaced media', async () => {
    const { created, token } = await user('storysave');
    const story = await prisma.story.create({
      data: {
        authorId: created.id, title: 'Draft', tags: [], coverImage: 'https://res.cloudinary.com/test/image/upload/old.jpg', coverImagePublicId: 'cooktale/stories/x/cover/old',
        media: { create: { publicId: 'cooktale/stories/x/content/old', url: 'https://res.cloudinary.com/test/image/upload/old-inline.jpg', kind: 'IMAGE' } },
      },
    });
    const update = await request(app.getHttpServer()).patch(`/api/v1/stories/${story.id}`).set(auth(token)).send({
      expectedVersion: 1, title: 'Updated story', shortDesc: 'A short description', coverImage: 'https://res.cloudinary.com/test/image/upload/new.jpg', coverImagePublicId: 'cooktale/stories/x/cover/new',
      content: [{ type: 'paragraph', content: { text: 'First paragraph' } }, { type: 'headline', content: { text: 'A heading' } }],
      media: [{ publicId: 'cooktale/stories/x/content/new', url: 'https://res.cloudinary.com/test/image/upload/new-inline.jpg', kind: 'IMAGE', resourceType: 'IMAGE' }],
    }).expect(200);
    expect(update.body.story.version).toBe(2);
    expect(update.body.story.content.map((block: { position: number }) => block.position)).toEqual([0, 1]);
    expect(media.scheduleDeletion).toHaveBeenCalledWith(created.id, expect.arrayContaining([expect.objectContaining({ publicId: 'cooktale/stories/x/cover/old' }), expect.objectContaining({ publicId: 'cooktale/stories/x/content/old' })]));
    await request(app.getHttpServer()).patch(`/api/v1/stories/${story.id}`).set(auth(token)).send({ expectedVersion: 1, title: 'Lost change' }).expect(409);
  });

  it('publishes only complete stories and supports public interactions and comments', async () => {
    const author = await user('storyauthor');
    const story = await prisma.story.create({
      data: { authorId: author.created.id, title: 'Complete kitchen story', tags: ['food'], coverImage: 'https://res.cloudinary.com/test/image/upload/cover.jpg', coverImagePublicId: 'cooktale/stories/x/cover/cover', content: { create: { type: 'paragraph', content: { text: 'A complete story.' }, position: 0 } } },
    });
    const published = await request(app.getHttpServer()).post(`/api/v1/stories/${story.id}/publish`).set(auth(author.token)).send({}).expect(200);
    expect(published.body.story.status).toBe(StoryStatus.PUBLISHED);
    const slug = published.body.story.slug;
    await request(app.getHttpServer()).get(`/api/v1/stories/${slug}`).expect(200);
    const reader = await user('storyreader');
    await request(app.getHttpServer()).post(`/api/v1/stories/${story.id}/like`).set(auth(reader.token)).send({}).expect(200);
    await request(app.getHttpServer()).post(`/api/v1/stories/${story.id}/bookmark`).set(auth(reader.token)).send({}).expect(200);
    const comment = await request(app.getHttpServer()).post(`/api/v1/stories/${story.id}/comments`).set(auth(reader.token)).send({ content: 'Great read.' }).expect(201);
    expect(comment.body.comment.content).toBe('Great read.');
    await request(app.getHttpServer()).get(`/api/v1/stories/${story.id}/comments`).expect(200);
  });
});
