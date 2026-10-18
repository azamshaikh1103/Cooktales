import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class ListDiscussionsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 20;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(40) category?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) search?: string;
  @IsOptional() @Matches(/^(latest|popular)$/) sort: 'latest' | 'popular' = 'latest';
}

export class AttachmentDto {
  @Matches(/^(image|recipe|story)$/) type!: 'image' | 'recipe' | 'story';
  @IsString() @MaxLength(2048) id!: string;
  @IsOptional() @IsString() @MaxLength(255) @Matches(/^[a-zA-Z0-9_./-]+$/) publicId?: string;
}

export class CreateDiscussionDto {
  @Transform(trim) @IsString() @Length(5, 140) title!: string;
  @Transform(trim) @IsString() @Length(20, 12000) content!: string;
  @Transform(trim) @IsString() @Length(2, 40) category!: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttachmentDto) attachments?: AttachmentDto[];
}

export class CreateCommentDto {
  @Transform(trim) @IsString() @Length(1, 2000) content!: string;
  @IsOptional() @IsUUID() parentId?: string;
}

export class ListLeaderboardQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
}
