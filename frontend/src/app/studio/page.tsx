'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { FaEye, FaHeart, FaUsers } from 'react-icons/fa';
import { type StudioDashboard, studioClient } from '@/lib/api/studioClient';
import { useAuth } from '@/lib/auth/AuthContext';
import imageLoader from '@/lib/loader';

export default function StudioDashboardPage() {
  const { status } = useAuth();
  const [dashboard, setDashboard] = useState<StudioDashboard | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void studioClient.dashboard().then(setDashboard).catch(() => setDashboard(null));
  }, [status]);

  const stats = dashboard?.stats;
  const latestRecipe = dashboard?.latestRecipe || null;
  const latestStory = dashboard?.latestStory || null;

  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-semibold text-[#101827] dark:text-white">Overview</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Real performance across your published recipes and stories.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={<FaEye />} label="Total views" value={stats?.totalViews || 0} />
        <StatCard icon={<FaHeart />} label="Total likes" value={stats?.totalLikes || 0} />
        <StatCard icon={<FaUsers />} label="Followers" value={stats?.followers || 0} />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5 sm:grid-cols-2">
          <LatestCard
            title="Latest recipe"
            item={latestRecipe}
            image={latestRecipe?.mainImage || null}
            href={latestRecipe?.slug ? `/recipe/${latestRecipe.slug}` : null}
            emptyTitle="No recipes yet"
            emptyText="Your first published recipe will appear here."
          />
          <LatestCard
            title="Latest story"
            item={latestStory}
            image={latestStory?.coverImage || null}
            href={latestStory?.slug ? `/stories/${latestStory.slug}` : null}
            emptyTitle="No stories yet"
            emptyText="Your first published story will appear here."
          />
        </div>

        <aside className="rounded-[28px] border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#0d1f1c]">
          <h3 className="text-xl font-semibold text-[#101827] dark:text-white">Create</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Share a recipe or a story with the community.
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/new-recipe"
              className="flex items-center justify-center rounded-full bg-[#006C5E] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#35c96b]"
            >
              New recipe
            </Link>
            <Link
              href="/new-story"
              className="flex items-center justify-center rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#006C5E]/40 hover:text-[#006C5E] dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80]/40 dark:hover:text-[#4ADE80]"
            >
              Write a story
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="flex items-center gap-3 text-[#006C5E] dark:text-[#4ADE80]">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f7f6] dark:bg-white/10">
          {icon}
        </span>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="mt-5 text-3xl font-semibold text-[#101827] dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function LatestCard({
  title,
  item,
  image,
  href,
  emptyTitle,
  emptyText,
}: {
  title: string;
  item: StudioDashboard['latestRecipe'] | StudioDashboard['latestStory'];
  image: string | null;
  href: string | null;
  emptyTitle: string;
  emptyText: string;
}) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="flex items-center justify-between px-6 pt-6">
        <h3 className="text-xl font-semibold text-[#101827] dark:text-white">{title}</h3>
        {href ? (
          <Link href={href} className="text-sm font-semibold text-[#006C5E] hover:underline dark:text-[#4ADE80]">
            View
          </Link>
        ) : null}
      </div>

      {item ? (
        <div className="p-6">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-[#f1f7f6] dark:bg-white/5">
            {image ? <Image src={image} fill alt="" className="object-cover" loader={imageLoader} sizes="(min-width: 640px) 350px, 100vw" /> : null}
          </div>
          <h4 className="mt-5 truncate text-lg font-semibold text-[#101827] dark:text-white">
            {'name' in item ? item.name : item.title}
          </h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Created {new Date(item.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Detail label="Views" value={item.views} />
            <Detail label="Likes" value={item.likes} />
          </div>
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <p className="font-semibold text-[#101827] dark:text-white">{emptyTitle}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#fafafa] px-4 py-3 dark:bg-white/5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 font-semibold text-[#101827] dark:text-white">{value.toLocaleString()}</p>
    </div>
  );
}
