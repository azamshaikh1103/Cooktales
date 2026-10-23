'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { FaLeaf, FaRegClock, FaStar, FaUserFriends } from 'react-icons/fa';
import { formatters } from '@/lib/formatters';
import imageLoader from '@/lib/loader';

interface Recipe {
  id: string;
  slug: string;
  name: string;
  totalTimeReq: number | null;
  yield: number | null;
  diet: string | null;
  ratings: number | null;
  ratingCount?: number | null;
  mainImage: string | null;
  author?: AuthorType;
}

interface RecipeCardProps {
  recipe: Recipe;
}

interface AuthorType {
  id?: string;
  name: string;
  image: string | null;
  username: string | null;
}

export const BasicCard = ({ recipe }: RecipeCardProps) => {
  const hasRating = (recipe.ratingCount ?? 0) > 0;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Link
      href={`/recipe/${recipe.slug}`}
      className="group flex w-[280px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-[#006C5E]/50 sm:w-[300px] lg:w-[320px] dark:border-white/10 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/40"
    >
      {/* Image Container */}
      <div className="relative m-3 aspect-[4/3] w-[calc(100%_-_1.5rem)] overflow-hidden rounded-xl bg-slate-100 dark:bg-white/[0.06]">
        {recipe.mainImage && !imageFailed ? (
          <Image
            src={recipe.mainImage}
            fill
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
            style={{ objectFit: 'cover' }}
            alt={recipe.name}
            loader={imageLoader}
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Recipe photo coming soon
          </div>
        )}
      </div>

      <div className="w-full px-2 pb-4 lg:px-5">
        {/* Title */}
        <div className="mb-2 line-clamp-2 text-lg font-semibold leading-snug text-[#263632] dark:text-gray-100">
          {recipe.name}
        </div>

        {/* Meta Info */}
        <div className="space-y-0.5 px-1 font-sans text-[12px] text-[#7E7E7E] lg:text-sm dark:text-gray-500">
          <div>Total time: {recipe.totalTimeReq} mins</div>
          <div>Yield: {recipe.yield} serves</div>
          <div>Diet: {recipe.diet}</div>
        </div>

        {/* Footer: Author & Rating */}
        <div className="mt-2 flex w-full items-center justify-between py-1 lg:py-4">
          {/* Author */}
          <div className="flex items-center gap-1 lg:gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-gray-200 lg:h-10 lg:w-10 dark:bg-white/10">
              {recipe.author?.image ? (
                <Image
                  src={recipe.author.image}
                  fill
                  alt={recipe.author.name || 'Chef'}
                  loader={imageLoader}
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500 dark:text-gray-500">
                  👨‍🍳
                </div>
              )}
            </div>
            <div className="font-sans text-sm font-medium text-gray-800 lg:h-5 lg:text-base dark:text-gray-200">
              {recipe.author?.name}
            </div>
          </div>

          {/* Rating Badge */}
          {hasRating && recipe.ratings != null && (
            <div className="flex items-center justify-center gap-2 rounded-full bg-[#006C5E] px-3 py-1.5 text-xs font-bold text-white transition-colors dark:bg-[#4ADE80] dark:text-[#0d1f1c]">
              <FaStar />
              <span>{formatters.rating(recipe.ratings)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const href = `/recipe/${recipe.slug}`;
  const hasRating = (recipe.ratingCount ?? 0) > 0;

  return (
    <Link href={href} className="group relative block h-full w-[280px] shrink-0 md:w-[350px]">
      <div className="flex h-full flex-col overflow-hidden rounded-4xl border border-gray-200 bg-white transition-colors hover:border-[#006C5E]/50 dark:border-white/10 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/40">
        {/* --- IMAGE SECTION --- */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100 dark:bg-white/5">
          {recipe.mainImage ? (
            <Image
              src={recipe.mainImage}
              alt={recipe.name}
              fill
              loader={imageLoader}
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-600">
              No Image
            </div>
          )}

          {/* Rating Badge */}
          {hasRating && recipe.ratings != null && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-gray-800 dark:bg-[#0d1f1c]/90 dark:text-white">
              <FaStar className="text-xs text-yellow-400" />
              <span className="text-xs font-bold">{formatters.rating(recipe.ratings)}</span>
            </div>
          )}

          {/* Diet Badge */}
          {recipe.diet && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-[#006C5E] px-3 py-1.5 text-white dark:text-white">
              <FaLeaf className="text-xs" />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {recipe.diet.split(',')[0]}
              </span>
            </div>
          )}
        </div>

        {/* --- CONTENT SECTION --- */}
        <div className="flex grow flex-col gap-3 p-5">
          <h3 className="line-clamp-2 text-lg leading-snug font-bold text-gray-900 dark:text-white">
            {recipe.name}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-4 dark:border-white/10">
            {/* Time */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-500">
              <div className="rounded-full bg-gray-50 p-1.5 text-[#006C5E] dark:bg-white/5 dark:text-[#4ADE80]">
                <FaRegClock />
              </div>
              <span>{recipe.totalTimeReq}m</span>
            </div>

            {/* Servings */}
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-500">
              <div className="rounded-full bg-gray-50 p-1.5 text-[#006C5E] dark:bg-white/5 dark:text-[#4ADE80]">
                <FaUserFriends />
              </div>
              <span>{recipe.yield} Serves</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const RecipeCardSkeleton = () => {
  return (
    <div className="w-[280px] shrink-0 overflow-hidden rounded-4xl border border-gray-200 bg-white md:w-[350px] dark:border-white/10 dark:bg-[#152a26]">
      <div className="relative aspect-4/3 animate-pulse bg-gray-200 dark:bg-white/5">
        <div className="absolute top-4 right-4 h-6 w-12 rounded-full bg-white/50 dark:bg-white/10" />
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="h-6 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-white/5" />
        <div className="h-6 w-1/2 animate-pulse rounded-lg bg-gray-200 dark:bg-white/5" />
        <div className="mt-4 flex justify-between">
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-gray-100 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
};
