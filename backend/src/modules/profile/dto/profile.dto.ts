import { MeasurementSystem } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsStrongPassword,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  MinLength,
  IsInt,
  IsIn,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProfilePageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  limit = 12;
}

export class ProfileBookmarksQueryDto extends ProfilePageQueryDto {
  @IsOptional()
  @IsIn(['all', 'recipes', 'stories'])
  type: 'all' | 'recipes' | 'stories' = 'all';
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,20}$/)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  signature?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  mission?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  image?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  imagePublicId?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  bannerImage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  bannerImagePublicId?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsEnum(MeasurementSystem)
  measurementSystem?: MeasurementSystem;

  @IsOptional()
  @IsString()
  @Length(2, 12)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timezone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  dietaryPreferences?: string;

  @IsOptional()
  @IsObject()
  appSettings?: {
    autoplay?: boolean;
    screenAwake?: boolean;
  };
}

export class UpdateNotificationsDto {
  @IsOptional()
  @IsBoolean()
  in_app_follows?: boolean;

  @IsOptional()
  @IsBoolean()
  in_app_likes?: boolean;

  @IsOptional()
  @IsBoolean()
  in_app_comments?: boolean;

  @IsOptional()
  @IsBoolean()
  in_app_reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  in_app_system?: boolean;

  @IsOptional()
  @IsBoolean()
  email_digest?: boolean;

  @IsOptional()
  @IsBoolean()
  email_activity_digest?: boolean;

  @IsOptional()
  @IsBoolean()
  push_activity?: boolean;

  @IsOptional()
  @IsBoolean()
  email_followers?: boolean;

  @IsOptional()
  @IsBoolean()
  email_reviews?: boolean;

  @IsOptional()
  @IsBoolean()
  push_mentions?: boolean;

  @IsOptional()
  @IsBoolean()
  push_updates?: boolean;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
  })
  newPassword!: string;
}
