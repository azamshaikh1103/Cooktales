import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CommunityService } from './community.service';
import { addVerifiedBadge } from '../../common/verified-badge';
import { CreateCommentDto, CreateDiscussionDto, ListDiscussionsQueryDto, ListLeaderboardQueryDto } from './dto/community.dto';

@Controller({ path: 'community', version: '1' })
@UseGuards(CsrfOriginGuard)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('snapshot') snapshot() { return this.community.snapshot().then(addVerifiedBadge); }
  @Get('leaderboard') leaderboard(@Query() query: ListLeaderboardQueryDto) { return this.community.leaderboard(query).then(addVerifiedBadge); }
  @Get('challenges') challenges() { return this.community.listChallenges(); }
  @Get('challenges/:id') challenge(@Param('id') id: string) { return this.community.getChallenge(id).then(addVerifiedBadge); }
  @Get('discussions') discussions(@Query() query: ListDiscussionsQueryDto) { return this.community.listDiscussions(query).then(addVerifiedBadge); }
  @Get('discussions/:slug') discussion(@Param('slug') slug: string) { return this.community.getDiscussion(slug).then(addVerifiedBadge); }

  @Post('discussions')
  @UseGuards(AuthGuard)
  createDiscussion(@Req() request: AuthenticatedRequest, @Body() dto: CreateDiscussionDto) { return this.community.createDiscussion(request.user.sub, dto).then(addVerifiedBadge); }

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

  /** The signed-in reader's own vote state for a thread (pages are cached and anonymous). */
  @Get('discussions/:id/like')
  @UseGuards(AuthGuard)
  likeState(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.discussionLikeState(request.user.sub, id); }

  @Post('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  likeComment(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.likeComment(request.user.sub, id); }

  @Delete('comments/:id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unlikeComment(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.unlikeComment(request.user.sub, id); }

  @Delete('discussions/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deleteDiscussion(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.deleteDiscussion({ id: request.user.sub, role: request.user.role }, id); }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deleteComment(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.community.deleteComment({ id: request.user.sub, role: request.user.role }, id); }

  @Post('discussions/:id/comments')
  @UseGuards(AuthGuard)
  comment(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: CreateCommentDto) { return this.community.createComment(request.user.sub, id, dto).then(addVerifiedBadge); }
}
