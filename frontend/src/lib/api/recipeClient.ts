import { ApiClientError, authenticatedFetch } from "./authClient";
import type { RecipeCategory } from "@/lib/recipeCategories";

const API_URL =
	typeof window === "undefined"
		? process.env.SERVER_API_URL ||
			process.env.NEXT_SERVER_API_URL ||
			process.env.NEXT_PUBLIC_API_URL ||
			"http://localhost:4000/api/v1"
		: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type ApiErrorPayload = {
	message?: string | string[];
	error?: string;
	statusCode?: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await authenticatedFetch(`${API_URL}${path}`, {
		...init,
		credentials: "include",
		cache: init?.cache,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});

	const payload = (await response.json().catch(() => ({}))) as T &
		ApiErrorPayload;

	if (!response.ok) {
		const message = Array.isArray(payload.message)
			? payload.message[0]
			: payload.message || payload.error || "Something went wrong";
		throw new ApiClientError(message, response.status);
	}

	return payload;
}

export type RecipeMediaInput = {
	publicId: string;
	url: string;
	resourceType?: "IMAGE" | "VIDEO" | "RAW";
	kind: "MAIN" | "GALLERY" | "STEP" | "VIDEO";
	position?: number;
	width?: number;
	height?: number;
	bytes?: number;
	format?: string;
};

export type RecipeIngredientInput = {
	name: string;
	detail?: string | null;
	image?: string | null;
	link?: string | null;
};

export type RecipeStepInput = {
	name: string;
	detail?: string | null;
	timeReq?: number | null;
	videoUrl?: string | null;
	image?: string | null;
	link?: string | null;
};

export type RecipeFaqInput = {
	question: string;
	answer: string;
};

export type UpdateRecipeInput = {
	expectedVersion?: number;
	name?: string;
	about?: string | null;
	mainImage?: string;
	mainImagePublicId?: string | null;
	moreImages?: string[];
	totalTimeReq?: number;
	yield?: number | null;
	calories?: number | null;
	diet?:
		| "Vegan"
		| "Vegetarian"
		| "Pescatarian"
		| "Omnivore"
		| "Carnivore"
		| null;
	cuisine?: string;
	recipeCategory?: RecipeCategory | null;
	difficulty?: "Easy" | "Medium" | "Hard" | "Expert" | null;
	tipsAndTricks?: string | null;
	storingFreezing?: string | null;
	tags?: string[];
	equipments?: RecipeIngredientInput[];
	ingredients?: RecipeIngredientInput[];
	steps?: RecipeStepInput[];
	faqs?: RecipeFaqInput[];
	media?: RecipeMediaInput[];
};

export type RecipeResponse = {
	recipe: {
		id: string;
		clientDraftId?: string | null;
		version: number;
		slug: string | null;
		status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";
		name: string;
		about?: string | null;
		mainImage?: string | null;
		mainImagePublicId?: string | null;
		moreImages?: string[];
		totalTimeReq?: number | null;
		yield?: number | null;
		calories?: number | null;
		diet?: UpdateRecipeInput["diet"];
		cuisine?: string | null;
		recipeCategory?: UpdateRecipeInput["recipeCategory"];
		difficulty?: UpdateRecipeInput["difficulty"];
		tipsAndTricks?: string | null;
		storingFreezing?: string | null;
		tags?: string[];
		updatedAt?: string;
		lastEditedAt?: string | null;
		createdAt?: string;
		ingredients?: RecipeIngredientInput[];
		equipments?: RecipeIngredientInput[];
		steps?: RecipeStepInput[];
		faqs?: RecipeFaqInput[];
		media?: RecipeMediaInput[];
	};
};

export type OwnedRecipesResponse = {
	recipes: RecipeResponse["recipe"][];
	page: number;
	limit: number;
	total: number;
	hasMore: boolean;
};

export type RecipeReview = {
	id: string;
	stars: number | null;
	text: string;
	createdAt: string;
	updatedAt?: string;
	editedAt?: string | null;
	authorReply?: string | null;
	authorReplyAt?: string | null;
	upvotes: number;
	downvotes: number;
	user: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	};
};

export type RecipeComment = {
	id: string;
	content: string;
	status: "VISIBLE" | "HIDDEN" | "REMOVED";
	createdAt: string;
	editedAt?: string | null;
	parentId?: string | null;
	author: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
	};
	_count: { likes: number; replies?: number };
	replies: RecipeComment[];
};

export type PublicRecipe = Omit<
	RecipeResponse["recipe"],
	"ingredients" | "equipments" | "steps" | "faqs"
> & {
	slug: string;
	mainImage: string;
	moreImages: string[];
	totalTimeReq: number;
	isPremium?: boolean;
	views: number;
	likes: number;
	ratings: number;
	ratingCount: number;
	publishedAt?: string | null;
	author: {
		id: string;
		name: string | null;
		username: string | null;
		image: string | null;
		about?: string | null;
		_count?: { recipes: number };
	};
	ingredients: Array<RecipeIngredientInput & { id: string }>;
	equipments: Array<RecipeIngredientInput & { id: string }>;
	steps: Array<RecipeStepInput & { id: string }>;
	faqs: Array<RecipeFaqInput & { id: string }>;
	reviews: RecipeReview[];
	_count?: { reviews: number };
};

export type RecipeInteractionState = {
	liked: boolean;
	bookmarked: boolean;
	myRating: number | null;
	myReview: Pick<
		RecipeReview,
		"id" | "stars" | "text" | "createdAt" | "editedAt"
	> | null;
	likes: number;
	ratings: number;
	ratingCount: number;
};

export const recipeClient = {
	getPublic(slug: string) {
		return request<{ recipe: PublicRecipe }>(
			`/recipes/${encodeURIComponent(slug)}`,
			{ method: "GET" },
		);
	},

	getCookMode(slug: string) {
		return request<{ recipe: PublicRecipe }>(
			`/recipes/${encodeURIComponent(slug)}/cook`,
			{ method: "GET" },
		);
	},

	listReviews(
		slug: string,
		page = 1,
		limit = 10,
		sort: "newest" | "highest" | "lowest" | "helpful" = "newest",
	) {
		const query = new URLSearchParams({
			page: String(page),
			limit: String(limit),
			sort,
		});
		return request<{
			reviews: RecipeReview[];
			page: number;
			limit: number;
			total: number;
			hasMore: boolean;
		}>(`/recipes/${encodeURIComponent(slug)}/reviews?${query.toString()}`, {
			method: "GET",
		});
	},

	listComments(
		slug: string,
		page = 1,
		limit = 10,
		sort: "newest" | "oldest" = "newest",
	) {
		const query = new URLSearchParams({
			page: String(page),
			limit: String(limit),
			sort,
		});
		return request<{
			comments: RecipeComment[];
			page: number;
			limit: number;
			total: number;
			hasMore: boolean;
		}>(`/recipes/${encodeURIComponent(slug)}/comments?${query.toString()}`, {
			method: "GET",
		});
	},

	commentViewerState(id: string, commentIds: string[]) {
		const query = new URLSearchParams({ ids: commentIds.join(",") });
		return request<{ likedCommentIds: string[] }>(
			`/recipes/${encodeURIComponent(id)}/comments/viewer?${query.toString()}`,
			{ method: "GET" },
		);
	},

	createComment(id: string, input: { content: string; parentId?: string }) {
		return request<{ comment: RecipeComment }>(
			`/recipes/${encodeURIComponent(id)}/comments`,
			{
				method: "POST",
				body: JSON.stringify(input),
			},
		);
	},

	updateComment(id: string, commentId: string, content: string) {
		return request<{ comment: RecipeComment }>(
			`/recipes/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`,
			{ method: "PATCH", body: JSON.stringify({ content }) },
		);
	},

	deleteComment(id: string, commentId: string) {
		return request<{ message: string }>(
			`/recipes/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`,
			{ method: "DELETE" },
		);
	},

	likeComment(id: string, commentId: string) {
		return request<{ liked: boolean; likes: number }>(
			`/recipes/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/like`,
			{ method: "POST", body: JSON.stringify({}) },
		);
	},

	unlikeComment(id: string, commentId: string) {
		return request<{ liked: boolean; likes: number }>(
			`/recipes/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}/like`,
			{ method: "DELETE" },
		);
	},

	viewerState(id: string) {
		return request<RecipeInteractionState>(
			`/recipes/${encodeURIComponent(id)}/viewer`,
			{ method: "GET" },
		);
	},

	like(id: string) {
		return request<RecipeInteractionState>(
			`/recipes/${encodeURIComponent(id)}/like`,
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);
	},

	unlike(id: string) {
		return request<RecipeInteractionState>(
			`/recipes/${encodeURIComponent(id)}/like`,
			{
				method: "DELETE",
			},
		);
	},

	bookmark(id: string) {
		return request<RecipeInteractionState>(
			`/recipes/${encodeURIComponent(id)}/bookmark`,
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);
	},

	unbookmark(id: string) {
		return request<RecipeInteractionState>(
			`/recipes/${encodeURIComponent(id)}/bookmark`,
			{
				method: "DELETE",
			},
		);
	},

	recordView(id: string) {
		return request<{ counted: boolean }>(
			`/recipes/${encodeURIComponent(id)}/views`,
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);
	},

	createReview(id: string, input: { stars: number; text: string }) {
		return request<{ review: RecipeReview }>(
			`/recipes/${encodeURIComponent(id)}/reviews`,
			{
				method: "POST",
				body: JSON.stringify(input),
			},
		);
	},

	updateReview(
		id: string,
		reviewId: string,
		input: { stars: number; text: string },
	) {
		return request<{ review: RecipeReview }>(
			`/recipes/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}`,
			{ method: "PATCH", body: JSON.stringify(input) },
		);
	},

	deleteReview(id: string, reviewId: string) {
		return request<{ message: string }>(
			`/recipes/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}`,
			{ method: "DELETE" },
		);
	},

	replyToReview(id: string, reviewId: string, reply: string) {
		return request<{ review: RecipeReview }>(
			`/recipes/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}/reply`,
			{ method: "PATCH", body: JSON.stringify({ reply }) },
		);
	},

	voteOnReview(id: string, reviewId: string, type: "UP" | "DOWN") {
		return request<{
			upvotes: number;
			downvotes: number;
			myVote: "UP" | "DOWN" | null;
		}>(
			`/recipes/${encodeURIComponent(id)}/reviews/${encodeURIComponent(reviewId)}/vote`,
			{ method: "POST", body: JSON.stringify({ type }) },
		);
	},

	createDraft(input: { name?: string; clientDraftId?: string }) {
		return request<RecipeResponse>("/recipes/drafts", {
			method: "POST",
			body: JSON.stringify(input),
		});
	},

	listMine(
		status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED",
		page = 1,
		limit = 12,
	) {
		const query = new URLSearchParams({
			page: String(page),
			limit: String(limit),
		});
		if (status) query.set("status", status);
		return request<OwnedRecipesResponse>(
			`/recipes/mine/list?${query.toString()}`,
		);
	},

	update(id: string, input: UpdateRecipeInput) {
		return request<RecipeResponse>(`/recipes/${encodeURIComponent(id)}`, {
			method: "PATCH",
			body: JSON.stringify(input),
		});
	},

	getManage(id: string) {
		return request<RecipeResponse>(
			`/recipes/${encodeURIComponent(id)}/manage`,
			{ method: "GET" },
		);
	},

	publish(id: string) {
		return request<RecipeResponse>(
			`/recipes/${encodeURIComponent(id)}/publish`,
			{ method: "POST", body: JSON.stringify({}) },
		);
	},

	delete(id: string) {
		return request<{ message: string }>(`/recipes/${encodeURIComponent(id)}`, {
			method: "DELETE",
		});
	},

	restore(id: string) {
		return request<RecipeResponse>(
			`/recipes/${encodeURIComponent(id)}/restore`,
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);
	},
};
