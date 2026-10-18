import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import {
  CreateRecipeDraftDto,
  CreateRecipeCommentDto,
  CreateRecipeReviewDto,
  ListRecipeReviewsQueryDto,
  ListRecipeCommentsQueryDto,
  ListRecipesQueryDto,
  ListOwnedRecipesQueryDto,
  RecipeRatingDto,
  RecordRecipeViewDto,
  RecipeReviewVoteDto,
  ReplyToRecipeReviewDto,
  UpdateRecipeDto,
  UpdateRecipeCommentDto,
} from './dto/recipe.dto';
import { RecipesService } from './recipes.service';
import { RecipeViewService } from './recipe-view.service';

@Controller({
  path: 'recipes',
  version: '1',
})
@UseGuards(CsrfOriginGuard)
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly recipeViews: RecipeViewService,
  ) {}

  @Get()
  list(@Query() query: ListRecipesQueryDto) {
    return this.recipesService.list(query);
  }

  @Get(':id/viewer')
  @UseGuards(AuthGuard)
  viewerState(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.viewerState(request.user.sub, id);
  }

  @Get(':id/manage')
  @UseGuards(AuthGuard)
  getOwnerRecipe(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.getOwnerRecipe(request.user.sub, id);
  }

  @Get('mine/list')
  @UseGuards(AuthGuard)
  listOwned(@Query() query: ListOwnedRecipesQueryDto, @Req() request: AuthenticatedRequest) {
    return this.recipesService.listOwned(request.user.sub, query);
  }

  @Get(':slug/cook')
  getCookMode(@Param('slug') slug: string) {
    return this.recipesService.getCookMode(slug);
  }

  @Get(':slug/reviews')
  listReviews(@Param('slug') slug: string, @Query() query: ListRecipeReviewsQueryDto) {
    return this.recipesService.listReviews(slug, query);
  }

  @Get(':slug/comments')
  listComments(@Param('slug') slug: string, @Query() query: ListRecipeCommentsQueryDto) {
    return this.recipesService.listComments(slug, query);
  }

  @Get(':id/comments/viewer')
  @UseGuards(AuthGuard)
  commentViewerState(
    @Param('id') id: string,
    @Query('ids') ids: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    const commentIds = (ids || '')
      .split(',')
      .filter((value) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value,
        ),
      )
      .slice(0, 100);
    return this.recipesService.commentViewerState(request.user.sub, id, commentIds);
  }

  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.recipesService.getPublic(slug);
  }

  @Post('drafts')
  @UseGuards(AuthGuard)
  createDraft(@Req() request: AuthenticatedRequest, @Body() dto: CreateRecipeDraftDto) {
    return this.recipesService.createDraft(request.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(request.user.sub, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  publish(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.publish(request.user.sub, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  softDelete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.softDelete(request.user.sub, id);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  restore(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.restore(request.user.sub, id);
  }

  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  async recordView(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() _dto: RecordRecipeViewDto,
  ) {
    await this.recipesService.assertPublished(id);
    return this.recipeViews.record(id, request.ip, request.headers['user-agent']);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  like(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.like(request.user.sub, id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unlike(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.unlike(request.user.sub, id);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  bookmark(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.bookmark(request.user.sub, id);
  }

  @Delete(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unbookmark(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipesService.unbookmark(request.user.sub, id);
  }

  @Post(':id/ratings')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  rate(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: RecipeRatingDto,
  ) {
    return this.recipesService.rate(request.user.sub, id, dto);
  }

  @Post(':id/reviews')
  @UseGuards(AuthGuard)
  createReview(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateRecipeReviewDto,
  ) {
    return this.recipesService.createReview(request.user.sub, id, dto);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard)
  createComment(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateRecipeCommentDto,
  ) {
    return this.recipesService.createComment(request.user.sub, id, dto);
  }

  @Patch(':id/comments/:commentId')
  @UseGuards(AuthGuard)
  updateComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateRecipeCommentDto,
  ) {
    return this.recipesService.updateComment(request.user.sub, id, commentId, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.recipesService.deleteComment(request.user.sub, id, commentId);
  }

  @Post(':id/comments/:commentId/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  likeComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.recipesService.likeComment(request.user.sub, id, commentId);
  }

  @Delete(':id/comments/:commentId/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unlikeComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.recipesService.unlikeComment(request.user.sub, id, commentId);
  }

  @Patch(':id/reviews/:reviewId')
  @UseGuards(AuthGuard)
  updateReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateRecipeReviewDto,
  ) {
    return this.recipesService.updateReview(request.user.sub, id, reviewId, dto);
  }

  @Delete(':id/reviews/:reviewId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deleteReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.recipesService.deleteReview(request.user.sub, id, reviewId);
  }

  @Post(':id/reviews/:reviewId/vote')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  voteOnReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: RecipeReviewVoteDto,
  ) {
    return this.recipesService.voteOnReview(request.user.sub, id, reviewId, dto);
  }

  @Patch(':id/reviews/:reviewId/reply')
  @UseGuards(AuthGuard)
  replyToReview(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: ReplyToRecipeReviewDto,
  ) {
    return this.recipesService.replyToReview(request.user.sub, id, reviewId, dto);
  }

  @Delete(':id/reviews/:reviewId/reply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deleteReviewReply(
    @Param('id') id: string,
    @Param('reviewId') reviewId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.recipesService.deleteReviewReply(request.user.sub, id, reviewId);
  }
}
