import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommunityAbuseService } from '../community/community-abuse.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, CommunityAbuseService],
})
export class ReportsModule {}
