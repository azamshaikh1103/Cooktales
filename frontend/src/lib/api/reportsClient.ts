import type { ReportReason, ReportTargetType } from "@/lib/reports/reasons";
import { ApiClientError, authenticatedFetch } from "./authClient";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type ApiError = { message?: string | string[]; error?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await authenticatedFetch(`${API_URL}${path}`, {
		...init,
		headers: { "Content-Type": "application/json", ...init?.headers },
	});
	const body = (await response.json().catch(() => ({}))) as T & ApiError;
	if (!response.ok) {
		const message = Array.isArray(body.message)
			? body.message[0]
			: body.message || body.error || "Something went wrong";
		throw new ApiClientError(message, response.status);
	}
	return body;
}

export type ReportStatus = "OPEN" | "DISMISSED" | "ACTIONED";

export type ReportGroup = {
	targetType: ReportTargetType;
	targetId: string;
	status: ReportStatus;
	reportCount: number;
	lastReportedAt: string;
	reasons: Partial<Record<ReportReason, number>>;
	notes: Array<{
		reason: ReportReason;
		details: string;
		reporterName: string;
		createdAt: string;
	}>;
	target: {
		title: string;
		excerpt: string;
		author: { id: string; name: string } | null;
		url: string | null;
		state: "ACTIVE" | "REMOVED";
	};
};

export type ReportGroupsResponse = {
	reports: ReportGroup[];
	page: number;
	limit: number;
	total: number;
	hasMore: boolean;
};

export const reportsClient = {
	create: (input: {
		targetType: ReportTargetType;
		targetId: string;
		reason: ReportReason;
		details?: string;
	}) =>
		request<{ reported: true; alreadyReported: boolean }>("/reports", {
			method: "POST",
			body: JSON.stringify(input),
		}),
};

export const adminReportsClient = {
	list: (status: ReportStatus, page = 1) =>
		request<ReportGroupsResponse>(
			`/admin/reports?status=${status}&page=${page}&limit=20`,
		),
	dismiss: (targetType: ReportTargetType, targetId: string, note?: string) =>
		request<{ dismissed: number }>(
			`/admin/reports/${targetType}/${encodeURIComponent(targetId)}/dismiss`,
			{ method: "POST", body: JSON.stringify(note ? { note } : {}) },
		),
	remove: (targetType: ReportTargetType, targetId: string, note?: string) =>
		request<{ removed: true }>(
			`/admin/reports/${targetType}/${encodeURIComponent(targetId)}/remove`,
			{ method: "POST", body: JSON.stringify(note ? { note } : {}) },
		),
};
