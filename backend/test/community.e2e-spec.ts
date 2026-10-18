import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AppConfig } from '../src/config/env.validation';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/database/prisma.service';
import { EmailQueueService } from '../src/modules/auth/mailer/email-queue.service';
import { TurnstileService } from '../src/modules/auth/security/turnstile.service';
import { MediaService } from '../src/modules/media/media.service';

describe('Community API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;
  const media = { assertAttachableUploads: jest.fn().mockResolvedValue(undefined), relocateThreadUploads: jest.fn().mockResolvedValue(new Map()), markAttached: jest.fn().mockResolvedValue(undefined), assertCloudinaryUrl: jest.fn() };

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
    await prisma.user.deleteMany({ where: { email: { endsWith: '@community.test' } } });
    jest.clearAllMocks();
  });

  afterAll(async () => app.close());

  async function user(label: string, points = 0) {
    const created = await prisma.user.create({ data: { name: label, username: `${label}_${Date.now()}`, email: `${label}_${Date.now()}@community.test`, emailVerified: new Date(), points } });
    const token = await jwt.signAsync({ sub: created.id, email: created.email, role: UserRole.USER }, { secret: config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn: 900 });
    return { created, token };
  }

  const origin = { Origin: 'http://localhost:3001' };
  const auth = (token: string) => ({ Authorization: `Bearer ${token}`, ...origin });

  it('creates and returns a public discussion without exposing private account data', async () => {
    const author = await user('communityauthor', 30);
    const created = await request(app.getHttpServer()).post('/api/v1/community/discussions').set(auth(author.token)).send({ title: 'How do I keep sourdough fresh?', content: 'I am looking for a reliable way to keep sourdough fresh after baking.', category: 'Baking Help' }).expect(201);
    expect(created.body.discussion.slug).toContain('how-do-i-keep-sourdough-fresh');
    const detail = await request(app.getHttpServer()).get(`/api/v1/community/discussions/${created.body.discussion.slug}`).expect(200);
    expect(detail.body.discussion.author).not.toHaveProperty('email');
    expect(detail.body.discussion.author).not.toHaveProperty('password');
    await request(app.getHttpServer()).get('/api/v1/community/discussions?category=Baking%20Help&sort=latest').expect(200);
  });

  it('moves confirmed discussion images into the final thread folder before publishing the post', async () => {
    const author = await user('communitymedia');
    const originalPublicId = 'cooktale/tmp/user/example-image';
    const finalPublicId = 'cooktale/community/threads/thread-id/example-image';
    const finalUrl = 'https://res.cloudinary.com/test/image/upload/f_auto,q_auto/cooktale/community/threads/thread-id/example-image.jpg';
    media.relocateThreadUploads.mockResolvedValueOnce(new Map([[originalPublicId, { publicId: finalPublicId, url: finalUrl }]]));

    const created = await request(app.getHttpServer()).post('/api/v1/community/discussions').set(auth(author.token)).send({
      title: 'A discussion with a real image attachment',
      content: 'This discussion includes a confirmed image attachment and enough detail to pass validation.',
      category: 'Showcase',
      attachments: [{ type: 'image', id: 'https://res.cloudinary.com/test/image/upload/example-image.jpg', publicId: originalPublicId }],
    }).expect(201);

    expect(media.assertAttachableUploads).toHaveBeenCalledWith(author.created.id, [originalPublicId]);
    expect(media.relocateThreadUploads).toHaveBeenCalledWith(author.created.id, created.body.discussion.id, [originalPublicId]);
    const stored = await prisma.discussion.findUniqueOrThrow({ where: { id: created.body.discussion.id } });
    expect(stored.content).toContain(finalUrl);
  });

  it('requires sign-in for writing, enforces comment nesting, and returns interaction state', async () => {
    const author = await user('threadauthor');
    const reader = await user('threadreader');
    const discussion = await prisma.discussion.create({ data: { title: 'A useful discussion', content: 'This is enough content for discussion testing.', category: 'General', slug: `useful-${Date.now()}`, authorId: author.created.id } });
    await request(app.getHttpServer()).post(`/api/v1/community/discussions/${discussion.id}/comments`).set(origin).send({ content: 'A useful answer.' }).expect(401);
    const comment = await request(app.getHttpServer()).post(`/api/v1/community/discussions/${discussion.id}/comments`).set(auth(reader.token)).send({ content: 'A useful answer.' }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/community/discussions/${discussion.id}/comments`).set(auth(reader.token)).send({ content: 'A reply', parentId: comment.body.comment.id }).expect(201);
    const reply = await prisma.comment.findFirstOrThrow({ where: { discussionId: discussion.id, parentId: comment.body.comment.id } });
    await request(app.getHttpServer()).post(`/api/v1/community/discussions/${discussion.id}/comments`).set(auth(reader.token)).send({ content: 'Third level is not supported', parentId: reply.id }).expect(400);
    const liked = await request(app.getHttpServer()).post(`/api/v1/community/discussions/${discussion.id}/like`).set(auth(reader.token)).send({}).expect(200);
    expect(liked.body).toEqual({ likes: 1, liked: true });
    const unliked = await request(app.getHttpServer()).delete(`/api/v1/community/discussions/${discussion.id}/like`).set(auth(reader.token)).expect(200);
    expect(unliked.body).toEqual({ likes: 0, liked: false });
  });

  it('returns a real snapshot and rejects invalid creation input', async () => {
    const chef = await user('leader', 100);
    await prisma.discussion.create({ data: { title: 'A real snapshot discussion', content: 'This record makes the public snapshot meaningful.', category: 'Showcase', slug: `snapshot-${Date.now()}`, authorId: chef.created.id } });
    const snapshot = await request(app.getHttpServer()).get('/api/v1/community/snapshot').expect(200);
    expect(snapshot.body.totalChefs).toBeGreaterThan(0);
    expect(snapshot.body.topChefs[0].email).toBeUndefined();
    const challenge = await prisma.challenge.create({ data: { title: 'Test seasonal challenge', description: 'A real challenge record for API coverage.', startDate: new Date(), endDate: new Date(Date.now() + 86_400_000), isActive: true } });
    const challenges = await request(app.getHttpServer()).get('/api/v1/community/challenges').expect(200);
    expect(challenges.body.challenges).toEqual(expect.arrayContaining([expect.objectContaining({ id: challenge.id })]));
    await request(app.getHttpServer()).get(`/api/v1/community/challenges/${challenge.id}`).expect(200);
    await request(app.getHttpServer()).post('/api/v1/community/discussions').set(auth(chef.token)).send({ title: 'bad', content: 'short', category: '' }).expect(400);
  });
});
