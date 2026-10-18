import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recipeUrl =
  'https://www.cooktale.in/recipe/marry-me-chicken-creamy-sundried-tomato-chicken?rid=58b08182-ec05-46f6-935a-67e0d6e476e7';
const storyUrls = [
  'https://www.cooktale.in/blogs/how-different-cultures-celebrate-christmas-through-food?bid=c39ad2bc-4895-43d3-a170-0223bce26eb1',
  'https://www.cooktale.in/blogs/new-year-new-food-goals-how-to-set-realistic-cooking-resolutions?bid=6bdd309c-0bb8-4a1b-891e-022af8af0cfe',
  'https://www.cooktale.in/blogs/2025-food-trends-that-changed-how-we-cook-this-year?bid=f7aed688-7d9d-44ac-9d69-d1d5f271d07e',
];

async function main() {
  if (process.env.ALLOW_LEGACY_PUBLIC_IMPORT !== 'true') {
    throw new Error('Set ALLOW_LEGACY_PUBLIC_IMPORT=true to run this local-only import.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This importer is intentionally blocked in production.');
  }

  const recipe = await fetchContent(recipeUrl, 'recipe');
  const stories = await Promise.all(storyUrls.map((url) => fetchContent(url, 'blog')));
  const author = await upsertAuthor(recipe.author);

  await upsertRecipe(recipe, author.id);
  for (const story of stories) await upsertStory(story, author.id);

  console.log(`Imported 1 recipe and ${stories.length} stories into local development.`);
}

async function fetchContent(url, key) {
  const response = await fetch(url, { headers: { 'User-Agent': 'CookTale local content importer' } });
  if (!response.ok) throw new Error(`Unable to fetch public content: ${url} (${response.status})`);
  const content = readRscObject(await response.text(), key);
  if (!content || typeof content !== 'object') throw new Error(`Public ${key} payload was not found: ${url}`);
  return content;
}

function readRscObject(html, key) {
  const scripts = /<script>self\.__next_f\.push\((\[1,"[\s\S]*?"\])\)<\/script>/g;
  let match;
  while ((match = scripts.exec(html))) {
    const payload = JSON.parse(match[1])[1];
    const start = payload.indexOf(`{"${key}":`);
    if (start < 0) continue;
    return JSON.parse(extractJsonObject(payload, start))[key];
  }
  return null;
}

function extractJsonObject(value, start) {
  let depth = 0;
  let quote = false;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const character = value[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quote = false;
      continue;
    }
    if (character === '"') quote = true;
    else if (character === '{') depth += 1;
    else if (character === '}' && --depth === 0) return value.slice(start, index + 1);
  }
  throw new Error('Public content payload is incomplete.');
}

async function upsertAuthor(source = {}) {
  const name = stringValue(source.name) || 'CookTale Team';
  return prisma.user.upsert({
    where: { email: 'legacy-content@cooktale.local' },
    create: {
      email: 'legacy-content@cooktale.local',
      name,
      username: normaliseHandle(source.username || name) || 'cooktale_team',
      image: importableImageUrl(source.image),
      about: stringValue(source.about) || 'Imported public CookTale content.',
      emailVerified: new Date(),
    },
    update: {
      name,
      image: importableImageUrl(source.image),
      about: stringValue(source.about) || 'Imported public CookTale content.',
    },
  });
}

async function upsertRecipe(recipe, authorId) {
  const data = {
    slug: slug(recipe.name), status: 'PUBLISHED', name: recipe.name, about: stringValue(recipe.about) || null,
    mainImage: stringValue(recipe.mainImage), moreImages: stringArray(recipe.moreImages), totalTimeReq: numberValue(recipe.totalTimeReq),
    yield: nullableNumber(recipe.yield), calories: nullableNumber(recipe.calories), diet: accepted(recipe.diet, ['Omnivore', 'Vegetarian', 'Vegan']),
    cuisine: stringValue(recipe.cuisine) || 'NA', difficulty: accepted(recipe.difficulty, ['Easy', 'Medium', 'Hard', 'Expert']),
    ratings: numberValue(recipe.ratings), ratingCount: numberValue(recipe.ratingCount), likes: numberValue(recipe.likes), views: numberValue(recipe.views),
    tags: stringArray(recipe.tags), tipsAndTricks: stringValue(recipe.tipsAndTricks) || null, storingFreezing: stringValue(recipe.storingFreezing) || null,
    publishedAt: dateValue(recipe.createdAt) || new Date(), authorId,
  };
  const ingredients = (recipe.ingredients || []).map((item, position) => ({ ...namedItem(item), position }));
  const steps = (recipe.steps || []).map((item, position) => ({ name: stringValue(item.name) || `Step ${position + 1}`, detail: stringValue(item.detail) || null, timeReq: nullableNumber(item.timeReq), image: stringValue(item.image) || null, videoUrl: stringValue(item.videoUrl) || null, link: stringValue(item.link) || null, position }));
  const equipments = (recipe.equipments || []).map((item, position) => ({ ...namedItem(item), position }));
  const faqs = (recipe.faqs || []).map((item, position) => ({ question: stringValue(item.question), answer: stringValue(item.answer), position }));
  await prisma.recipe.upsert({
    where: { id: recipe.id },
    create: { id: recipe.id, ...data, ingredients: { create: ingredients }, steps: { create: steps }, equipments: { create: equipments }, faqs: { create: faqs } },
    update: { ...data, ingredients: { deleteMany: {}, create: ingredients }, steps: { deleteMany: {}, create: steps }, equipments: { deleteMany: {}, create: equipments }, faqs: { deleteMany: {}, create: faqs } },
  });
}

async function upsertStory(story, authorId) {
  const data = {
    slug: slug(story.title), status: 'PUBLISHED', title: story.title, shortDesc: stringValue(story.shortDesc), coverImage: importableImageUrl(story.poster),
    likes: numberValue(story.likes), views: numberValue(story.views), tags: stringArray(story.tags), publishedAt: dateValue(story.createdAt) || new Date(), authorId,
  };
  const blocks = (story.content || []).flatMap((block, position) => {
    const type = typeof block.type === 'string' ? block.type : 'paragraph';
    if (type === 'image' && !importableImageUrl(block.content?.url)) return [];
    return { type, content: normaliseStoryBlockContent(type, block.content), position };
  });
  await prisma.story.upsert({
    where: { id: story.id },
    create: { id: story.id, ...data, content: { create: blocks } },
    update: { ...data, content: { deleteMany: {}, create: blocks } },
  });
}

function namedItem(value) { return { name: stringValue(value.name), detail: stringValue(value.detail) || null, image: stringValue(value.image) || null, link: stringValue(value.link) || null }; }
function stringValue(value) { return typeof value === 'string' ? value.trim() : ''; }
function stringArray(value) { return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.length > 0) : []; }
function numberValue(value) { return typeof value === 'number' && Number.isFinite(value) ? value : 0; }
function nullableNumber(value) { return typeof value === 'number' && Number.isFinite(value) ? value : null; }
function dateValue(value) { const date = typeof value === 'string' ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date : null; }
function accepted(value, values) { return typeof value === 'string' && values.includes(value) ? value : null; }
function slug(value) { return stringValue(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function normaliseHandle(value) { return slug(value).replace(/-/g, '_').slice(0, 30); }
function importableImageUrl(value) {
  const url = stringValue(value);
  return url && !url.includes('storage.googleapis.com/media-manager-uploads/') ? url : null;
}

function normaliseStoryBlockContent(type, value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};
  return ['image', 'video', 'link'].includes(type) ? { url: value } : { text: value };
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
