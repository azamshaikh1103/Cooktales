const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string;
  surveyCompleted?: boolean;
};

type AuthResponse = {
  success?: boolean;
  message?: string;
  accessToken?: string;
  user?: AuthUser;
};

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponse> | null = null;

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

export class ApiClientError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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

function refreshSession() {
  if (refreshPromise) return refreshPromise;

  const pendingRefresh = request<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  refreshPromise = pendingRefresh;
  void pendingRefresh.then(() => {
    if (refreshPromise === pendingRefresh) refreshPromise = null;
  }, () => {
    if (refreshPromise === pendingRefresh) refreshPromise = null;
  });

  return pendingRefresh;
}

export const authClient = {
  signup(input: {
    name: string;
    email: string;
    password: string;
    turnstileToken?: string;
  }) {
    return request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: { email: string; password: string; turnstileToken?: string }) {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  forgotPassword(input: { email: string; turnstileToken?: string }) {
    return request<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  resetPassword(input: { email: string; token: string; password: string }) {
    return request<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  resendVerification(input: { email: string; turnstileToken?: string }) {
    return request<{ success: boolean; message?: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifyEmail(input: { email: string; code: string }) {
    return request<{ success: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getGoogleAuthUrl() {
    return request<{ url: string }>('/auth/google');
  },

  me() {
    return request<{ user: AuthUser }>('/auth/me');
  },

  refresh() {
    return refreshSession();
  },

  logout() {
    return request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

export function persistAuthResponse(response: AuthResponse) {
  accessToken = response.accessToken || null;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cooktale-auth-changed'));
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const send = (token: string | null) => {
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, { ...init, credentials: 'include', headers });
  };

  const response = await send(accessToken);
  if (response.status !== 401 || !accessToken) return response;

  try {
    const refreshed = await refreshSession();
    persistAuthResponse(refreshed);
    return refreshed.accessToken ? await send(refreshed.accessToken) : response;
  } catch {
    clearPersistedAuth();
    return response;
  }
}

export function clearPersistedAuth() {
  accessToken = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cooktale-auth-changed'));
  }
}
