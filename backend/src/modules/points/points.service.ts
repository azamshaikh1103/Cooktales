import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const POINTS = {
  RECIPE_PUBLISHED: 40,
  STORY_PUBLISHED: 25,
  RECIPE_REVIEW: 10,
  COMMENT: 3,
  COMMENT_DAILY_LIMIT: 5,
  RECEIVED_LIKE: 1,
} as const;

@Injectable()
export class PointsService {
  constructor(private readonly prisma: PrismaService) {}

  async award(userId: string, amount: number, reason: string, eventKey: string, dailyLimit?: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dailyLimit && await tx.pointHistory.count({
          where: { userId, reason, createdAt: { gte: this.startOfToday() } },
        }) >= dailyLimit) {
          return false;
        }

        await this.create(tx, userId, amount, reason, eventKey);
        return true;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
      throw error;
    }
  }

  /**
   * Takes back the points a specific action earned. Does nothing if that action never earned any
   * (for example it was over the daily limit) or was already taken back.
   */
  async revoke(userId: string, eventKey: string, reason: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const original = await tx.pointHistory.findUnique({ where: { eventKey } });
        if (!original || original.userId !== userId || original.amount <= 0) return false;

        await this.create(tx, userId, -original.amount, reason, `revoked:${eventKey}`);
        return true;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
      throw error;
    }
  }

  private async create(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    reason: string,
    eventKey: string,
  ) {
    await tx.pointHistory.create({ data: { userId, amount, reason, eventKey } });
    await tx.user.update({ where: { id: userId }, data: { points: { increment: amount } } });
  }

  private startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
