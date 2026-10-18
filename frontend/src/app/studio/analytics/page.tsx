'use client';

import { useEffect, useState } from 'react';
import AnalyticsClient from './AnalyticsClient';
import { studioClient, type StudioAnalytics } from '@/lib/api/studioClient';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AnalyticsPage() {
  const { status } = useAuth();
  const [analytics, setAnalytics] = useState<StudioAnalytics | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void studioClient.analytics().then(setAnalytics).catch(() => setAnalytics(null));
  }, [status]);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-12">
      <header className="mb-12">
        <h1 className="mb-2 text-3xl font-black lg:text-4xl">Audience Insights</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Real-time performance data for your kitchen.
        </p>
      </header>

      {/* Pass data to the interactive client */}
      <AnalyticsClient user={analytics?.user || { isPro: false }} content={analytics?.recipes || []} />
    </div>
  );
}
