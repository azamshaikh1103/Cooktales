import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MessageEvent } from '@nestjs/common';
import type Redis from 'ioredis';
import { Observable, Subject } from 'rxjs';
import type { AppConfig } from '../../config/env.validation';
import { RedisService } from '../../redis/redis.service';

type NotificationRealtimeEvent = {
  recipientId: string;
  event: 'notification.created' | 'notification.read' | 'notification.read-all';
  data: Record<string, unknown>;
};

const CHANNEL = 'cooktale:notifications:realtime:v1';

@Injectable()
export class NotificationRealtimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationRealtimeService.name);
  private readonly streams = new Map<string, Subject<MessageEvent>>();
  private subscriber?: Redis;

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    if (!this.isEnabled() || this.config.get('APP_MODE', { infer: true }) !== 'api') return;

    this.subscriber = this.redis.getClient().duplicate();
    this.subscriber.on('message', (channel, message) => {
      if (channel !== CHANNEL) return;
      this.forward(message);
    });
    await this.subscriber.subscribe(CHANNEL);
    this.logger.log('Notification SSE relay started');
  }

  async publish(event: NotificationRealtimeEvent) {
    if (!this.isEnabled()) return;
    await this.redis.getClient().publish(CHANNEL, JSON.stringify(event));
  }

  stream(userId: string, unreadCount: number) {
    return new Observable<MessageEvent>((subscriber) => {
      let subject = this.streams.get(userId);
      if (!subject) {
        subject = new Subject<MessageEvent>();
        this.streams.set(userId, subject);
      }

      if (subject.observed && this.connectionCount(subject) >= this.maxConnections()) {
        subscriber.next({
          type: 'notification.connection-limit',
          data: { message: 'Too many notification connections.' },
        });
        subscriber.complete();
        return undefined;
      }

      const streamSubscription = subject.subscribe(subscriber);
      subscriber.next({ type: 'notification.ready', data: { unreadCount } });
      const timeout = setTimeout(
        () => subscriber.complete(),
        this.config.get('NOTIFICATION_SSE_MAX_CONNECTION_SECONDS', { infer: true }) * 1000,
      );

      return () => {
        clearTimeout(timeout);
        streamSubscription.unsubscribe();
        if (subject && !subject.observed) this.streams.delete(userId);
      };
    });
  }

  async onModuleDestroy() {
    if (this.subscriber) await this.subscriber.quit();
  }

  private forward(message: string) {
    try {
      const parsed = JSON.parse(message) as NotificationRealtimeEvent;
      if (!parsed.recipientId || !parsed.event || !parsed.data) return;
      this.streams.get(parsed.recipientId)?.next({ type: parsed.event, data: parsed.data });
    } catch {
      this.logger.warn('Ignored malformed notification realtime event');
    }
  }

  private isEnabled() {
    return this.config.get('NOTIFICATION_REALTIME_ENABLED', { infer: true });
  }

  private maxConnections() {
    return this.config.get('NOTIFICATION_SSE_MAX_CONNECTIONS_PER_USER', { infer: true });
  }

  private connectionCount(subject: Subject<MessageEvent>) {
    const observers = (subject as Subject<MessageEvent> & { observers?: unknown[] }).observers;
    return observers?.length || 0;
  }
}
