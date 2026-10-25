"use server";


type FetchRecipeParams = {
	page?: number;
	limit?: number;
	tag?: string;
	recipeCategory?: string;
	sortBy?: string;
};

export async function getAllRecipesAction({
	page = 1,
	limit = 9,
	tag,
	recipeCategory,
	sortBy,
}: FetchRecipeParams) {
	try {
		const apiUrl =
			process.env.SERVER_API_URL ||
			process.env.NEXT_SERVER_API_URL ||
			process.env.NEXT_PUBLIC_API_URL ||
			"http://localhost:4000/api/v1";
		const query = new URLSearchParams({
			page: String(page),
			limit: String(Math.min(limit, 50)),
			sortBy: sortBy === "popular" || sortBy === "rating" ? sortBy : "latest",
		});
		if (tag && tag !== "All") query.set("tag", tag);
		if (recipeCategory && recipeCategory !== "All")
			query.set("recipeCategory", recipeCategory);
		const response = await fetch(`${apiUrl}/recipes?${query.toString()}`, {
			cache: "no-store",
		});
		if (!response.ok) throw new Error(`Recipe API returned ${response.status}`);
		const result = (await response.json()) as {
			recipes: unknown[];
			hasMore: boolean;
		};

		return { success: true, data: result.recipes, hasMore: result.hasMore };
	} catch (error) {
		console.error("Recipe Server Action Error:", error);
		return { success: false, error: "Failed to fetch recipes" };
	}
}
