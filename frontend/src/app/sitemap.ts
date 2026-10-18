import type { MetadataRoute } from "next";

const baseUrl = "https://cooktale.in";
const apiUrl =
	process.env.SERVER_API_URL ||
	process.env.NEXT_SERVER_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:4000/api/v1";

type PublicRecipe = {
	id: string;
	slug: string | null;
	updatedAt: string;
};

type PublicStory = {
	id: string;
	slug: string | null;
	updatedAt?: string;
	publishedAt?: string | null;
};

async function getPublishedRecipes() {
	const recipes: PublicRecipe[] = [];
	let page = 1;
	let hasMore = true;

	try {
		while (hasMore && page <= 20) {
			const response = await fetch(`${apiUrl}/recipes?page=${page}&limit=50`, {
				next: { revalidate: 3600 },
			});
			if (!response.ok) break;
			const result = (await response.json()) as {
				recipes: PublicRecipe[];
				hasMore: boolean;
			};
			recipes.push(...result.recipes);
			hasMore = result.hasMore;
			page += 1;
		}
	} catch {
		// Static routes still produce a valid sitemap while the API is unavailable.
	}

	return recipes;
}

async function getPublishedStories() {
	const stories: PublicStory[] = [];
	let page = 1;
	let hasMore = true;

	try {
		while (hasMore && page <= 20) {
			const response = await fetch(`${apiUrl}/stories?page=${page}&limit=50`, {
				next: { revalidate: 3600 },
			});
			if (!response.ok) break;
			const result = (await response.json()) as {
				stories: PublicStory[];
				hasMore: boolean;
			};
			stories.push(...result.stories);
			hasMore = result.hasMore;
			page += 1;
		}
	} catch {
		// Static routes still produce a valid sitemap while the API is unavailable.
	}

	return stories;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const [recipes, stories] = await Promise.all([
		getPublishedRecipes(),
		getPublishedStories(),
	]);
	const staticRoutes: MetadataRoute.Sitemap = [
		["", "daily", 1],
		["/recipe", "daily", 0.9],
		["/stories", "daily", 0.9],
		["/search", "daily", 0.8],
		["/community", "daily", 0.9],
		["/community/discussion", "daily", 0.9],
		["/community/challenge", "daily", 0.9],
		["/community/leaderboard", "daily", 0.7],
		["/membership", "weekly", 0.7],
		["/about", "monthly", 0.6],
		["/careers", "weekly", 0.6],
		["/partners", "monthly", 0.6],
		["/contact", "monthly", 0.6],
		["/faq", "monthly", 0.6],
		["/privacy", "yearly", 0.3],
		["/terms", "yearly", 0.3],
		["/cookies", "yearly", 0.3],
		["/site-map", "monthly", 0.3],
	].map(([path, changeFrequency, priority]) => ({
		url: `${baseUrl}${path}`,
		lastModified: new Date(),
		changeFrequency:
			changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
		priority: priority as number,
	}));

	const recipeRoutes: MetadataRoute.Sitemap = recipes.flatMap((recipe) => {
		if (!recipe.slug) return [];
		return [
			{
				url: `${baseUrl}/recipe/${recipe.slug}`,
				lastModified: new Date(recipe.updatedAt),
				changeFrequency: "weekly" as const,
				priority: 0.8,
			},
			{
				url: `${baseUrl}/cook/${recipe.slug}`,
				lastModified: new Date(recipe.updatedAt),
				changeFrequency: "weekly" as const,
				priority: 0.7,
			},
		];
	});

	const storyRoutes: MetadataRoute.Sitemap = stories.flatMap((story) => {
		if (!story.slug) return [];
		return [
			{
				url: `${baseUrl}/stories/${story.slug}`,
				lastModified: new Date(
					story.updatedAt || story.publishedAt || Date.now(),
				),
				changeFrequency: "monthly" as const,
				priority: 0.7,
			},
		];
	});

	return [...staticRoutes, ...recipeRoutes, ...storyRoutes];
}
