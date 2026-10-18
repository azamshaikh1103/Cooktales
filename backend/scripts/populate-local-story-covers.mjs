import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const covers = [
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1498579397066-22750a3cb424?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=82',
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1600&q=82',
];

async function main() {
  if (process.env.ALLOW_LOCAL_SAMPLE_DATA !== 'true') {
    throw new Error('Set ALLOW_LOCAL_SAMPLE_DATA=true to add development-only Story covers.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('This script is intentionally blocked in production.');
  }

  const stories = await prisma.story.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: { publishedAt: 'asc' },
    select: { id: true, coverImage: true },
  });
  let updated = 0;
  for (const [index, story] of stories.entries()) {
    if (story.coverImage) continue;
    await prisma.story.update({ where: { id: story.id }, data: { coverImage: covers[index % covers.length] } });
    updated += 1;
  }
  console.log(`Added sample covers to ${updated} local stories.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
