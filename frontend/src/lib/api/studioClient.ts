import { ApiClientError, authenticatedFetch } from './authClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ApiErrorPayload = { message?: string | string[]; error?: string };

async function request<T>(path: string): Promise<T> {
  const response = await authenticatedFetch(`${API_URL}${path}`);
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : payload.message || payload.error || 'Studio data is unavailable right now.';
    throw new ApiClientError(message, response.status);
  }
  return payload;
}

export type StudioDashboard = {
  stats: { points: number; recipes: number; followers: number; totalViews: number; totalLikes: number };
  latestRecipe: {
    id: string;
    slug: string | null;
    name: string;
    views: number;
    likes: number;
    totalTimeReq: number | null;
    calories: number | null;
  } | null;
};

export type StudioAnalytics = {
  user: { isPro: boolean };
  recipes: Array<{ id: string; name: string; mainImage: string; views: number; likes: number }>;
};

export const studioClient = {
  dashboard: () => request<StudioDashboard>('/studio/dashboard'),
  analytics: () => request<StudioAnalytics>('/studio/analytics'),
};
