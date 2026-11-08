import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma, ReportTargetType } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { ReportsService } from './reports.service';

const TARGET_ID = '11111111-1111-4111-8111-111111111111';
const ALL_TYPES: ReportTargetType[] = ['DISCUSSION', 'COMMENT', 'RECIPE', 'STORY'];

describe('ReportsService', () => {
  const build = (authorId: string | null = 'author-1') => {
    const found = authorId ? { authorId } : null;
    const prisma = {
      discussion: { findFirst: jest.fn().mockResolvedValue(found) },
      comment: { findFirst: jest.fn().mockResolvedValue(found) },
      recipe: { findFirst: jest.fn().mockResolvedValue(found) },
      story: { findFirst: jest.fn().mockResolvedValue(found) },
      report: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 'r1' }) },
    };
    const abuse = { checkUserAction: jest.fn().mockResolvedValue(undefined) };
    const service = new ReportsService(prisma as unknown as PrismaService, abuse as never);
    return { service, prisma, abuse };
  };
  const dto = { targetType: ReportTargetType.DISCUSSION, targetId: TARGET_ID, reason: 'SPAM' as const };

  it('creates a report and rate limits the reporter', async () => {
    const { service, prisma, abuse } = build();

    await expect(service.create('user-1', { ...dto, details: 'bad link' })).resolves.toEqual({ reported: true, alreadyReported: false });

    expect(abuse.checkUserAction).toHaveBeenCalledWith('user-1', 'report', 10, 3600);
    expect(prisma.report.create).toHaveBeenCalledWith({
      data: { reporterId: 'user-1', targetType: 'DISCUSSION', targetId: TARGET_ID, reason: 'SPAM', details: 'bad link' },
    });
  });

  it('stores blank details as null', async () => {
    const { service, prisma } = build();
    await service.create('user-1', { ...dto, details: null });
    expect(prisma.report.create).toHaveBeenCalledWith({ data: expect.objectContaining({ details: null }) });
  });

  it('returns alreadyReported without a second row', async () => {
    const { service, prisma } = build();
    prisma.report.findUnique.mockResolvedValue({ id: 'r1' });

    await expect(service.create('user-1', dto)).resolves.toEqual({ reported: true, alreadyReported: true });
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('treats a unique-key race as already reported', async () => {
    const { service, prisma } = build();
    prisma.report.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'x' }));

    await expect(service.create('user-1', dto)).resolves.toEqual({ reported: true, alreadyReported: true });
  });

  it.each(ALL_TYPES)('refuses own %s content', async (targetType) => {
    const { service, prisma } = build('user-1');

    await expect(service.create('user-1', { ...dto, targetType })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it.each(ALL_TYPES)('404s when %s is missing or hidden', async (targetType) => {
    const { service, prisma } = build(null);

    await expect(service.create('user-1', { ...dto, targetType })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.report.create).not.toHaveBeenCalled();
  });

  it('only accepts visible discussion comments', async () => {
    const { service, prisma } = build();
    await service.create('user-1', { ...dto, targetType: ReportTargetType.COMMENT });
    expect(prisma.comment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: TARGET_ID, discussionId: { not: null }, deletedAt: null, status: 'VISIBLE', discussion: { deletedAt: null } },
    }));
  });

  it('propagates the rate limit error before touching the database', async () => {
    const { service, prisma, abuse } = build();
    abuse.checkUserAction.mockRejectedValue(new Error('limited'));

    await expect(service.create('user-1', dto)).rejects.toThrow('limited');
    expect(prisma.discussion.findFirst).not.toHaveBeenCalled();
  });
});
