'use client';

import { Eye, Heart, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { StudioAnalytics } from '@/lib/api/studioClient';
import imageLoader from '@/lib/loader';

type ContentType = 'recipes' | 'stories';

export default function AnalyticsClient({ analytics, contentType, loading, onContentTypeChange, onLoadMore }: {
  analytics: StudioAnalytics | null;
  contentType: ContentType;
  loading: boolean;
  onContentTypeChange: (type: ContentType) => void;
  onLoadMore: () => void;
}) {
  const label = contentType === 'recipes' ? 'recipes' : 'stories';
  const items = analytics?.items || [];

  return (
    <div>
      <div className="mb-6 inline-flex rounded-full border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#0d1f1c]" role="tablist" aria-label="Analytics content type">
        {(['recipes', 'stories'] as const).map((type) => <button key={type} type="button" role="tab" aria-selected={contentType === type} onClick={() => onContentTypeChange(type)} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${contentType === type ? 'bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-black' : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'}`}>{type === 'recipes' ? 'Recipes' : 'Stories'}</button>)}
      </div>
      <section className="grid gap-3 sm:grid-cols-2">
        <Metric label={`Views on your published ${label}`} value={analytics?.totalViews || 0} icon={<Eye className="h-5 w-5" />} />
        <Metric label={`Likes on your published ${label}`} value={analytics?.totalLikes || 0} icon={<Heart className="h-5 w-5" />} />
      </section>
      <section className="mt-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-white/10 lg:px-8"><h3 className="text-xl font-semibold text-[#101827] dark:text-white">{contentType === 'recipes' ? 'Recipe' : 'Story'} performance</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Views and likes for all your published {label}, including items with no activity yet.</p></div>
        {items.length ? <div className="divide-y divide-gray-100 dark:divide-white/10">{items.map((item) => <article key={item.id} className="flex items-center gap-4 px-6 py-4 lg:px-8"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f1f7f6] dark:bg-white/10">{item.image ? <Image src={item.image} fill alt="" className="object-cover" loader={imageLoader} sizes="56px" /> : null}</div><h4 className="min-w-0 flex-1 truncate font-semibold text-[#101827] dark:text-white">{item.title}</h4><div className="flex shrink-0 gap-4 text-sm text-gray-500 dark:text-gray-400"><span className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {item.views.toLocaleString()}</span><span className="flex items-center gap-1.5"><Heart className="h-4 w-4" /> {item.likes.toLocaleString()}</span></div></article>)}</div> : <div className="px-6 py-14 text-center"><p className="font-semibold text-[#101827] dark:text-white">No published {label} yet</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Publish a {contentType === 'recipes' ? 'recipe' : 'story'} to start seeing its performance here.</p></div>}
        {analytics?.hasMore ? <div className="border-t border-gray-100 p-4 text-center dark:border-white/10"><button type="button" onClick={onLoadMore} disabled={loading} className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#006C5E]/40 hover:text-[#006C5E] disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80]/40 dark:hover:text-[#4ADE80]">{loading ? 'Loading…' : 'Load more'}</button></div> : null}
        {loading && !items.length ? <div className="flex justify-center px-6 py-10 text-gray-500"><LoaderCircle className="h-5 w-5 animate-spin" /></div> : null}
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]"><div className="flex items-center gap-3 text-[#006C5E] dark:text-[#4ADE80]">{icon}<p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p></div><p className="mt-5 text-3xl font-semibold text-[#101827] dark:text-white">{value.toLocaleString()}</p></div>;
}
