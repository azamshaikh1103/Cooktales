'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaUtensils, FaBookOpen, FaStar } from 'react-icons/fa';
import imageLoader from '@/lib/loader';

// Helper to parse text
const parseContent = (text: string, attachments: any) => {
  // Regex patterns
  const recipeRegex = /\[RECIPE:([a-zA-Z0-9-]+)\]/g;
  const blogRegex = /\[BLOG:([a-zA-Z0-9-]+)\]/g;
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  const mentionRegex = /@(\w+)/g;

  const parts = [];
  let lastIndex = 0;

  // We'll use a simple replace strategy to find matches and push to array
  // Note: For a production app with mixed nesting, a parser library is better,
  // but this regex loop works great for this structure.

  // Combine all regexes for splitting (simplified for this example)
  const splitRegex = /((?:\[RECIPE:[^\]]+\])|(?:\[BLOG:[^\]]+\])|(?:!\[.*?\]\(.*?\))|(?:@\w+))/g;

  const matches = text.split(splitRegex);

  return matches.map((part, i) => {
    // 1. Handle Recipe Embeds
    if (part.startsWith('[RECIPE:')) {
      const id = part.replace('[RECIPE:', '').replace(']', '');
      const data = attachments.recipes.find((r: any) => r.id === id);
      if (!data) return null;
      return <EmbedCard key={i} data={data} type="recipe" />;
    }

    // 2. Handle Blog Embeds
    if (part.startsWith('[BLOG:')) {
      const id = part.replace('[BLOG:', '').replace(']', '');
      const data = attachments.stories.find((b: any) => b.id === id);
      if (!data) return null;
      return <EmbedCard key={i} data={data} type="story" />;
    }

    // 3. Handle Images
    if (part.startsWith('![') && part.includes('](')) {
      const match = part.match(/!\[(.*?)\]\((.*?)\)/);
      if (!match) return null;
      return (
        <div
          key={i}
          className="relative my-8 aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 shadow-lg dark:border-white/10"
        >
          <Image
            src={match[2]}
            fill
            alt={match[1]}
            className="object-cover"
            loader={imageLoader}
          />
        </div>
      );
    }

    // 4. Handle Mentions
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <Link
          key={i}
          href={`/profile/@${username}`}
          className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
        >
          {part}
        </Link>
      );
    }

    // 5. Regular Text (Preserve line breaks)
    return (
      <span key={i} className="whitespace-pre-line">
        {part}
      </span>
    );
  });
};

const EmbedCard = ({ data, type }: { data: any; type: 'recipe' | 'story' }) => {
  return (
    <Link
      href={
        type === 'recipe' && data.slug
          ? `/recipe/${data.slug}`
          : type === 'recipe'
            ? '/recipe'
            : `/stories/${data.slug || data.id}`
      }
      className="not-prose block"
    >
      <div className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#006C5E] dark:border-white/10 dark:bg-[#152a26] dark:hover:border-[#4ADE80]">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
          <Image
            src={type === 'recipe' ? data.mainImage : data.coverImage}
            fill
            alt=""
            className="object-cover transition-transform group-hover:scale-110"
            loader={imageLoader}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
            {type === 'recipe' ? (
              <FaUtensils className="text-[#006C5E] dark:text-[#4ADE80]" />
            ) : (
              <FaBookOpen className="text-blue-500" />
            )}
            <span>{type}</span>
          </div>
          <h4 className="truncate text-lg font-bold text-gray-900 dark:text-white">
            {type === 'recipe' ? data.name : data.title}
          </h4>
          {type === 'recipe' && data.ratings > 0 && (
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <FaStar className="text-yellow-400" /> {data.ratings.toFixed(1)}
            </div>
          )}
          {type === 'story' && (
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{data.shortDesc}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default function RichContent({
  content,
  attachments,
}: {
  content: string;
  attachments: any;
}) {
  return (
    <div className="text-lg leading-loose text-gray-600 dark:text-gray-300">
      {parseContent(content, attachments)}
    </div>
  );
}
