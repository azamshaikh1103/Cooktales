'use client';

import { useCallback, useEffect, useState } from 'react';
import AnalyticsClient from './AnalyticsClient';
import { studioClient, type StudioAnalytics } from '@/lib/api/studioClient';
import { useAuth } from '@/lib/auth/AuthContext';

type ContentType = 'recipes' | 'stories';

export default function AnalyticsPage() {
  const { status } = useAuth();
  const [analytics, setAnalytics] = useState<StudioAnalytics | null>(null);
  const [contentType, setContentType] = useState<ContentType>('recipes');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (page: number, append = false) => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      const next = await studioClient.analytics({ type: contentType, page });
      setAnalytics((current) => append && current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch { setAnalytics(null); } finally { setLoading(false); }
  }, [contentType, status]);

  useEffect(() => { void load(1); }, [load]);

  return (
    <div>
      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-semibold text-[#101827] dark:text-white">Analytics</h2>
        <p className="text-gray-500 dark:text-gray-400">
          See how people respond to your published recipes and stories.
        </p>
      </header>

      <AnalyticsClient analytics={analytics} contentType={contentType} loading={loading} onContentTypeChange={setContentType} onLoadMore={() => analytics && void load(analytics.page + 1, true)} />
    </div>
  );
}
