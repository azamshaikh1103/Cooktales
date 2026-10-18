import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const people = [
  { email: 'sample-kitchen@cooktale.local', name: 'CookTale Kitchen', username: 'cooktale_kitchen', points: 280 },
  { email: 'sample-anna@cooktale.local', name: 'Anna Lewis', username: 'anna_cooks', points: 195 },
  { email: 'sample-mateo@cooktale.local', name: 'Mateo Silva', username: 'mateo_at_home', points: 165 },
  { email: 'sample-rina@cooktale.local', name: 'Rina Patel', username: 'rina_bakes', points: 145 },
  { email: 'sample-noah@cooktale.local', name: 'Noah Kim', username: 'noah_makes_dinner', points: 125 },
];

const discussions = [
  {
    slug: 'sample-reliable-30-minute-dinner',
    title: 'What is your most reliable 30-minute dinner?',
    category: 'General',
    content: 'I am collecting ideas for the evenings when I want something proper but do not want to spend an hour cooking. What do you make when you need dinner to work every time?',
    author: 'anna_cooks',
    views: 184,
    likes: ['mateo_at_home', 'rina_bakes', 'noah_makes_dinner'],
    comments: [
      ['mateo_at_home', 'Garlic noodles with greens, a fried egg, and whatever leftovers are in the fridge. It is fast and does not need much planning.'],
      ['rina_bakes', 'A tray of roasted vegetables with couscous and yogurt is mine. The vegetables can change every time.'],
    ],
  },
  {
    slug: 'sample-keep-basil-fresh',
    title: 'How do you keep basil fresh for more than two days?',
    category: 'Ingredients',
    content: 'I buy basil with good intentions, then it turns dark before I use it. I would love a storage method that works in a normal home kitchen.',
    author: 'mateo_at_home',
    views: 142,
    likes: ['anna_cooks', 'rina_bakes'],
    comments: [['anna_cooks', 'Trim the stems and keep it upright in a small glass of water on the counter. Cover it loosely with a bag and change the water every day or two.']],
  },
  {
    slug: 'sample-crisp-home-pizza-crust',
    title: 'Help with getting a crisp crust on home pizza',
    category: 'Baking Help',
    content: 'My toppings cook nicely but the base stays softer than I want. I am using a regular oven and a metal tray. What made the biggest difference for you?',
    author: 'rina_bakes',
    views: 226,
    likes: ['anna_cooks', 'mateo_at_home', 'noah_makes_dinner', 'cooktale_kitchen'],
    comments: [
      ['cooktale_kitchen', 'Preheat the tray while the oven heats, then build the pizza on baking paper and slide it onto the hot tray. A thinner layer of sauce also helps.'],
      ['noah_makes_dinner', 'I started baking mine on the lower rack for the first half, then moved it up briefly for the cheese.'],
    ],
  },
  {
    slug: 'sample-family-biryani-first-attempt',
    title: 'My first attempt at a family biryani',
    category: 'Showcase',
    content: 'I finally wrote down my aunt\'s steps and made biryani for my family. It took most of the afternoon, but the rice and potatoes came out exactly as I hoped.',
    author: 'noah_makes_dinner',
    views: 168,
    likes: ['anna_cooks', 'mateo_at_home', 'rina_bakes', 'cooktale_kitchen'],
    comments: [['rina_bakes', 'This sounds wonderful. The first time a long family recipe works is such a good feeling.']],
  },
  {
    slug: 'sample-one-knife-every-day',
    title: 'Which knife did you buy once and still use every day?',
    category: 'Equipment',
    content: 'I am replacing a worn-out chef\'s knife and would rather buy one useful tool than collect a drawer full of gadgets. What do you genuinely reach for every day?',
    author: 'cooktale_kitchen',
    views: 111,
    likes: ['anna_cooks', 'mateo_at_home'],
    comments: [['mateo_at_home', 'An 8-inch chef\'s knife that feels balanced in your own hand. Try a few in person if you can, and keep a simple sharpener nearby.']],
  },
  {
    slug: 'sample-use-up-vegetables',
    title: 'What do you cook when you need to use up vegetables?',
    category: 'General',
    content: 'I have half a drawer of vegetables left after the week. I usually make soup, but I would like a few more flexible ideas that do not need an exact recipe.',
    author: 'anna_cooks',
    views: 154,
    likes: ['mateo_at_home', 'rina_bakes', 'noah_makes_dinner'],
    comments: [['rina_bakes', 'Frittata, fried rice, and sheet-pan vegetables are my three defaults. A sauce or dressing at the end makes them feel less like leftovers.']],
  },
];

async function main() {
  if (process.env.ALLOW_LOCAL_SAMPLE_DATA !== 'true') throw new Error('Set ALLOW_LOCAL_SAMPLE_DATA=true to add local sample discussions.');
  if (process.env.NODE_ENV === 'production') throw new Error('This sample-discussion seed is blocked in production.');

  const usersByUsername = new Map();
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      create: { email: person.email, name: person.name, username: person.username, about: 'Local development sample content only.', emailVerified: new Date(), points: person.points },
      update: {},
    });
    usersByUsername.set(person.username, user);
  }

  let addedDiscussions = 0;
  for (const [index, item] of discussions.entries()) {
    const existing = await prisma.discussion.findUnique({ where: { slug: item.slug }, select: { id: true } });
    const discussion = await prisma.discussion.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, title: item.title, content: item.content, category: item.category, authorId: usersByUsername.get(item.author).id, views: item.views, createdAt: new Date(Date.now() - index * 3_600_000) },
      update: {},
    });
    if (!existing) addedDiscussions += 1;
    await prisma.like.createMany({ data: item.likes.map((username) => ({ userId: usersByUsername.get(username).id, discussionId: discussion.id })), skipDuplicates: true });
    const existingComments = await prisma.comment.count({ where: { discussionId: discussion.id } });
    if (existingComments === 0) {
      await prisma.comment.createMany({ data: item.comments.map(([username, content]) => ({ discussionId: discussion.id, authorId: usersByUsername.get(username).id, content })) });
    }
  }
  console.log(`Local sample discussions ready: ${addedDiscussions} new discussions.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
