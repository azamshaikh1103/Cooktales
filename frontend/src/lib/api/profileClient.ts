import { ApiClientError, authenticatedFetch } from './authClient';

const API_URL =
  typeof window === 'undefined'
    ? process.env.SERVER_API_URL ||
      process.env.NEXT_SERVER_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000/api/v1'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export type ProfileRecipe = {
  id: string;
  slug?: string | null;
  name: string;
  mainImage: string | null;
  totalTimeReq: number | null;
  yield: number | null;
  diet: string | null;
  ratings: number | null;
  createdAt?: string;
};

export type ProfileListUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  about: string | null;
  isPro: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type ProfileStory = {
  id: string;
  slug?: string | null;
  title: string;
  coverImage: string | null;
  shortDesc: string | null;
  likes?: number;
  dislikes?: number;
  createdAt?: string;
};

export type ProfileBookmark = {
  id: string;
  recipe?: ProfileRecipe | null;
  story?: ProfileStory | null;
  createdAt?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    cache: init?.cache,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : payload.message || payload.error || 'Something went wrong';
    throw new ApiClientError(message, response.status);
  }

  return payload;
}

export type PublicProfile = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  bannerImage: string | null;
  about: string | null;
  location: string | null;
  mission: string | null;
  signature: string | null;
  website: string | null;
  socialLinks?: { instagram?: string; twitter?: string; youtube?: string };
  isPro: boolean;
  plan: string;
  createdAt: string;
  _count: {
    recipes: number;
    stories: number;
    followers: number;
    following: number;
  };
  recipes: ProfileRecipe[];
  stories: ProfileStory[];
};

export type ViewerProfileContext = {
  profileId: string;
  isOwnProfile: boolean;
  isFollowing: boolean;
  savedCount: number;
};

export type PrivateProfile = PublicProfile & {
  email: string;
  imagePublicId: string | null;
  bannerImagePublicId: string | null;
  role: string;
  status: string;
  planStatus: string;
  planEndsAt: string | null;
  measurementSystem: string;
  language: string;
  timezone: string;
  dietaryPreferences: string | null;
  appSettings?: Record<string, unknown>;
  notificationPreferences?: Record<string, unknown>;
  updatedAt: string;
};

export type UpdateProfileInput = Partial<{
  name: string;
  username: string;
  about: string;
  location: string;
  signature: string;
  mission: string;
  image: string | null;
  imagePublicId: string | null;
  bannerImage: string | null;
  bannerImagePublicId: string | null;
  website: string;
  socialLinks: Record<string, string>;
}>;

export const profileClient = {
  getPublicProfile(handle: string, init?: RequestInit) {
    return request<{
      profile: PublicProfile;
      canonicalHandle: string;
      redirectedFrom: string | null;
    }>(`/profiles/${encodeURIComponent(handle)}`, init);
  },

  getProfileRecipes(handle: string, page = 1, limit = 12) {
    return request<PaginatedResponse<ProfileRecipe>>(
      `/profiles/${encodeURIComponent(handle)}/recipes?page=${page}&limit=${limit}`
    );
  },

  getProfileStories(handle: string, page = 1, limit = 12) {
    return request<PaginatedResponse<ProfileStory>>(
      `/profiles/${encodeURIComponent(handle)}/stories?page=${page}&limit=${limit}`
    );
  },

  getFollowers(handle: string, page = 1, limit = 12) {
    return request<PaginatedResponse<ProfileListUser>>(
      `/profiles/${encodeURIComponent(handle)}/followers?page=${page}&limit=${limit}`
    );
  },

  getFollowing(handle: string, page = 1, limit = 12) {
    return request<PaginatedResponse<ProfileListUser>>(
      `/profiles/${encodeURIComponent(handle)}/following?page=${page}&limit=${limit}`
    );
  },

  getViewerProfileContext(handle: string) {
    return request<ViewerProfileContext>(`/profiles/${encodeURIComponent(handle)}/viewer`);
  },

  getBookmarks(
    type: 'all' | 'recipes' | 'stories' = 'all',
    page = 1,
    limit = 12,
  ) {
    const query = new URLSearchParams({ type, page: String(page), limit: String(limit) });
    return request<PaginatedResponse<ProfileBookmark>>(`/profile/bookmarks?${query.toString()}`);
  },

  follow(userId: string) {
    return request<{ isFollowing: true }>(`/profiles/${encodeURIComponent(userId)}/follow`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  unfollow(userId: string) {
    return request<{ isFollowing: false }>(`/profiles/${encodeURIComponent(userId)}/follow`, {
      method: 'DELETE',
    });
  },

  me() {
    return request<{ user: PrivateProfile }>('/profile/me');
  },

  checkUsernameAvailability(username: string) {
    return request<{ available: boolean; message?: string }>(
      `/profile/username-availability?username=${encodeURIComponent(username)}`
    );
  },

  updateMe(input: UpdateProfileInput) {
    return request<{ user: PrivateProfile }>('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  updatePreferences(input: Record<string, unknown>) {
    return request<{ user: PrivateProfile }>('/profile/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  updateNotifications(input: Record<string, boolean>) {
    return request<{ user: PrivateProfile }>('/profile/notifications', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  changePassword(input: { currentPassword: string; newPassword: string }) {
    return request<{ message: string }>('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  exportData() {
    return request<{ data: unknown }>('/profile/export');
  },

  deactivateMe() {
    return request<{ message: string }>('/profile/me', {
      method: 'DELETE',
    });
  },
};
