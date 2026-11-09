import { ApiClientError, authenticatedFetch } from "./authClient";

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export type AffiliateSummary = {
	days: number;
	total: number;
	topItems: Array<{
		recipeId: string;
		recipeName: string;
		recipeSlug: string;
		creatorName: string;
		itemKind: string;
		itemName: string;
		domain: string;
		clicks: number;
	}>;
	topDomains: Array<{ domain: string; clicks: number }>;
	topCountries: Array<{ country: string | null; clicks: number }>;
	recent: Array<{
		id: string;
		createdAt: string;
		recipeName: string;
		recipeSlug: string;
		creatorName: string;
		itemKind: string;
		itemName: string;
		domain: string;
		country: string | null;
		visitor: { name: string; username: string | null } | null;
	}>;
};

export const adminAffiliateClient = {
	async summary(days: number): Promise<AffiliateSummary> {
		const response = await authenticatedFetch(
			`${API_URL}/admin/affiliate-clicks?days=${days}`,
		);
		const body = (await response.json().catch(() => ({}))) as
			| AffiliateSummary
			| { message?: string | string[] };
		if (!response.ok) {
			const message = (body as { message?: string | string[] }).message;
			throw new ApiClientError(
				(Array.isArray(message) ? message[0] : message) ||
					"Could not load affiliate clicks",
				response.status,
			);
		}
		return body as AffiliateSummary;
	},
};
