import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import {
  CreateStoryCommentDto,
  CreateStoryDraftDto,
  ListOwnedStoriesQueryDto,
  ListStoriesQueryDto,
  UpdateStoryDto,
} from './dto/story.dto';
import { StoriesService } from './stories.service';

@Controller({ path: 'stories', version: '1' })
@UseGuards(CsrfOriginGuard)
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get()
  list(@Query() query: ListStoriesQueryDto) { return this.stories.list(query); }

  @Get('mine/list')
  @UseGuards(AuthGuard)
  listOwned(@Query() query: ListOwnedStoriesQueryDto, @Req() request: AuthenticatedRequest) {
    return this.stories.listOwned(request.user.sub, query);
  }

  @Get(':id/manage')
  @UseGuards(AuthGuard)
  getOwner(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.stories.getOwnerStory(request.user.sub, id);
  }

  @Get(':id/viewer')
  @UseGuards(AuthGuard)
  viewer(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.stories.viewerState(request.user.sub, id);
  }

  @Get(':id/comments')
  comments(@Param('id') id: string) { return this.stories.listComments(id); }

  @Get(':slug')
  getPublic(@Param('slug') slug: string) { return this.stories.getPublic(slug); }

  @Post('drafts')
  @UseGuards(AuthGuard)
  createDraft(@Req() request: AuthenticatedRequest, @Body() dto: CreateStoryDraftDto) {
    return this.stories.createDraft(request.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: UpdateStoryDto) {
    return this.stories.update(request.user.sub, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  publish(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.publish(request.user.sub, id); }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.softDelete(request.user.sub, id); }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  restore(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.restore(request.user.sub, id); }

  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  recordView(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.stories.recordView(id, request.ip, request.headers['user-agent']);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  like(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.like(request.user.sub, id); }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unlike(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.unlike(request.user.sub, id); }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  bookmark(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.bookmark(request.user.sub, id); }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unbookmark(@Param('id') id: string, @Req() request: AuthenticatedRequest) { return this.stories.unbookmark(request.user.sub, id); }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  comment(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: CreateStoryCommentDto) {
    return this.stories.createComment(request.user.sub, id, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string, @Req() request: AuthenticatedRequest) {
    return this.stories.deleteComment(request.user.sub, id, commentId);
  }
}
