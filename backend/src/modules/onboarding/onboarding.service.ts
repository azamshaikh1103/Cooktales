import { BadRequestException, Injectable } from '@nestjs/common';
import { OnboardingDiscoverySource } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SubmitOnboardingSurveyDto } from './dto/onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        surveyCompleted: true,
        surveySkippedAt: true,
        discoverySource: true,
        discoverySourceDetail: true,
        onboardingGoal: true,
        cookingIdentity: true,
      },
    });

    return { survey: user };
  }

  async submit(userId: string, dto: SubmitOnboardingSurveyDto) {
    const detail = dto.discoverySourceDetail?.trim() || null;
    if (dto.discoverySource === OnboardingDiscoverySource.OTHER && !detail) {
      throw new BadRequestException('Please tell us where you heard about CookTale.');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        surveyCompleted: true,
        surveySkippedAt: null,
        onboardedAt: new Date(),
        discoverySource: dto.discoverySource,
        discoverySourceDetail: dto.discoverySource === OnboardingDiscoverySource.OTHER ? detail : null,
        onboardingGoal: dto.primaryGoal,
        cookingIdentity: dto.cookingIdentity,
      },
      select: {
        surveyCompleted: true,
        surveySkippedAt: true,
        discoverySource: true,
        discoverySourceDetail: true,
        onboardingGoal: true,
        cookingIdentity: true,
      },
    });

    return { survey: user };
  }

  async skip(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        surveyCompleted: true,
        surveySkippedAt: new Date(),
      },
      select: { surveyCompleted: true, surveySkippedAt: true },
    });

    return { survey: user };
  }
}
