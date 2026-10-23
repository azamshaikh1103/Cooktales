import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const previewEmail = 'local-preview@cooktale.local';
const recipeSlug = 'local-preview-maple-dijon-sheet-pan-chicken';
const storySlug = 'local-preview-a-better-weeknight-dinner-rhythm';
const coverImage = 'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1600&q=82';

async function main() {
  if (process.env.ALLOW_LOCAL_SAMPLE_DATA !== 'true') {
    throw new Error('Set ALLOW_LOCAL_SAMPLE_DATA=true to add local preview content.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local preview content is blocked in production.');
  }

  const author = await prisma.user.upsert({
    where: { email: previewEmail },
    create: {
      email: previewEmail,
      name: 'CookTale Preview Kitchen',
      username: 'cooktale_preview',
      about: 'Local preview content only.',
      emailVerified: new Date(),
    },
    update: {},
  });

  const recipe = await prisma.recipe.upsert({
    where: { slug: recipeSlug },
    create: {
      slug: recipeSlug,
      status: 'PUBLISHED',
      name: 'Maple-Dijon Sheet-Pan Chicken',
      about: 'Roasted chicken, sweet potatoes, and Brussels sprouts with a simple maple-Dijon glaze.',
      mainImage: coverImage,
      moreImages: [],
      totalTimeReq: 45,
      yield: 4,
      calories: 520,
      diet: 'Omnivore',
      cuisine: 'American',
      difficulty: 'Easy',
      tags: ['sheet pan', 'weeknight dinner', 'fall', 'local preview'],
      tipsAndTricks: 'Cut the vegetables to a similar size so they roast evenly.',
      storingFreezing: 'Cool, cover, and refrigerate for up to three days.',
      publishedAt: new Date(),
      authorId: author.id,
      ingredients: { create: [
        { name: 'Chicken thighs', detail: '8 bone-in, skin-on', position: 0 },
        { name: 'Sweet potatoes', detail: '2 medium, cubed', position: 1 },
        { name: 'Brussels sprouts', detail: '300 g, halved', position: 2 },
        { name: 'Maple-Dijon glaze', detail: '2 tablespoons maple syrup and 1 tablespoon Dijon mustard', position: 3 },
      ] },
      steps: { create: [
        { name: 'Heat the oven', detail: 'Heat the oven to 220°C / 425°F and line a large tray.', position: 0 },
        { name: 'Prepare the tray', detail: 'Toss the vegetables with oil, salt, and pepper. Add the chicken on top.', position: 1, timeReq: 10 },
        { name: 'Roast and glaze', detail: 'Roast until the chicken is cooked through, brushing with the glaze for the last 10 minutes.', position: 2, timeReq: 35 },
      ] },
    },
    update: {},
  });

  await prisma.story.upsert({
    where: { slug: storySlug },
    create: {
      slug: storySlug,
      status: 'PUBLISHED',
      title: 'A Better Weeknight Dinner Rhythm',
      shortDesc: 'A small way to make dinner feel easier without planning every meal in advance.',
      coverImage,
      tags: ['weeknight dinner', 'local preview'],
      publishedAt: new Date(),
      authorId: author.id,
      content: { create: [
        { type: 'heading', position: 0, content: { text: 'A Better Weeknight Dinner Rhythm' } },
        { type: 'paragraph', position: 1, content: { text: 'The best weeknight plan is simple: keep one easy protein, one vegetable, and one comforting cupboard staple close by.' } },
        { type: 'paragraph', position: 2, content: { text: 'This local preview story is here so we can test the real CookTale reading and listing screens without changing live content.' } },
      ] },
    },
    update: {},
  });

  console.log(`Local preview ready: ${recipe.name} and one story.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
