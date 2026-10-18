'use client';

import { useEffect, useState } from 'react';
import { FaEye, FaHeart, FaArrowUp, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Link from 'next/link';
import { studioClient, type StudioDashboard } from '@/lib/api/studioClient';
import { useAuth } from '@/lib/auth/AuthContext';

export default function StudioDashboard() {
  const { status } = useAuth();
  const [dashboard, setDashboard] = useState<StudioDashboard | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void studioClient.dashboard().then(setDashboard).catch(() => setDashboard(null));
  }, [status]);

  const stats = dashboard?.stats;
  const latestRecipe = dashboard?.latestRecipe;

  return (
    <div className="mx-auto max-w-7xl p-6 lg:p-12">
      <header className="mb-12">
        <h1 className="mb-2 text-3xl font-black lg:text-4xl">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Here is what's happening in your kitchen today.
        </p>
      </header>

      {/* --- STATS GRID --- */}
      <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value={(stats?.totalViews || 0).toLocaleString()}
          icon={<FaEye />}
          trend="+12%"
        />
        <StatCard
          title="Total Likes"
          value={(stats?.totalLikes || 0).toLocaleString()}
          icon={<FaHeart />}
          trend="+5%"
        />
        <StatCard title="Followers" value={stats?.followers || 0} icon="👥" trend="+2" />
        <StatCard title="Earnings" value="$0.00" icon="$" sub="Setup Stripe" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* --- RECIPE HEALTH CHECK (Optimization) --- */}
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2 dark:border-white/5 dark:bg-[#0d1f1c]">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold">Latest Recipe Performance</h3>
            {latestRecipe && (
              <Link
                href={`/recipe/${latestRecipe.slug || latestRecipe.id}`}
                className="text-sm text-[#006C5E] hover:underline"
              >
                View Recipe
              </Link>
            )}
          </div>

          {latestRecipe ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="mb-1 text-2xl font-black">{latestRecipe.name}</h4>
                  <p className="text-sm text-gray-500">Posted just now</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-[#006C5E]">
                    92<span className="text-lg text-gray-400">/100</span>
                  </div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                    SEO Score
                  </p>
                </div>
              </div>

              {/* Optimization Checklist */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <HealthItem label="High-Res Image" passed={true} />
                <HealthItem label="Engaging Description" passed={true} />
                <HealthItem
                  label="Nutrition Data"
                  passed={!!latestRecipe.calories}
                  warning={!latestRecipe.calories}
                />
                <HealthItem label="Video Guide" passed={false} warning={true} />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-900/20">
                <FaExclamationCircle className="mt-1 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
                    Optimization Tip
                  </p>
                  <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
                    Adding a video guide increases retention by 40%. Consider uploading a short
                    clip.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">No recipes yet. Start cooking!</div>
          )}
        </div>

        {/* --- QUICK ACTIONS --- */}
        <div className="relative overflow-hidden rounded-3xl bg-[#006C5E] p-8 text-white shadow-xl shadow-[#006C5E]/20">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
          <h3 className="relative z-10 mb-6 text-xl font-bold">Quick Actions</h3>
          <div className="relative z-10 space-y-3">
            <Link
              href="/new-recipe"
              className="block w-full rounded-xl bg-white py-3 text-center font-bold text-[#006C5E] shadow-md transition-transform hover:scale-105"
            >
              + New Recipe
            </Link>
            <Link
              href="/new-story"
              className="block w-full rounded-xl border border-white/10 bg-[#005a4e] py-3 text-center font-bold text-white transition-colors hover:bg-[#004d42]"
            >
              Write Story
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---
const StatCard = ({ title, value, icon, trend, sub }: any) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#0d1f1c]">
    <div className="mb-4 flex items-start justify-between">
      <div className="rounded-lg bg-gray-50 p-2 text-gray-500 dark:bg-white/5 dark:text-gray-400">
        {icon}
      </div>
      {trend && (
        <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-500 dark:bg-green-900/20">
          {trend}
        </span>
      )}
    </div>
    <h4 className="text-3xl font-black text-gray-900 dark:text-white">{value}</h4>
    <p className="mt-1 text-xs font-bold tracking-wider text-gray-400 uppercase">{title}</p>
    {sub && (
      <p className="mt-2 cursor-pointer text-xs font-bold text-[#006C5E] hover:underline">
        {sub} &rarr;
      </p>
    )}
  </div>
);

const HealthItem = ({ label, passed, warning }: any) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/5 dark:bg-white/5">
    {passed && !warning ? (
      <FaCheckCircle className="text-green-500" />
    ) : (
      <FaExclamationCircle className="text-amber-500" />
    )}
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
  </div>
);
