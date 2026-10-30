import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { AdminGuard } from './security/admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminOperationsService } from './admin-operations.service';
import { AdminRecipesService } from './admin-recipes.service';
import { HideAdminRecipeDto, ListAdminRecipesQueryDto } from './dto/admin-recipes.dto';
import { HideAdminStoryDto, ListAdminStoriesQueryDto } from './dto/admin-stories.dto';
import { AdminStoriesService } from './admin-stories.service';
import { AdminUserReasonDto, ListAdminUsersQueryDto } from './dto/admin-users.dto';
import { AdminUsersService } from './admin-users.service';

@Controller({ path: 'admin', version: '1' })
@UseGuards(CsrfOriginGuard, AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly operations: AdminOperationsService,
    private readonly recipes: AdminRecipesService,
    private readonly stories: AdminStoriesService,
    private readonly users: AdminUsersService,
  ) {}

  @Get('analytics/overview')
  overview() {
    return this.analytics.overview();
  }

  @Get('operations')
  operationsOverview() {
    return this.operations.overview();
  }

  @Get('recipes')
  listRecipes(@Query() query: ListAdminRecipesQueryDto) {
    return this.recipes.list(query);
  }

  @Get('recipes/:id')
  getRecipe(@Param('id') id: string) {
    return this.recipes.get(id);
  }

  @Post('recipes/:id/hide')
  @HttpCode(HttpStatus.OK)
  hideRecipe(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: HideAdminRecipeDto) {
    return this.recipes.hide(request.user.sub, id, dto);
  }

  @Post('recipes/:id/restore')
  @HttpCode(HttpStatus.OK)
  restoreRecipe(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.recipes.restore(request.user.sub, id);
  }

  @Get('stories')
  listStories(@Query() query: ListAdminStoriesQueryDto) {
    return this.stories.list(query);
  }

  @Post('stories/:id/hide')
  @HttpCode(HttpStatus.OK)
  hideStory(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: HideAdminStoryDto) {
    return this.stories.hide(request.user.sub, id, dto);
  }

  @Post('stories/:id/restore')
  @HttpCode(HttpStatus.OK)
  restoreStory(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.stories.restore(request.user.sub, id);
  }

  @Get('users')
  listUsers(@Query() query: ListAdminUsersQueryDto) {
    return this.users.list(query);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.users.get(id);
  }

  @Post('users/:id/warn')
  @HttpCode(HttpStatus.OK)
  warnUser(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: AdminUserReasonDto) {
    return this.users.warn(request.user.sub, id, dto);
  }

  @Post('users/:id/ban')
  @HttpCode(HttpStatus.OK)
  banUser(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: AdminUserReasonDto) {
    return this.users.ban(request.user.sub, id, dto);
  }

  @Post('users/:id/unban')
  @HttpCode(HttpStatus.OK)
  unbanUser(@Param('id') id: string, @Req() request: AuthenticatedRequest, @Body() dto: AdminUserReasonDto) {
    return this.users.unban(request.user.sub, id, dto);
  }
}
