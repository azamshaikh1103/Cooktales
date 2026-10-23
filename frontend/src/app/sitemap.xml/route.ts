import { sitemapIndexXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 3600;

export function GET() {
	return xmlResponse(
		sitemapIndexXml([
			"/sitemaps/pages.xml",
			"/sitemaps/recipes.xml",
			"/sitemaps/stories.xml",
			"/sitemaps/profiles.xml",
			"/sitemaps/discussions.xml",
		]),
	);
}
