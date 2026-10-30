import { Transform, Type } from 'class-transformer';
import { AccountStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export enum AdminUserKind {
  USER = 'USER',
  CREATOR = 'CREATOR',
}

export class ListAdminUsersQueryDto {
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @IsOptional()
  @IsEnum(AdminUserKind)
  kind?: AdminUserKind;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 25;
}

export class AdminUserReasonDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @Length(3, 500)
  reason!: string;
}
