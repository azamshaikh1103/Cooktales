import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, Length, Max, Min } from 'class-validator';

export class ListNotificationsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class CreatePushSubscriptionDto {
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @Length(1, 2_048)
  endpoint!: string;

  @IsString()
  @Length(1, 512)
  p256dh!: string;

  @IsString()
  @Length(1, 512)
  auth!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expirationTime?: number | null;
}

export class DeletePushSubscriptionDto {
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @Length(1, 2_048)
  endpoint!: string;
}
