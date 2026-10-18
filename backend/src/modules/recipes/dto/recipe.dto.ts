import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
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
import {
  CloudinaryResourceType,
  RecipeMediaKind,
  RecipeStatus,
  VoteType,
  difficulty,
  diet,
} from '@prisma/client';

const nullableTrim = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const upperEnum = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class CreateRecipeDraftDto {
  @IsOptional()
  @IsUUID()
  clientDraftId?: string;

  @IsOptional()
  @IsString()
  @Length(3, 90)
  name?: string;
}

export class RecipeMediaDto {
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
  @IsEnum(RecipeMediaKind)
  kind!: RecipeMediaKind;

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

export class RecipeIngredientDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(240)
  detail?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  image?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  link?: string | null;
}

export class RecipeEquipmentDto extends RecipeIngredientDto {}

export class RecipeStepDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(2000)
  detail?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  timeReq?: number | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  videoUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  image?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  link?: string | null;
}

export class RecipeFaqDto {
  @IsString()
  @Length(5, 180)
  question!: string;

  @IsString()
  @Length(10, 1000)
  answer!: string;
}

export class UpdateRecipeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion?: number;

  @IsOptional()
  @IsString()
  @Length(3, 90)
  name?: string;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(1200)
  about?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  mainImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9_./-]+$/)
  mainImagePublicId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsUrl({ require_protocol: true }, { each: true })
  moreImages?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  totalTimeReq?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  yield?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5000)
  calories?: number | null;

  @IsOptional()
  @IsEnum(diet)
  diet?: diet | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  cuisine?: string;

  @IsOptional()
  @IsEnum(difficulty)
  difficulty?: difficulty | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(1500)
  tipsAndTricks?: string | null;

  @IsOptional()
  @Transform(nullableTrim)
  @IsString()
  @MaxLength(1500)
  storingFreezing?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => RecipeEquipmentDto)
  equipments?: RecipeEquipmentDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients?: RecipeIngredientDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(60)
  @ValidateNested({ each: true })
  @Type(() => RecipeStepDto)
  steps?: RecipeStepDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RecipeFaqDto)
  faqs?: RecipeFaqDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => RecipeMediaDto)
  media?: RecipeMediaDto[];
}

export class ListOwnedRecipesQueryDto {
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
  @IsEnum(RecipeStatus)
  status?: RecipeStatus;
}

export class ListRecipesQueryDto {
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
  @MaxLength(30)
  tag?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  cuisine?: string;

  @IsOptional()
  @IsEnum(diet)
  diet?: diet;

  @IsOptional()
  @IsEnum(difficulty)
  difficulty?: difficulty;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsString()
  sortBy: 'latest' | 'popular' | 'rating' = 'latest';
}

export class RecipeRatingDto {
  @Type(() => Number)
  @IsNumber()
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;
}

export class CreateRecipeReviewDto extends RecipeRatingDto {
  @IsString()
  @Length(3, 1000)
  text!: string;
}

export class ReplyToRecipeReviewDto {
  @IsString()
  @Length(3, 1000)
  reply!: string;
}

export class ListRecipeReviewsQueryDto {
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
  limit = 10;

  @IsOptional()
  @IsIn(['newest', 'highest', 'lowest', 'helpful'])
  sort: 'newest' | 'highest' | 'lowest' | 'helpful' = 'newest';
}

export class CreateRecipeCommentDto {
  @Transform(nullableTrim)
  @IsString()
  @Length(1, 2000)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateRecipeCommentDto {
  @Transform(nullableTrim)
  @IsString()
  @Length(1, 2000)
  content!: string;
}

export class ListRecipeCommentsQueryDto {
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
  limit = 10;

  @IsOptional()
  @IsIn(['newest', 'oldest'])
  sort: 'newest' | 'oldest' = 'newest';
}

export class RecipeReviewVoteDto {
  @Transform(upperEnum)
  @IsEnum(VoteType)
  type!: VoteType;
}

export class RecordRecipeViewDto {}

export class RecipeIdParamDto {
  @IsUUID()
  id!: string;
}
