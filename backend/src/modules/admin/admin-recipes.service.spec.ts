import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { AdminRecipesService } from './admin-recipes.service';

describe('AdminRecipesService', () => {
  it('hides a published recipe and records the required reason', async () => {
    const tx = {
      recipe: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'recipe-1', status: 'ARCHIVED' }),
      },
      adminRecipeModerationAction: { create: jest.fn().mockResolvedValue({ id: 'action-1' }) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminRecipesService(prisma);

    await expect(
      service.hide('admin-1', 'recipe-1', { reason: 'Copyright concern' }),
    ).resolves.toEqual({ recipe: { id: 'recipe-1', status: 'ARCHIVED' } });

    expect(tx.recipe.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'recipe-1', status: 'PUBLISHED', deletedAt: null }),
    }));
    expect(tx.adminRecipeModerationAction.create).toHaveBeenCalledWith({
      data: { recipeId: 'recipe-1', adminId: 'admin-1', action: 'HIDDEN', reason: 'Copyright concern' },
    });
  });

  it('refuses to hide a recipe that is no longer published', async () => {
    const tx = {
      recipe: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
      adminRecipeModerationAction: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminRecipesService(prisma);

    await expect(
      service.hide('admin-1', 'recipe-1', { reason: 'Copyright concern' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.adminRecipeModerationAction.create).not.toHaveBeenCalled();
  });

  it('restores only the latest administrator-hidden recipe', async () => {
    const tx = {
      adminRecipeModerationAction: {
        findFirst: jest.fn().mockResolvedValue({ action: 'HIDDEN' }),
        create: jest.fn().mockResolvedValue({ id: 'action-2' }),
      },
      recipe: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'recipe-1', status: 'PUBLISHED' }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;
    const service = new AdminRecipesService(prisma);

    await expect(service.restore('admin-1', 'recipe-1')).resolves.toEqual({
      recipe: { id: 'recipe-1', status: 'PUBLISHED' },
    });
    expect(tx.adminRecipeModerationAction.create).toHaveBeenCalledWith({
      data: { recipeId: 'recipe-1', adminId: 'admin-1', action: 'RESTORED' },
    });
  });
});
