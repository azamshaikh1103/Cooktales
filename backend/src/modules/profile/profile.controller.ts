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
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import {
  ChangePasswordDto,
  ProfileBookmarksQueryDto,
  ProfilePageQueryDto,
  UpdateNotificationsDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/profile.dto';
import { ProfileService } from './profile.service';

@Controller({
  path: '',
  version: '1',
})
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profiles/:handle')
  getPublicProfile(@Param('handle') handle: string) {
    return this.profileService.getPublicProfile(handle);
  }

  @Get('profiles/:handle/recipes')
  getProfileRecipes(@Param('handle') handle: string, @Query() query: ProfilePageQueryDto) {
    return this.profileService.getProfileRecipes(handle, query);
  }

  @Get('profiles/:handle/stories')
  getProfileStories(@Param('handle') handle: string, @Query() query: ProfilePageQueryDto) {
    return this.profileService.getProfileStories(handle, query);
  }

  @Get('profiles/:handle/followers')
  getFollowers(@Param('handle') handle: string, @Query() query: ProfilePageQueryDto) {
    return this.profileService.getFollowers(handle, query);
  }

  @Get('profiles/:handle/following')
  getFollowing(@Param('handle') handle: string, @Query() query: ProfilePageQueryDto) {
    return this.profileService.getFollowing(handle, query);
  }

  @Get('profiles/:handle/viewer')
  @UseGuards(AuthGuard)
  getViewerProfileContext(@Param('handle') handle: string, @Req() request: AuthenticatedRequest) {
    return this.profileService.getViewerProfileContext(handle, request.user.sub);
  }

  @Get('profile/me')
  @UseGuards(AuthGuard)
  getMe(@Req() request: AuthenticatedRequest) {
    return this.profileService.getMe(request.user.sub);
  }

  @Get('profile/bookmarks')
  @UseGuards(AuthGuard)
  getBookmarks(@Query() query: ProfileBookmarksQueryDto, @Req() request: AuthenticatedRequest) {
    return this.profileService.getMyBookmarks(request.user.sub, query);
  }

  @Get('profile/username-availability')
  @UseGuards(AuthGuard)
  checkUsernameAvailability(
    @Query('username') username: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.profileService.checkUsernameAvailability(request.user.sub, username);
  }

  @Patch('profile/me')
  @UseGuards(AuthGuard)
  updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateMe(request.user.sub, dto);
  }

  @Patch('profile/preferences')
  @UseGuards(AuthGuard)
  updatePreferences(@Req() request: AuthenticatedRequest, @Body() dto: UpdatePreferencesDto) {
    return this.profileService.updatePreferences(request.user.sub, dto);
  }

  @Patch('profile/notifications')
  @UseGuards(AuthGuard)
  updateNotifications(@Req() request: AuthenticatedRequest, @Body() dto: UpdateNotificationsDto) {
    return this.profileService.updateNotifications(request.user.sub, dto);
  }

  @Post('profiles/:userId/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  followUser(@Param('userId') userId: string, @Req() request: AuthenticatedRequest) {
    return this.profileService.followUser(request.user.sub, userId);
  }

  @Delete('profiles/:userId/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  unfollowUser(@Param('userId') userId: string, @Req() request: AuthenticatedRequest) {
    return this.profileService.unfollowUser(request.user.sub, userId);
  }

  @Post('profile/change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(request.user.sub, dto);
  }

  @Get('profile/export')
  @UseGuards(AuthGuard)
  exportData(@Req() request: AuthenticatedRequest) {
    return this.profileService.exportData(request.user.sub);
  }

  @Delete('profile/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  deactivateMe(@Req() request: AuthenticatedRequest) {
    return this.profileService.deactivateMe(request.user.sub);
  }
}
