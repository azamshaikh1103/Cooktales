// Copies a few PUBLISHED recipes and stories from the public CookTale API into the STAGING database,
// owned by one staging-only "cooktale" author. Run it inside the staging backend container:
//
//   docker compose --env-file .env.staging -f docker-compose.production.yml exec -T backend node - < deploy/seed-staging-content.js
//
// - Reads only public API responses. It never touches the production database.
// - Refuses to run unless the container is clearly staging.
// - Copies no Cloudinary public ids, so deleting a copy on staging can never purge a production image.
// - Copies no users, reviews, comments, likes, bookmarks or counters.
// - Safe to run again: existing slugs are skipped.
const { randomUUID } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const SOURCE = process.env.SEED_SOURCE_API || "https://api.cooktale.in/api/v1";
const RECIPES = Number(process.env.SEED_RECIPES || 6);
const STORIES = Number(process.env.SEED_STORIES || 4);

const isStaging =
  /cooktale_staging/.test(process.env.DATABASE_URL || "") &&
  /staging/.test(process.env.FRONTEND_URL || "");
if (!isStaging) {
  console.error("Refusing to run: this does not look like the staging backend container.");
  process.exit(1);
}

const prisma = new PrismaClient();

const getJson = async (path) => {
  const response = await fetch(`${SOURCE}${path}`, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${path} -> HTTP ${response.status}`);
  return response.json();
};

// Drop anything that points at a Cloudinary asset we do not own on staging.
const stripPublicIds = (value) => {
  if (Array.isArray(value)) return value.map(stripPublicIds);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "publicId")
        .map(([key, inner]) => [key, stripPublicIds(inner)]),
    );
  }
  return value;
};

const date = (value) => (value ? new Date(value) : null);

async function ensureAuthor(sourceAuthor) {
  const email = "cooktale@staging.invalid";
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "CookTale",
      email,
      username: "cooktale",
      image: sourceAuthor?.image ?? null,
      about: sourceAuthor?.about ?? null,
      emailVerified: new Date(),
      onboardedAt: new Date(),
      surveyCompleted: true,
    },
  });
}

async function copyRecipe(slug, authorId) {
  if (await prisma.recipe.findUnique({ where: { slug }, select: { id: true } })) {
    return "skipped";
  }
  const r = (await getJson(`/recipes/${slug}`)).recipe;
  const child = (list = [], pick) => list.map((item, index) => ({ ...pick(item), position: item.position ?? index }));
  await prisma.recipe.create({
    data: {
      slug: r.slug,
      status: "PUBLISHED",
      version: 1,
      name: r.name,
      about: r.about,
      mainImage: r.mainImage,
      moreImages: r.moreImages ?? [],
      totalTimeReq: r.totalTimeReq ?? 0,
      yield: r.yield,
      calories: r.calories,
      diet: r.diet,
      cuisine: r.cuisine,
      recipeCategory: r.recipeCategory,
      difficulty: r.difficulty,
      tipsAndTricks: r.tipsAndTricks,
      storingFreezing: r.storingFreezing,
      tags: r.tags ?? [],
      popularityScore: r.popularityScore ?? 0,
      season: r.season,
      isPremium: false,
      publishedAt: date(r.publishedAt),
      submittedAt: date(r.submittedAt),
      authorId,
      ingredients: {
        create: child(r.ingredients, (i) => ({
          name: i.name, detail: i.detail, image: i.image, link: i.link, regionalName: i.regionalName ?? undefined,
        })),
      },
      equipments: {
        create: child(r.equipments, (i) => ({
          name: i.name, detail: i.detail, image: i.image, link: i.link, regionalName: i.regionalName ?? undefined,
        })),
      },
      steps: {
        create: child(r.steps, (s) => ({
          name: s.name, detail: s.detail, timeReq: s.timeReq, videoUrl: s.videoUrl, image: s.image, link: s.link,
        })),
      },
      faqs: { create: child(r.faqs, (f) => ({ question: f.question, answer: f.answer })) },
    },
  });
  return "copied";
}

async function copyStory(slug, authorId) {
  if (await prisma.story.findUnique({ where: { slug }, select: { id: true } })) {
    return "skipped";
  }
  const s = (await getJson(`/stories/${slug}`)).story;
  await prisma.story.create({
    data: {
      slug: s.slug,
      status: "PUBLISHED",
      version: 1,
      title: s.title,
      shortDesc: s.shortDesc ?? "",
      coverImage: s.coverImage,
      tags: s.tags ?? [],
      popularityScore: s.popularityScore ?? 0,
      publishedAt: date(s.publishedAt),
      submittedAt: date(s.submittedAt),
      authorId,
      content: {
        create: (s.content ?? []).map((block, index) => ({
          type: block.type,
          content: stripPublicIds(block.content),
          position: block.position ?? index,
        })),
      },
    },
  });
  return "copied";
}

async function main() {
  const recipeList = (await getJson(`/recipes?limit=${RECIPES}`)).recipes.slice(0, RECIPES);
  const storyList = (await getJson(`/stories?limit=${STORIES}`)).stories.slice(0, STORIES);
  const author = await ensureAuthor(recipeList[0]?.author ?? storyList[0]?.author);

  for (const item of recipeList) console.log("recipe", item.slug, await copyRecipe(item.slug, author.id));
  for (const item of storyList) console.log("story ", item.slug, await copyStory(item.slug, author.id));
  console.log("done");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
