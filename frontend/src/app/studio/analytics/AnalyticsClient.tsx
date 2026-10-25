'use client';

import { Eye, Heart } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import imageLoader from '@/lib/loader';

type RecipePerformance = {
  id: string;
  name: string;
  mainImage: string;
  views: number;
  likes: number;
};

export default function AnalyticsClient({ content }: { content: RecipePerformance[] }) {
  const totalViews = content.reduce((total, recipe) => total + recipe.views, 0);
  const totalLikes = content.reduce((total, recipe) => total + recipe.likes, 0);

  return (
    <div>
      <section className="grid gap-3 sm:grid-cols-2">
        <Metric label="Views on your latest recipes" value={totalViews} icon={<Eye className="h-5 w-5" />} />
        <Metric label="Likes on your latest recipes" value={totalLikes} icon={<Heart className="h-5 w-5" />} />
      </section>

      <section className="mt-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-white/10 lg:px-8">
          <h3 className="text-xl font-semibold text-[#101827] dark:text-white">Recipe performance</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Views and likes for your five most-viewed recipes.
          </p>
        </div>

        {content.length ? (
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {content.map((recipe) => (
              <article key={recipe.id} className="flex items-center gap-4 px-6 py-4 lg:px-8">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f1f7f6] dark:bg-white/10">
                  {recipe.mainImage ? (
                    <Image
                      src={recipe.mainImage}
                      fill
                      alt=""
                      className="object-cover"
                      loader={imageLoader}
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <h4 className="min-w-0 flex-1 truncate font-semibold text-[#101827] dark:text-white">
                  {recipe.name}
                </h4>
                <div className="flex shrink-0 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" /> {recipe.views.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" /> {recipe.likes.toLocaleString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold text-[#101827] dark:text-white">No recipe data yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Publish a recipe to start seeing its performance here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="flex items-center gap-3 text-[#006C5E] dark:text-[#4ADE80]">
        {icon}
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="mt-5 text-3xl font-semibold text-[#101827] dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
