import { Body, Controller, Delete, Get, HttpCode, HttpStatus, MessageEvent, Param, Patch, Post, Query, Req, Sse, UseGuards } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { CsrfOriginGuard } from '../auth/security/csrf-origin.guard';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreatePushSubscriptionDto, DeletePushSubscriptionDto, ListNotificationsQueryDto } from './dto/notification.dto';
import { NotificationPushService } from './notification-push.service';
import { NotificationRealtimeService } from './notification-realtime.service';
import { NotificationsService } from './notifications.service';

@Controller({ path: 'notifications', version: '1' })
@UseGuards(AuthGuard, CsrfOriginGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: NotificationPushService,
    private readonly realtime: NotificationRealtimeService,
  ) {}

  @Get()
  list(@Req() request: AuthenticatedRequest, @Query() query: ListNotificationsQueryDto) {
    return this.notifications.list(request.user.sub, query);
  }

  @Get('unread-count')
  unreadCount(@Req() request: AuthenticatedRequest) {
    return this.notifications.unreadCount(request.user.sub);
  }

  @Sse('stream')
  async stream(@Req() request: AuthenticatedRequest): Promise<Observable<MessageEvent>> {
    const { unreadCount } = await this.notifications.unreadCount(request.user.sub);
    return this.realtime.stream(request.user.sub, unreadCount);
  }

  @Patch(':id/read')
  markRead(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.notifications.markRead(request.user.sub, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.notifications.markAllRead(request.user.sub);
  }

  @Get('push/config')
  pushConfig() {
    return this.push.getConfig();
  }

  @Post('push/subscriptions')
  @HttpCode(HttpStatus.OK)
  subscribePush(@Req() request: AuthenticatedRequest, @Body() dto: CreatePushSubscriptionDto) {
    return this.push.subscribe(request.user.sub, dto);
  }

  @Delete('push/subscriptions')
  @HttpCode(HttpStatus.OK)
  unsubscribePush(@Req() request: AuthenticatedRequest, @Body() dto: DeletePushSubscriptionDto) {
    return this.push.unsubscribe(request.user.sub, dto.endpoint);
  }
}
