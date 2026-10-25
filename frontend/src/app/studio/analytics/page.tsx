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
    <div>
      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-semibold text-[#101827] dark:text-white">Analytics</h2>
        <p className="text-gray-500 dark:text-gray-400">
          See how people respond to your recipes.
        </p>
      </header>

      <AnalyticsClient content={analytics?.recipes || []} />
    </div>
  );
}
