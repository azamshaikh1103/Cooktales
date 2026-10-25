import { ApiClientError, authenticatedFetch } from './authClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ApiErrorPayload = { message?: string | string[]; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
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
  stats: {
    points: number;
    recipes: number;
    stories: number;
    followers: number;
    totalViews: number;
    totalLikes: number;
  };
  latestRecipe: {
    id: string;
    slug: string | null;
    name: string;
    mainImage: string;
    views: number;
    likes: number;
    totalTimeReq: number | null;
    calories: number | null;
    createdAt: string;
  } | null;
  latestStory: {
    id: string;
    slug: string | null;
    title: string;
    coverImage: string | null;
    views: number;
    likes: number;
    shortDesc: string;
    createdAt: string;
  } | null;
};

export type StudioAnalytics = {
  type: 'recipes' | 'stories';
  items: Array<{ id: string; title: string; image: string | null; views: number; likes: number }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalViews: number;
  totalLikes: number;
};

export type CreatorEarnings = {
  wallet: { availableUsd: string; lifetimeEarnedUsd: string };
  payoutMethods: Array<{
    id: string;
    method: 'UPI' | 'PAYPAL' | 'WISE';
    legalName: string;
    country: string;
    maskedDestination: string;
    isPrimary: boolean;
  }>;
  earnings: Array<{
    id: string;
    period: string;
    amountUsd: string;
    recipeViews: number;
    storyViews: number;
  }>;
  payouts: Array<{
    id: string;
    grossUsd: string;
    feeUsd: string;
    netUsd: string;
    status: string;
    reference: string | null;
    paidAt: string | null;
    method: 'UPI' | 'PAYPAL' | 'WISE';
  }>;
};

export const studioClient = {
  dashboard: () => request<StudioDashboard>('/studio/dashboard'),
  analytics: (params: { type: 'recipes' | 'stories'; page?: number; limit?: number }) => {
    const query = new URLSearchParams({
      type: params.type,
      page: String(params.page || 1),
      limit: String(params.limit || 20),
    });
    return request<StudioAnalytics>(`/studio/analytics?${query.toString()}`);
  },
  earnings: () => request<CreatorEarnings>('/studio/earnings'),
  addPayoutMethod: (input: {
    method: 'UPI' | 'PAYPAL' | 'WISE';
    legalName: string;
    country: string;
    destination: string;
    primary: boolean;
  }) =>
    request<{ payoutMethod: CreatorEarnings['payoutMethods'][number] }>(
      '/studio/earnings/payout-methods',
      { method: 'POST', body: JSON.stringify(input) }
    ),
  setPrimaryPayoutMethod: (id: string) =>
    request<{ message: string }>(
      `/studio/earnings/payout-methods/${encodeURIComponent(id)}/primary`,
      { method: 'PATCH', body: '{}' }
    ),
};
