import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { StoriesModule } from './modules/stories/stories.module';
import { CommunityModule } from './modules/community/community.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { NewsletterModule } from './modules/newsletter/newsletter.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { StudioModule } from './modules/studio/studio.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    ProfileModule,
    MediaModule,
    RecipesModule,
    StoriesModule,
    CommunityModule,
    SearchModule,
    NotificationsModule,
    NewsletterModule,
    OnboardingModule,
    StudioModule,
    PaymentsModule,
    ContactModule,
    HealthModule,
  ],
})
export class AppModule {}
