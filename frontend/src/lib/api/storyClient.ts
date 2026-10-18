import { ApiClientError, getAccessToken } from './authClient';

const API_URL =
  typeof window === 'undefined'
    ? process.env.SERVER_API_URL || process.env.NEXT_SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ApiError = { message?: string | string[]; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message[0] : body.message || body.error || 'Something went wrong';
    throw new ApiClientError(message, response.status);
  }
  return body;
}

export type StoryMediaInput = {
  publicId: string;
  url: string;
  resourceType: 'IMAGE' | 'VIDEO' | 'RAW';
  kind: 'COVER' | 'IMAGE' | 'VIDEO';
  position?: number;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
};

export type StoryBlockInput = {
  type: 'paragraph' | 'headline' | 'quote' | 'image' | 'video' | 'link' | 'codeblock' | 'divider';
  content: Record<string, unknown>;
};

export type UpdateStoryInput = {
  expectedVersion?: number;
  title?: string;
  shortDesc?: string | null;
  coverImage?: string | null;
  coverImagePublicId?: string | null;
  tags?: string[];
  content?: StoryBlockInput[];
  media?: StoryMediaInput[];
};

export type Story = {
  id: string;
  clientDraftId?: string | null;
  version: number;
  slug?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
  title: string;
  shortDesc: string;
  coverImage?: string | null;
  coverImagePublicId?: string | null;
  tags: string[];
  likes?: number;
  views?: number;
  commentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  content?: Array<{ id: string; type: StoryBlockInput['type']; content: Record<string, unknown>; position: number }>;
  media?: StoryMediaInput[];
  author?: { id: string; name: string; username?: string | null; image?: string | null };
};

export type StoryViewerState = {
  liked: boolean;
  bookmarked: boolean;
  likes: number;
  views: number;
};

export type StoryComment = {
  id: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt?: string;
  author: { id: string; name?: string | null; username?: string | null; image?: string | null };
  replies: StoryComment[];
};

export const storyClient = {
  createDraft(clientDraftId: string, title?: string) {
    return request<{ story: Story }>('/stories/drafts', { method: 'POST', body: JSON.stringify({ clientDraftId, title }) });
  },
  update(id: string, data: UpdateStoryInput) {
    return request<{ story: Story }>(`/stories/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  publish(id: string) {
    return request<{ story: Story }>(`/stories/${encodeURIComponent(id)}/publish`, { method: 'POST', body: '{}' });
  },
  list(params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]));
    return request<{ stories: Story[]; page: number; limit: number; total: number; hasMore: boolean }>(`/stories?${query}`, { method: 'GET' });
  },
  getPublic(slug: string) { return request<{ story: Story }>(`/stories/${encodeURIComponent(slug)}`, { method: 'GET' }); },
  getOwner(id: string) { return request<{ story: Story }>(`/stories/${encodeURIComponent(id)}/manage`, { method: 'GET' }); },
  like(id: string) { return request<StoryViewerState>(`/stories/${encodeURIComponent(id)}/like`, { method: 'POST', body: '{}' }); },
  unlike(id: string) { return request<StoryViewerState>(`/stories/${encodeURIComponent(id)}/like`, { method: 'DELETE' }); },
  bookmark(id: string) { return request<StoryViewerState>(`/stories/${encodeURIComponent(id)}/bookmark`, { method: 'POST', body: '{}' }); },
  unbookmark(id: string) { return request<StoryViewerState>(`/stories/${encodeURIComponent(id)}/bookmark`, { method: 'DELETE' }); },
  viewerState(id: string) { return request<StoryViewerState>(`/stories/${encodeURIComponent(id)}/viewer`, { method: 'GET' }); },
  recordView(id: string) { return request(`/stories/${encodeURIComponent(id)}/views`, { method: 'POST', body: '{}' }); },
  listComments(id: string) { return request<{ comments: StoryComment[] }>(`/stories/${encodeURIComponent(id)}/comments`, { method: 'GET' }); },
  createComment(id: string, input: { content: string; parentId?: string }) {
    return request<{ comment: StoryComment }>(`/stories/${encodeURIComponent(id)}/comments`, { method: 'POST', body: JSON.stringify(input) });
  },
  deleteComment(id: string, commentId: string) {
    return request(`/stories/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`, { method: 'DELETE' });
  },
};
