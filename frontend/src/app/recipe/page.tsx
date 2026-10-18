import { getAllRecipesAction } from "@/lib/actions/recipe.actions";
import RecipePageClient, { type Recipe } from "./RecipePageClient";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Recipes | CookTale",
	description: "Explore thousands of community-tested recipes.",
};

export default async function RecipesPage() {
	// 1. Fetch Data in Parallel on the Server (Fastest)
	const [allRecipes, popularRecipes] = await Promise.all([
		getAllRecipesAction({ limit: 12, page: 1, sortBy: "latest" }),
		getAllRecipesAction({ limit: 8, sortBy: "popular" }),
	]);

	// 2. Pass data to Client Component
	return (
		<RecipePageClient
			initialRecipes={
				allRecipes.success && allRecipes.data
					? (allRecipes.data as Recipe[])
					: []
			}
			initialPopular={
				popularRecipes.success && popularRecipes.data
					? (popularRecipes.data as Recipe[])
					: []
			}
		/>
	);
}
