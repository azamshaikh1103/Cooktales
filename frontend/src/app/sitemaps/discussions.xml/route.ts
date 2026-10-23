import { fetchAll, sitemapXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 3600;

type Discussion = { slug: string; updatedAt: string };

export async function GET() {
	const discussions = await fetchAll<Discussion>("/community/discussions", "discussions");
	return xmlResponse(
		sitemapXml(
			discussions.map((discussion) => ({
				path: `/community/discussion/${discussion.slug}`,
				lastModified: discussion.updatedAt,
			})),
		),
	);
}
