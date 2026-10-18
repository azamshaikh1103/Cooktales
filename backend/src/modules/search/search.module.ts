import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SearchAbuseService } from './search-abuse.service';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [AuthModule],
  controllers: [SearchController],
  providers: [SearchService, SearchAbuseService],
})
export class SearchModule {}
