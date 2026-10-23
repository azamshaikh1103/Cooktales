import { fetchAll, sitemapXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 3600;

type Story = { slug: string | null; updatedAt?: string; publishedAt?: string | null };

export async function GET() {
	const stories = await fetchAll<Story>("/stories", "stories");
	return xmlResponse(
		sitemapXml(
			stories.flatMap((story) =>
				story.slug
					? [{ path: `/stories/${story.slug}`, lastModified: story.updatedAt || story.publishedAt }]
					: [],
			),
		),
	);
}
