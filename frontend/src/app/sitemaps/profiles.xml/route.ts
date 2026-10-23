import { fetchAll, sitemapXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 3600;

type Profile = { username: string | null; updatedAt: string };

export async function GET() {
	const profiles = await fetchAll<Profile>("/profiles", "items");
	return xmlResponse(
		sitemapXml(
			profiles.flatMap((profile) =>
				profile.username
					? [{ path: `/profile/${profile.username}`, lastModified: profile.updatedAt }]
					: [],
			),
		),
	);
}
