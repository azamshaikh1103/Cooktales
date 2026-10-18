import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class SearchQueryDto {
  @Transform(trim)
  @IsString()
  @Length(2, 80)
  q!: string;

  @IsOptional()
  @IsIn(['all', 'recipe', 'story', 'chef'])
  type: 'all' | 'recipe' | 'story' | 'chef' = 'all';

  @IsOptional()
  @IsIn(['relevance', 'latest', 'popular'])
  sort: 'relevance' | 'latest' | 'popular' = 'relevance';

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  cuisine?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  diet?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  difficulty?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  tag?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1_440)
  maxMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit = 12;
}

export class SearchSuggestionsQueryDto extends SearchQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit = 8;
}
