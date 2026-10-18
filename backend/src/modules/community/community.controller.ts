import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CommunityService } from './community.service';
import { CreateCommentDto, CreateDiscussionDto, ListDiscussionsQueryDto, ListLeaderboardQueryDto } from './dto/community.dto';

@Controller({ path: 'community', version: '1' })
@UseGuards(CsrfOriginGuard)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('snapshot') snapshot() { return this.community.snapshot(); }
  @Get('leaderboard') leaderboard(@Query() query: ListLeaderboardQueryDto) { return this.community.leaderboard(query); }
  @Get('challenges') challenges() { return this.community.listChallenges(); }
  @Get('challenges/:id') challenge(@Param('id') id: string) { return this.community.getChallenge(id); }
  @Get('discussions') discussions(@Query() query: ListDiscussionsQueryDto) { return this.community.listDiscussions(query); }
  @Get('discussions/:slug') discussion(@Param('slug') slug: string) { return this.community.getDiscussion(slug); }

  @Post('discussions')
  @UseGuards(AuthGuard)
  createDiscussion(@Req() request: AuthenticatedRequest, @Body() dto: CreateDiscussionDto) { return this.community.createDiscussion(request.user.sub, dto); }

  @Post('discussions/:id/views')
  @HttpCode(HttpStatus.OK)
  view(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.recordView(id, request.ip, request.headers['user-agent']); }

  @Post('discussions/:id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  like(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.like(request.user.sub, id); }

  @Delete('discussions/:id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unlike(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.unlike(request.user.sub, id); }

  @Post('discussions/:id/comments')
  @UseGuards(AuthGuard)
  comment(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: CreateCommentDto) { return this.community.createComment(request.user.sub, id, dto); }
}
