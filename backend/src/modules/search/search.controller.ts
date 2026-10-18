import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { SearchAbuseService } from './search-abuse.service';
import { SearchQueryDto, SearchSuggestionsQueryDto } from './dto/search.dto';
import { SearchService } from './search.service';

@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(
    private readonly search: SearchService,
    private readonly abuse: SearchAbuseService,
  ) {}

  @Get()
  async query(@Query() query: SearchQueryDto, @Req() request: Request) {
    await this.abuse.check(request.ip, 'query');
    return this.search.search(query);
  }

  @Get('suggestions')
  async suggestions(@Query() query: SearchSuggestionsQueryDto, @Req() request: Request) {
    await this.abuse.check(request.ip, 'suggestion');
    return this.search.suggestions(query);
  }
}
