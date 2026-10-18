import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { AppConfig } from './config/env.validation';

export function configureApp(app: INestApplication, config: ConfigService<AppConfig, true>) {
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });
  app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: config.get('API_VERSION', { infer: true }),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
}
