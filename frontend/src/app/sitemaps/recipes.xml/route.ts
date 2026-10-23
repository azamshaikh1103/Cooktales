import { fetchAll, sitemapXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 3600;

type Recipe = { slug: string | null; updatedAt: string };

export async function GET() {
	const recipes = await fetchAll<Recipe>("/recipes", "recipes");
	return xmlResponse(
		sitemapXml(
			recipes.flatMap((recipe) =>
				recipe.slug ? [{ path: `/recipe/${recipe.slug}`, lastModified: recipe.updatedAt }] : [],
			),
		),
	);
}
