import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const images = [
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=82',
];

const recipes = [
  ['Weeknight Lemon Herb Chicken', 'A fast skillet chicken dinner with lemon, garlic, and herbs.', 'Italian', 'Easy', 'Omnivore', 35, 4],
  ['Crispy Chili Tofu Bowls', 'Crisp tofu, rice, vegetables, and a quick chili dressing.', 'Asian', 'Easy', 'Vegan', 30, 3],
  ['Roasted Tomato Pasta', 'Sweet roasted tomatoes folded through a simple garlic pasta.', 'Italian', 'Easy', 'Vegetarian', 45, 4],
  ['Coconut Chickpea Curry', 'A pantry-friendly curry with coconut milk, spinach, and warm spices.', 'Indian', 'Easy', 'Vegan', 40, 4],
  ['Miso Salmon Rice Bowl', 'Glazed salmon with rice, cucumber, and sesame greens.', 'Japanese', 'Medium', 'Pescatarian', 35, 2],
  ['Smoky Black Bean Tacos', 'Black beans, charred corn, lime, and crunchy cabbage.', 'Mexican', 'Easy', 'Vegan', 25, 4],
  ['Creamy Mushroom Risotto', 'A slow, comforting risotto finished with parmesan and herbs.', 'Italian', 'Medium', 'Vegetarian', 50, 4],
  ['Sheet Pan Chicken Fajitas', 'Chicken, peppers, onions, and spices cooked together on one tray.', 'Mexican', 'Easy', 'Omnivore', 35, 4],
  ['Herby Lentil Soup', 'A filling lentil soup with vegetables, herbs, and lemon.', 'Middle Eastern', 'Easy', 'Vegan', 55, 6],
  ['Garlic Butter Prawn Pasta', 'Juicy prawns and pasta in a bright garlic butter sauce.', 'Italian', 'Easy', 'Pescatarian', 25, 2],
  ['Sesame Ginger Noodles', 'Quick noodles with ginger, sesame, greens, and a savoury sauce.', 'Asian', 'Easy', 'Vegan', 20, 3],
  ['Vegetable Lasagne', 'Layered vegetables, tomato sauce, pasta, and creamy cheese.', 'Italian', 'Medium', 'Vegetarian', 75, 6],
  ['Mediterranean Grain Salad', 'Roasted vegetables, grains, olives, herbs, and lemon.', 'Mediterranean', 'Easy', 'Vegan', 35, 4],
  ['Slow Cooked Beef Ragu', 'Rich tomato beef ragu for a long, relaxed weekend meal.', 'Italian', 'Hard', 'Omnivore', 180, 6],
  ['Fluffy Sunday Pancakes', 'Soft pancakes with fruit, maple syrup, and a little vanilla.', 'American', 'Easy', 'Vegetarian', 25, 4],
];

const stories = [
  ['The Weeknight Dinner Rule That Actually Helps', 'A simple way to plan meals without turning your whole Sunday into admin.', 'meal planning'],
  ['What I Learned From Cooking One New Dish a Week', 'Small experiments in the kitchen can change how you cook every day.', 'kitchen habits'],
  ['How to Build a Better Pantry', 'The staple ingredients that make last-minute cooking easier.', 'pantry'],
  ['The Case for Writing Down Family Recipes', 'Why the best recipes deserve more than a memory.', 'food memories'],
  ['A Quiet Guide to Hosting Dinner at Home', 'Simple choices that make guests feel comfortable at the table.', 'hosting'],
  ['Why Seasonal Cooking Feels Easier', 'Letting the market guide dinner can reduce decision fatigue.', 'seasonal food'],
  ['The Small Tools I Use Every Day', 'A short list of kitchen tools that genuinely earn their drawer space.', 'kitchen tools'],
  ['Cooking for One Without Eating the Same Thing', 'A practical approach to smaller portions and flexible leftovers.', 'solo cooking'],
  ['The Sunday Sauce That Became a Family Tradition', 'One pot of tomato sauce, several years of memories.', 'family food'],
  ['What Makes a Recipe Worth Saving', 'A reliable dish is more valuable than a long list of bookmarks.', 'recipes'],
  ['How I Stopped Wasting Fresh Herbs', 'Small storage changes that keep herbs useful for longer.', 'food waste'],
  ['A Better Way to Think About Leftovers', 'Treat leftover ingredients as a starting point, not a compromise.', 'leftovers'],
  ['The Joy of a Long Breakfast', 'Why a slow morning meal can reset the rest of the day.', 'breakfast'],
  ['Learning to Trust Your Taste', 'Following a recipe matters, but tasting as you cook matters too.', 'cooking skills'],
  ['The Food Stories We Share at the Table', 'Meals give people a reason to pause, talk, and remember.', 'food culture'],
];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  if (process.env.ALLOW_LOCAL_SAMPLE_DATA !== 'true') {
    throw new Error('Set ALLOW_LOCAL_SAMPLE_DATA=true to add local sample content.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This sample-content seed is blocked in production.');
  }

  const author = await prisma.user.upsert({
    where: { email: 'sample-kitchen@cooktale.local' },
    create: {
      email: 'sample-kitchen@cooktale.local',
      name: 'CookTale Kitchen',
      username: 'cooktale_kitchen',
      about: 'Local development sample content only.',
      emailVerified: new Date(),
    },
    update: {},
  });

  let addedRecipes = 0;
  for (const [index, [name, about, cuisine, difficulty, diet, totalTimeReq, servings]] of recipes.entries()) {
    const result = await prisma.recipe.upsert({
      where: { slug: `sample-${slug(name)}` },
      create: {
        slug: `sample-${slug(name)}`,
        status: 'PUBLISHED',
        name,
        about,
        cuisine,
        difficulty,
        diet,
        totalTimeReq,
        yield: servings,
        calories: 350 + index * 25,
        mainImage: images[index % images.length],
        moreImages: [images[(index + 1) % images.length], images[(index + 2) % images.length]],
        tags: [cuisine.toLowerCase(), diet.toLowerCase(), 'sample'],
        tipsAndTricks: 'Taste as you cook and adjust salt, acid, and heat before serving.',
        storingFreezing: 'Cool completely, store in an airtight container, and refrigerate for up to three days.',
        ratings: 4.2 + (index % 5) * 0.15,
        ratingCount: 8 + index * 3,
        views: 80 + index * 19,
        likes: 4 + index,
        popularityScore: 10 + index,
        isLatest: index < 6,
        isTodaysPick: index === 0,
        publishedAt: new Date(Date.now() - index * 86_400_000),
        authorId: author.id,
        ingredients: {
          create: [
            { name: 'Main ingredients', detail: 'Measured for the listed servings', position: 0 },
            { name: 'Olive oil or cooking oil', detail: '1 tablespoon', position: 1 },
            { name: 'Salt and black pepper', detail: 'To taste', position: 2 },
          ],
        },
        steps: {
          create: [
            { name: 'Prepare the ingredients', detail: 'Wash, chop, and measure everything before heating the pan.', position: 0 },
            { name: 'Cook the base', detail: 'Cook over medium heat until fragrant and tender.', timeReq: Math.max(8, Math.round(totalTimeReq / 3)), position: 1 },
            { name: 'Finish and serve', detail: 'Taste, adjust seasoning, and serve while warm.', timeReq: Math.max(5, Math.round(totalTimeReq / 4)), position: 2 },
          ],
        },
      },
      update: {},
    });
    if (result.createdAt.getTime() > Date.now() - 10_000) addedRecipes += 1;
  }

  let addedStories = 0;
  for (const [index, [title, shortDesc, tag]] of stories.entries()) {
    const result = await prisma.story.upsert({
      where: { slug: `sample-${slug(title)}` },
      create: {
        slug: `sample-${slug(title)}`,
        status: 'PUBLISHED',
        title,
        shortDesc,
        coverImage: images[(index + 3) % images.length],
        tags: [tag, 'sample', 'cooktale'],
        views: 50 + index * 14,
        likes: 3 + index,
        popularityScore: 8 + index,
        publishedAt: new Date(Date.now() - (index + 2) * 86_400_000),
        authorId: author.id,
        content: {
          create: [
            { type: 'heading', position: 0, content: { text: title } },
            { type: 'paragraph', position: 1, content: { text: `${shortDesc} Good cooking rarely needs a perfect plan; it needs a useful starting point and enough room to adapt.` } },
            { type: 'paragraph', position: 2, content: { text: 'This is local sample content for checking card layouts, listings, search results, metadata, and reading pages. It is deliberately separate from real CookTale publishing.' } },
            { type: 'paragraph', position: 3, content: { text: 'Keep the parts that help, change the parts that do not, and write down what you would make again.' } },
          ],
        },
      },
      update: {},
    });
    if (result.createdAt.getTime() > Date.now() - 10_000) addedStories += 1;
  }

  console.log(`Local sample content ready: ${addedRecipes} new recipes and ${addedStories} new stories.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
