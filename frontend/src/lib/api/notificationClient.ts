import { ApiClientError, authenticatedFetch } from "./authClient";

const API_URL =
	typeof window === "undefined"
		? process.env.SERVER_API_URL ||
			process.env.NEXT_SERVER_API_URL ||
			process.env.NEXT_PUBLIC_API_URL ||
			"http://localhost:4000/api/v1"
		: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type ApiError = { message?: string | string[]; error?: string };

export type NotificationActor = {
	id: string;
	name: string;
	username: string | null;
	image: string | null;
};

export type CookTaleNotification = {
	id: string;
	type:
		| "FOLLOW"
		| "RECIPE_LIKE"
		| "STORY_LIKE"
		| "RECIPE_COMMENT"
		| "STORY_COMMENT"
		| "RECIPE_COMMENT_REPLY"
		| "STORY_COMMENT_REPLY"
		| "RECIPE_REVIEW"
		| "RECIPE_REVIEW_REPLY"
		| "SYSTEM";
	targetPath: string | null;
	payload: Record<string, unknown>;
	readAt: string | null;
	createdAt: string;
	actor: NotificationActor | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await authenticatedFetch(`${API_URL}${path}`, {
		...init,
		credentials: "include",
		headers: {
			Accept: "application/json",
			...(init?.body ? { "Content-Type": "application/json" } : {}),
			...init?.headers,
		},
	});
	const payload = (await response.json().catch(() => ({}))) as T & ApiError;
	if (!response.ok) {
		const message = Array.isArray(payload.message)
			? payload.message[0]
			: payload.message ||
				payload.error ||
				"Notifications are unavailable right now.";
		throw new ApiClientError(message, response.status);
	}
	return payload;
}

export const notificationClient = {
	list(options?: { page?: number; limit?: number; unreadOnly?: boolean }) {
		const params = new URLSearchParams({
			page: String(options?.page || 1),
			limit: String(options?.limit || 20),
			...(options?.unreadOnly ? { unreadOnly: "true" } : {}),
		});
		return request<{
			notifications: CookTaleNotification[];
			page: number;
			limit: number;
			total: number;
			unreadCount: number;
			hasMore: boolean;
		}>(`/notifications?${params}`);
	},

	unreadCount() {
		return request<{ unreadCount: number }>("/notifications/unread-count");
	},

	markRead(id: string) {
		return request<{ unreadCount: number }>(`/notifications/${id}/read`, {
			method: "PATCH",
		});
	},

	markAllRead() {
		return request<{ unreadCount: number }>("/notifications/read-all", {
			method: "POST",
		});
	},

	pushConfig() {
		return request<{ enabled: boolean; publicKey?: string }>("/notifications/push/config");
	},

	subscribePush(input: {
		endpoint: string;
		p256dh: string;
		auth: string;
		expirationTime?: number | null;
	}) {
		return request<{ subscribed: boolean }>("/notifications/push/subscriptions", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	unsubscribePush(endpoint: string) {
		return request<{ subscribed: boolean }>("/notifications/push/subscriptions", {
			method: "DELETE",
			body: JSON.stringify({ endpoint }),
		});
	},
};
