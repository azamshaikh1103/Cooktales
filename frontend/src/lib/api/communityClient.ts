import { ApiClientError, getAccessToken } from './authClient';

const API_URL = typeof window === 'undefined'
  ? process.env.SERVER_API_URL || process.env.NEXT_SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ApiError = { message?: string | string[]; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message || body.error || 'Something went wrong';
    throw new ApiClientError(message, response.status);
  }
  return body;
}

export type DiscussionAttachment = { type: 'image' | 'recipe' | 'story'; id: string; publicId?: string };
export type CommunityUser = { id: string; name: string; username?: string | null; image?: string | null; isPro: boolean; points: number };
export type Comment = { id: string; content: string; createdAt: string; author: CommunityUser; likes: { userId: string }[]; replies: Comment[] };
export type Discussion = { id: string; slug: string; title: string; content: string; category: string; createdAt: string; views: number; author: CommunityUser; _count: { likes: number; comments: number }; comments?: Comment[] };
export type Challenge = { id: string; title: string; description: string; coverImage?: string | null; prize?: string | null; startDate: string; endDate: string; isActive: boolean; _count: { entries: number }; entries?: Array<{ id: string; recipe: { id: string; slug?: string | null; name: string; mainImage: string; likes: number }; user: CommunityUser }> };
export type CommunitySnapshot = { topDiscussions: Discussion[]; activeChallenge: Challenge | null; topChefs: CommunityUser[]; topRecipesToday: number; totalChefs: number; totalDiscussions: number };
export type DiscussionListResponse = { discussions: Discussion[]; page: number; limit: number; total: number; hasMore: boolean };
export type DiscussionResponse = { discussion: Discussion; attachments: { recipes: unknown[]; stories: unknown[] } };
export type LeaderboardResponse = { users: CommunityUser[]; page: number; limit: number; total: number; hasMore: boolean };

export const communityClient = {
  snapshot: () => request<CommunitySnapshot>('/community/snapshot', { cache: 'no-store' }),
  listDiscussions: (params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
    return request<DiscussionListResponse>(`/community/discussions?${query}`, { method: 'GET' });
  },
  getDiscussion: (slug: string) => request<DiscussionResponse>(`/community/discussions/${encodeURIComponent(slug)}`, { cache: 'no-store' }),
  leaderboard: () => request<LeaderboardResponse>('/community/leaderboard', { method: 'GET' }),
  challenges: () => request<{ challenges: Challenge[] }>('/community/challenges', { cache: 'no-store' }),
  getChallenge: (id: string) => request<{ challenge: Challenge }>(`/community/challenges/${encodeURIComponent(id)}`, { cache: 'no-store' }),
  createDiscussion: (input: { title: string; content: string; category: string; attachments?: DiscussionAttachment[] }) => request<{ discussion: Discussion }>('/community/discussions', { method: 'POST', body: JSON.stringify(input) }),
  createComment: (discussionId: string, input: { content: string; parentId?: string }) => request<{ comment: Comment }>(`/community/discussions/${encodeURIComponent(discussionId)}/comments`, { method: 'POST', body: JSON.stringify(input) }),
  like: (discussionId: string) => request<{ likes: number; liked: boolean }>(`/community/discussions/${encodeURIComponent(discussionId)}/like`, { method: 'POST', body: '{}' }),
  unlike: (discussionId: string) => request<{ likes: number; liked: boolean }>(`/community/discussions/${encodeURIComponent(discussionId)}/like`, { method: 'DELETE' }),
};
