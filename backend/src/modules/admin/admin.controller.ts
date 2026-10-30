import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { AdminGuard } from './security/admin.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminOperationsService } from './admin-operations.service';
import { AdminRecipesService } from './admin-recipes.service';
import { HideAdminRecipeDto, ListAdminRecipesQueryDto } from './dto/admin-recipes.dto';

@Controller({ path: 'admin', version: '1' })
@UseGuards(CsrfOriginGuard, AuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly operations: AdminOperationsService,
    private readonly recipes: AdminRecipesService,
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
}
