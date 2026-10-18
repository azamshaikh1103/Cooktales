import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const imageUrls = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=82',
];

function unavailable(url) {
  return !url || url.includes('storage.googleapis.com/media-manager-uploads/');
}

async function main() {
  if (process.env.ALLOW_LOCAL_SAMPLE_DATA !== 'true') {
    throw new Error('Set ALLOW_LOCAL_SAMPLE_DATA=true to add development-only recipe images.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This script is intentionally blocked in production.');
  }

  const recipes = await prisma.recipe.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    include: { steps: { select: { id: true, image: true, position: true } } },
  });
  let updatedRecipes = 0;
  let updatedSteps = 0;

  for (const [recipeIndex, recipe] of recipes.entries()) {
    const updates = {};
    if (unavailable(recipe.mainImage)) updates.mainImage = imageUrls[recipeIndex % imageUrls.length];
    const gallery = recipe.moreImages.filter((url) => !unavailable(url));
    if (gallery.length !== recipe.moreImages.length || gallery.length === 0) {
      updates.moreImages = [
        imageUrls[(recipeIndex + 1) % imageUrls.length],
        imageUrls[(recipeIndex + 2) % imageUrls.length],
      ];
    }
    if (Object.keys(updates).length) {
      await prisma.recipe.update({ where: { id: recipe.id }, data: updates });
      updatedRecipes += 1;
    }
    for (const step of recipe.steps) {
      if (!unavailable(step.image)) continue;
      await prisma.step.update({ where: { id: step.id }, data: { image: imageUrls[(recipeIndex + step.position + 1) % imageUrls.length] } });
      updatedSteps += 1;
    }
  }

  console.log(`Added local sample images to ${updatedRecipes} recipes and ${updatedSteps} cooking steps.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
