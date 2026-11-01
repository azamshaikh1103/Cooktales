const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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
let authChannel: BroadcastChannel | null = null;
let latestSharedRefresh: { receivedAt: number; response: AuthResponse } | null =
	null;

const AUTH_CHANNEL_NAME = "cooktale-auth";
const REFRESH_LOCK_NAME = "cooktale-auth-refresh";
const MAX_REFRESH_RETRIES = 1;
const MAX_RETRY_AFTER_MS = 5_000;

type ApiErrorPayload = {
	message?: string | string[];
	error?: string;
	statusCode?: number;
	retryAfter?: number;
};

export class ApiClientError extends Error {
	statusCode?: number;
	retryAfter?: number;

	constructor(message: string, statusCode?: number, retryAfter?: number) {
		super(message);
		this.name = "ApiClientError";
		this.statusCode = statusCode;
		this.retryAfter = retryAfter;
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			...init?.headers,
		},
	});

	const payload = (await response.json().catch(() => ({}))) as T &
		ApiErrorPayload;

	if (!response.ok) {
		const message = Array.isArray(payload.message)
			? payload.message[0]
			: payload.message || payload.error || "Something went wrong";
		const retryAfterSeconds = Number(
			response.headers.get("Retry-After") || payload.retryAfter,
		);
		throw new ApiClientError(
			message,
			response.status,
			Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
		);
	}

	return payload;
}

function getAuthChannel() {
	if (
		typeof window === "undefined" ||
		typeof BroadcastChannel === "undefined"
	) {
		return null;
	}

	if (!authChannel) {
		authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
		authChannel.onmessage = (event: MessageEvent<unknown>) => {
			const message = event.data as
				| { type: "refresh-success"; response: AuthResponse }
				| { type: "logout" };

			if (
				message?.type === "refresh-success" &&
				message.response?.accessToken
			) {
				latestSharedRefresh = {
					receivedAt: Date.now(),
					response: message.response,
				};
				return;
			}

			if (message?.type === "logout") clearPersistedAuth();
		};
	}

	return authChannel;
}

function shareRefresh(response: AuthResponse) {
	getAuthChannel()?.postMessage({ type: "refresh-success", response });
}

export function notifyAuthLogout() {
	getAuthChannel()?.postMessage({ type: "logout" });
}

function wait(milliseconds: number) {
	return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function requestRefreshWithRetry() {
	for (let attempt = 0; ; attempt += 1) {
		try {
			return await request<AuthResponse>("/auth/refresh", {
				method: "POST",
				body: JSON.stringify({}),
			});
		} catch (error) {
			if (
				error instanceof ApiClientError &&
				error.statusCode === 429 &&
				attempt < MAX_REFRESH_RETRIES &&
				error.retryAfter !== undefined
			) {
				await wait(Math.min(error.retryAfter * 1000, MAX_RETRY_AFTER_MS));
				continue;
			}

			throw error;
		}
	}
}

async function coordinatedRefresh() {
	const startedAt = Date.now();
	const shared = latestSharedRefresh;
	if (shared && shared.receivedAt >= startedAt) return shared.response;

	const refresh = async () => {
		const sharedWhileWaiting = latestSharedRefresh;
		if (sharedWhileWaiting && sharedWhileWaiting.receivedAt >= startedAt) {
			return sharedWhileWaiting.response;
		}

		const response = await requestRefreshWithRetry();
		shareRefresh(response);
		return response;
	};

	if (typeof navigator !== "undefined" && navigator.locks) {
		return navigator.locks.request(
			REFRESH_LOCK_NAME,
			{ mode: "exclusive" },
			refresh,
		);
	}

	return refresh();
}

function refreshSession() {
	if (refreshPromise) return refreshPromise;

	const pendingRefresh = coordinatedRefresh();

	refreshPromise = pendingRefresh;
	void pendingRefresh.then(
		() => {
			if (refreshPromise === pendingRefresh) refreshPromise = null;
		},
		() => {
			if (refreshPromise === pendingRefresh) refreshPromise = null;
		},
	);

	return pendingRefresh;
}

export const authClient = {
	signup(input: {
		name: string;
		email: string;
		password: string;
		turnstileToken?: string;
	}) {
		return request<AuthResponse>("/auth/signup", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	login(input: { email: string; password: string; turnstileToken?: string }) {
		return request<AuthResponse>("/auth/login", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	forgotPassword(input: { email: string; turnstileToken?: string }) {
		return request<{ success: boolean }>("/auth/forgot-password", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	resetPassword(input: { email: string; token: string; password: string }) {
		return request<{ success: boolean }>("/auth/reset-password", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	resendVerification(input: { email: string; turnstileToken?: string }) {
		return request<{ success: boolean; message?: string }>(
			"/auth/resend-verification",
			{
				method: "POST",
				body: JSON.stringify(input),
			},
		);
	},

	verifyEmail(input: { email: string; code: string }) {
		return request<{ success: boolean }>("/auth/verify-email", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	getGoogleAuthUrl() {
		return request<{ url: string }>("/auth/google");
	},

	me() {
		return request<{ user: AuthUser }>("/auth/me");
	},

	refresh() {
		return refreshSession();
	},

	logout() {
		return request<{ success: boolean }>("/auth/logout", {
			method: "POST",
			body: JSON.stringify({}),
		});
	},
};

export function persistAuthResponse(response: AuthResponse) {
	accessToken = response.accessToken || null;

	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event("cooktale-auth-changed"));
	}
}

export function setAccessToken(token: string | null) {
	accessToken = token;
}

export function getAccessToken() {
	return accessToken;
}

export function getAccessTokenExpiry(token = accessToken) {
	if (!token) return null;

	try {
		const payload = token.split(".")[1];
		if (!payload) return null;
		const decoded = JSON.parse(
			atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
		) as {
			exp?: number;
		};
		return decoded.exp ? decoded.exp * 1000 : null;
	} catch {
		return null;
	}
}

export function isConfirmedSessionInvalid(error: unknown) {
	return error instanceof ApiClientError && error.statusCode === 401;
}

export async function authenticatedFetch(
	input: RequestInfo | URL,
	init?: RequestInit,
) {
	const send = (token: string | null) => {
		const headers = new Headers(init?.headers);
		if (token) headers.set("Authorization", `Bearer ${token}`);

		return fetch(input, { ...init, credentials: "include", headers });
	};

	const response = await send(accessToken);
	if (response.status !== 401) return response;

	try {
		const refreshed = await refreshSession();
		persistAuthResponse(refreshed);
		return refreshed.accessToken ? await send(refreshed.accessToken) : response;
	} catch (error) {
		if (isConfirmedSessionInvalid(error)) clearPersistedAuth();
		return response;
	}
}

export function clearPersistedAuth() {
	accessToken = null;
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event("cooktale-auth-changed"));
	}
}
