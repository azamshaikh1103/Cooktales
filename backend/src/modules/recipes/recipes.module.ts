import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeAbuseService } from './recipe-abuse.service';
import { RecipeViewService } from './recipe-view.service';

@Module({
  imports: [AuthModule, MediaModule, NotificationsModule],
  controllers: [RecipesController],
  providers: [RecipesService, RecipeAbuseService, RecipeViewService],
  exports: [RecipesService],
})
export class RecipesModule {}
