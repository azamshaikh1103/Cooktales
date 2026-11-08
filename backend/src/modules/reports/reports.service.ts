import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentStatus, Prisma, RecipeStatus, ReportTargetType, StoryStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CommunityAbuseService } from '../community/community-abuse.service';
import type { CreateReportDto } from './dto/report.dto';

const REPORTS_PER_HOUR = 10;
const HOUR_SECONDS = 60 * 60;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly abuse: CommunityAbuseService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    await this.abuse.checkUserAction(reporterId, 'report', REPORTS_PER_HOUR, HOUR_SECONDS);

    const target = await this.findVisibleTarget(dto.targetType, dto.targetId);
    if (!target) throw new NotFoundException('Content not found');
    if (target.authorId === reporterId) throw new ForbiddenException("You can't report your own content");

    const key = { reporterId, targetType: dto.targetType, targetId: dto.targetId };
    if (await this.prisma.report.findUnique({ where: { reporterId_targetType_targetId: key }, select: { id: true } })) {
      return { reported: true, alreadyReported: true };
    }
    try {
      await this.prisma.report.create({ data: { ...key, reason: dto.reason, details: dto.details || null } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return { reported: true, alreadyReported: true };
      }
      throw error;
    }
    return { reported: true, alreadyReported: false };
  }

  private findVisibleTarget(type: ReportTargetType, id: string): Promise<{ authorId: string } | null> {
    const select = { authorId: true };
    switch (type) {
      case ReportTargetType.DISCUSSION:
        return this.prisma.discussion.findFirst({ where: { id, deletedAt: null }, select });
      case ReportTargetType.COMMENT:
        return this.prisma.comment.findFirst({
          where: { id, discussionId: { not: null }, deletedAt: null, status: CommentStatus.VISIBLE, discussion: { deletedAt: null } },
          select,
        });
      case ReportTargetType.RECIPE:
        return this.prisma.recipe.findFirst({ where: { id, status: RecipeStatus.PUBLISHED, deletedAt: null }, select });
      case ReportTargetType.STORY:
        return this.prisma.story.findFirst({ where: { id, status: StoryStatus.PUBLISHED, deletedAt: null }, select });
    }
  }
}
