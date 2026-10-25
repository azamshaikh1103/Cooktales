import { CreatorPayoutMethodType } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePayoutMethodDto {
  @IsEnum(CreatorPayoutMethodType)
  method: CreatorPayoutMethodType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  legalName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  destination: string;

  @IsOptional()
  @IsBoolean()
  primary?: boolean;
}
