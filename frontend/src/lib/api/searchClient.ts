import { ApiClientError } from "./authClient";

const API_URL =
	typeof window === "undefined"
		? process.env.SERVER_API_URL ||
			process.env.NEXT_SERVER_API_URL ||
			process.env.NEXT_PUBLIC_API_URL ||
			"http://localhost:4000/api/v1"
		: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type ApiError = { message?: string | string[]; error?: string };

export type SearchType = "all" | "recipe" | "story" | "chef";
export type SearchSort = "relevance" | "latest" | "popular";

export type SearchResult = {
	id: string;
	slug?: string | null;
	type: Exclude<SearchType, "all">;
	title: string;
	description?: string | null;
	image?: string | null;
	authorName?: string | null;
	authorUsername?: string | null;
	totalTime?: number | null;
	cuisine?: string | null;
	diet?: string | null;
	difficulty?: string | null;
	publishedAt?: string | null;
};

export type SearchParams = {
	q: string;
	type?: SearchType;
	sort?: SearchSort;
	cuisine?: string;
	diet?: string;
	difficulty?: string;
	tag?: string;
	maxMinutes?: number;
	page?: number;
	limit?: number;
};

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		method: "GET",
		credentials: "include",
		headers: { Accept: "application/json" },
		signal,
	});
	const body = (await response.json().catch(() => ({}))) as T & ApiError;
	if (!response.ok) {
		const message = Array.isArray(body.message)
			? body.message[0]
			: body.message || body.error || "Search is unavailable right now.";
		throw new ApiClientError(message, response.status);
	}
	return body;
}

function toQuery(params: SearchParams) {
	return new URLSearchParams(
		Object.entries(params)
			.filter(([, value]) => value !== undefined && value !== "")
			.map(([key, value]) => [key, String(value)]),
	);
}

export const searchClient = {
	search(params: SearchParams, signal?: AbortSignal) {
		return request<{
			results: SearchResult[];
			page: number;
			limit: number;
			total: number;
			hasMore: boolean;
		}>(`/search?${toQuery(params)}`, signal);
	},
	suggestions(params: SearchParams, signal?: AbortSignal) {
		return request<{ suggestions: SearchResult[] }>(
			`/search/suggestions?${toQuery({ ...params, limit: Math.min(params.limit || 8, 10) })}`,
			signal,
		);
	},
};
