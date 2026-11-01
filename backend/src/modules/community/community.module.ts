import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { PointsModule } from '../points/points.module';
import { CommunityAbuseService } from './community-abuse.service';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [AuthModule, MediaModule, PointsModule],
  controllers: [CommunityController],
  providers: [CommunityService, CommunityAbuseService],
  exports: [CommunityService],
})
export class CommunityModule {}
