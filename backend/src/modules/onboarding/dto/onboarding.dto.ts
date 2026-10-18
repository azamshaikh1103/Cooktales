import { CookingIdentity, OnboardingDiscoverySource, OnboardingGoal } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitOnboardingSurveyDto {
  @IsEnum(OnboardingDiscoverySource)
  discoverySource!: OnboardingDiscoverySource;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  discoverySourceDetail?: string;

  @IsEnum(OnboardingGoal)
  primaryGoal!: OnboardingGoal;

  @IsEnum(CookingIdentity)
  cookingIdentity!: CookingIdentity;
}
