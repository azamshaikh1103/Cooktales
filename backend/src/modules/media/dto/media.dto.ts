import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum MediaUploadContext {
  USER_AVATAR = 'USER_AVATAR',
  USER_BANNER = 'USER_BANNER',
  RECIPE_MAIN = 'RECIPE_MAIN',
  RECIPE_GALLERY = 'RECIPE_GALLERY',
  RECIPE_VIDEO = 'RECIPE_VIDEO',
  STORY_COVER = 'STORY_COVER',
  STORY_CONTENT = 'STORY_CONTENT',
  THREAD_MEDIA = 'THREAD_MEDIA',
  TEMP = 'TEMP',
}

export enum MediaResourceType {
  IMAGE = 'image',
  VIDEO = 'video',
  RAW = 'raw',
  AUTO = 'auto',
}

export class CreateSignedUploadDto {
  @IsEnum(MediaUploadContext)
  context!: MediaUploadContext;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]+$/)
  entityId?: string;

  @IsOptional()
  @IsEnum(MediaResourceType)
  resourceType?: MediaResourceType;
}

export class DeleteMediaAssetDto {
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  publicId!: string;

  @IsOptional()
  @IsIn(['image', 'video', 'raw'])
  resourceType?: Exclude<MediaResourceType, MediaResourceType.AUTO>;
}

export class ConfirmMediaUploadDto {
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  publicId!: string;

  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url!: string;

  @IsEnum(MediaResourceType)
  resourceType!: Exclude<MediaResourceType, MediaResourceType.AUTO>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50000)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  bytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  format?: string;
}
