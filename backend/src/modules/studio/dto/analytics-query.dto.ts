import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const ANALYTICS_CONTENT_TYPES = ['recipes', 'stories'] as const;

export class StudioAnalyticsQueryDto {
  @IsOptional()
  @IsIn(ANALYTICS_CONTENT_TYPES)
  type: (typeof ANALYTICS_CONTENT_TYPES)[number] = 'recipes';

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
