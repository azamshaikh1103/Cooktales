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

describe('Media API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: ConfigService<AppConfig, true>;

  const media = {
    createSignedUpload: jest.fn().mockResolvedValue({
      publicId: 'cooktale/users/media-user/avatar/file',
      signature: 'test-signature',
    }),
    deleteOwnAsset: jest.fn().mockResolvedValue({
      publicId: 'cooktale/users/media-user/avatar/file',
      result: 'ok',
    }),
    confirmUpload: jest.fn().mockResolvedValue({ confirmed: true }),
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
    await prisma.user.deleteMany({ where: { email: { endsWith: '@media.test' } } });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createUserAndToken() {
    const user = await prisma.user.create({
      data: {
        name: 'Media User',
        username: `media_${Date.now()}`,
        email: `media_${Date.now()}@media.test`,
        emailVerified: new Date(),
      },
    });
    const token = await jwt.signAsync(
      { sub: user.id, email: user.email, role: UserRole.USER },
      { secret: config.get('JWT_ACCESS_SECRET', { infer: true }), expiresIn: 900 },
    );
    return { user, token };
  }

  it('requires authentication for signing and deletion', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/media/sign-upload')
      .send({ context: 'USER_AVATAR' })
      .expect(401);
    await request(app.getHttpServer())
      .delete('/api/v1/media/asset')
      .send({ publicId: 'cooktale/users/user/avatar/file' })
      .expect(401);
  });

  it('passes only validated upload data and the authenticated user ID to the service', async () => {
    const { user, token } = await createUserAndToken();

    await request(app.getHttpServer())
      .post('/api/v1/media/sign-upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ context: 'USER_AVATAR', resourceType: 'image', role: 'ADMIN' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/media/sign-upload')
      .set('Authorization', `Bearer ${token}`)
      .send({ context: 'USER_AVATAR', resourceType: 'image' })
      .expect(200);

    expect(media.createSignedUpload).toHaveBeenCalledWith({
      userId: user.id,
      context: 'USER_AVATAR',
      entityId: undefined,
      resourceType: 'image',
    });
  });

  it('validates public IDs before requesting physical deletion', async () => {
    const { user, token } = await createUserAndToken();

    await request(app.getHttpServer())
      .delete('/api/v1/media/asset')
      .set('Authorization', `Bearer ${token}`)
      .send({ publicId: '../unsafe path' })
      .expect(400);

    const publicId = `cooktale/users/${user.id}/avatar/file`;
    await request(app.getHttpServer())
      .delete('/api/v1/media/asset')
      .set('Authorization', `Bearer ${token}`)
      .send({ publicId, resourceType: 'image' })
      .expect(200);

    expect(media.deleteOwnAsset).toHaveBeenCalledWith(user.id, {
      publicId,
      resourceType: 'image',
    });
  });

  it('validates and confirms an uploaded Cloudinary asset', async () => {
    const { user, token } = await createUserAndToken();
    const publicId = `cooktale/users/${user.id}/avatar/file`;
    await request(app.getHttpServer())
      .post('/api/v1/media/confirm-upload')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicId,
        url: 'https://res.cloudinary.com/test/image/upload/file.jpg',
        resourceType: 'image',
        width: 400,
        height: 400,
        bytes: 2048,
        unexpected: true,
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/media/confirm-upload')
      .set('Authorization', `Bearer ${token}`)
      .send({
        publicId,
        url: 'https://res.cloudinary.com/test/image/upload/file.jpg',
        resourceType: 'image',
      })
      .expect(200);
    expect(media.confirmUpload).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ publicId }),
    );
  });
});
