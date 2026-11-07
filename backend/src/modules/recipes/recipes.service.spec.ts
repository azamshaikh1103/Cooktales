import type { PrismaService } from '../../database/prisma.service';
import { RecipesService } from './recipes.service';

const recipe = {
  id: 'recipe-1',
  authorId: 'author-1',
  version: 4,
  status: 'PUBLISHED',
  name: 'Baked Brie',
  about: null,
  mainImage: 'https://res.cloudinary.com/demo/main.webp',
  mainImagePublicId: 'recipes/recipe-1/main',
  moreImages: [],
  totalTimeReq: 30,
  yield: 6,
  calories: null,
  diet: null,
  cuisine: 'French',
  recipeCategory: 'Appetizer',
  difficulty: null,
  tipsAndTricks: null,
  storingFreezing: null,
  tags: [],
  ingredients: [{ name: 'Brie', detail: null, image: null, link: null }],
  equipments: [],
  steps: [{ name: 'Bake', detail: null, timeReq: 20, videoUrl: null, image: null, link: null }],
  faqs: [],
  media: [
    {
      publicId: 'recipes/recipe-1/main',
      url: 'https://res.cloudinary.com/demo/main.webp',
      resourceType: 'IMAGE',
      kind: 'MAIN',
      position: 0,
      width: null,
      height: null,
      bytes: null,
      format: null,
    },
  ],
  author: {
    id: 'author-1',
    name: 'Chef',
    username: 'chef',
    image: null,
    about: null,
    _count: { recipes: 1 },
  },
  reviews: [],
  _count: { reviews: 0 },
};

describe('RecipesService edit drafts', () => {
  const media = {
    assertCloudinaryUrl: jest.fn(),
    assertAttachableUploads: jest.fn().mockResolvedValue(undefined),
    markAttached: jest.fn().mockResolvedValue(undefined),
    scheduleDeletion: jest.fn().mockResolvedValue(undefined),
  };
  const unused = {} as never;

  beforeEach(() => jest.clearAllMocks());

  it('creates a private copy instead of changing the published recipe', async () => {
    const prisma = {
      recipe: { findFirst: jest.fn().mockResolvedValue(recipe), update: jest.fn() },
      recipeEditDraft: {
        upsert: jest.fn().mockResolvedValue({
          id: 'edit-1',
          recipeId: recipe.id,
          baseVersion: recipe.version,
          version: 1,
          updatedAt: new Date('2026-11-06T00:00:00.000Z'),
          data: { name: recipe.name },
        }),
      },
    } as unknown as PrismaService;
    const service = new RecipesService(prisma, media as never, unused, unused, unused);

    const result = await service.startEditDraft('author-1', recipe.id);

    expect(result.draft.recipe.name).toBe(recipe.name);
    expect(prisma.recipeEditDraft.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ recipeId: recipe.id, baseVersion: recipe.version }),
      }),
    );
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it('saves an edit copy without touching the published recipe', async () => {
    const draftData = {
      name: recipe.name,
      mainImage: recipe.mainImage,
      mainImagePublicId: recipe.mainImagePublicId,
      totalTimeReq: recipe.totalTimeReq,
      recipeCategory: recipe.recipeCategory,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      media: recipe.media,
    };
    const prisma = {
      recipe: { findFirst: jest.fn().mockResolvedValue(recipe), update: jest.fn() },
      recipeEditDraft: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'edit-1',
          recipeId: recipe.id,
          baseVersion: recipe.version,
          version: 1,
          data: draftData,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'edit-1',
          recipeId: recipe.id,
          baseVersion: recipe.version,
          version: 2,
          updatedAt: new Date('2026-11-06T00:00:00.000Z'),
          data: { ...draftData, name: 'Updated Brie' },
        }),
      },
    } as unknown as PrismaService;
    const service = new RecipesService(prisma, media as never, unused, unused, unused);

    await service.updateEditDraft('author-1', recipe.id, {
      expectedVersion: 1,
      name: 'Updated Brie',
    });

    expect(prisma.recipeEditDraft.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'edit-1', version: 1 } }),
    );
    expect(prisma.recipe.update).not.toHaveBeenCalled();
  });

  it('does not publish an edit that changed while publishing', async () => {
    const tx = {
      recipeEditDraft: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      recipe: { updateMany: jest.fn() },
    };
    const prisma = {
      recipe: { findFirst: jest.fn().mockResolvedValue(recipe) },
      recipeEditDraft: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'edit-1',
          baseVersion: recipe.version,
          version: 1,
          data: { ...recipe },
        }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    } as unknown as PrismaService;
    const service = new RecipesService(prisma, media as never, unused, unused, unused);

    await expect(service.publishEditDraft('author-1', recipe.id)).rejects.toThrow(
      'These changes were updated elsewhere',
    );
    expect(tx.recipeEditDraft.deleteMany).toHaveBeenCalledWith({
      where: { id: 'edit-1', version: 1 },
    });
    expect(tx.recipe.updateMany).not.toHaveBeenCalled();
  });
});
