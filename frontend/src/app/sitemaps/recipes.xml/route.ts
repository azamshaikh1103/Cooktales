import { fetchAll, sitemapXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 3600;

type Recipe = {
	slug: string | null;
	updatedAt: string;
	mainImage: string | null;
	moreImages?: string[];
};

export async function GET() {
	const recipes = await fetchAll<Recipe>("/recipes", "recipes");
	return xmlResponse(
		sitemapXml(
			recipes.flatMap((recipe) => {
				if (!recipe.slug) return [];
				return [
					{
						path: `/recipe/${recipe.slug}`,
						lastModified: recipe.updatedAt,
						images: [recipe.mainImage, ...(recipe.moreImages || [])].filter(
							(image): image is string => Boolean(image),
						),
					},
				];
			}),
		),
	);
}
