import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CloudinaryResourceType, StoryMediaKind, StoryStatus } from '@prisma/client';

const nullableTrim = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined || typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed || null;
};

const upperEnum = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class CreateStoryDraftDto {
  @IsOptional()
  @IsUUID()
  clientDraftId?: string;

  @IsOptional()
  @IsString()
  @Length(3, 140)
  title?: string;
}

export class StoryBlockDto {
  @IsString()
  @Matches(/^(paragraph|headline|quote|image|video|link|codeblock|divider)$/)
  type!: string;

  @IsObject()
  content!: Record<string, unknown>;
}

export class StoryMediaDto {
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  publicId!: string;

  @IsUrl({ require_protocol: true })
  url!: string;

  @Transform(upperEnum)
  @IsEnum(CloudinaryResourceType)
  resourceType: CloudinaryResourceType = CloudinaryResourceType.IMAGE;

  @Transform(upperEnum)
  @IsEnum(StoryMediaKind)
  kind!: StoryMediaKind;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  position?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  width?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  height?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bytes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  format?: string;
}

export class UpdateStoryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion?: number;

  @IsOptional()
  @IsString()
  @Length(3, 140)
  title?: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(600)
  shortDesc?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  coverImage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  coverImagePublicId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => StoryBlockDto)
  content?: StoryBlockDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => StoryMediaDto)
  media?: StoryMediaDto[];
}

export class ListStoriesQueryDto {
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
  limit = 12;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tag?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Matches(/^(latest|popular)$/)
  sortBy?: 'latest' | 'popular';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ids?: string;
}

export class ListOwnedStoriesQueryDto {
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
  limit = 12;

  @IsOptional()
  @IsEnum(StoryStatus)
  status?: StoryStatus;
}

export class CreateStoryCommentDto {
  @IsString()
  @Length(1, 2000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
