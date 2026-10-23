export const siteUrl = "https://cooktale.in";

const apiUrl =
	process.env.SERVER_API_URL ||
	process.env.NEXT_SERVER_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"http://127.0.0.1:4000/api/v1";

export type SitemapEntry = {
	path: string;
	lastModified?: string | null;
};

type SitemapListKey = "items" | "recipes" | "stories" | "discussions";
type Paginated<T> = { hasMore: boolean } & Partial<Record<SitemapListKey, T[]>>;

const xmlEscape = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lastmod = (value?: string | null) => {
	if (!value || Number.isNaN(Date.parse(value))) return "";
	return `<lastmod>${new Date(value).toISOString()}</lastmod>`;
};

export function sitemapXml(entries: SitemapEntry[]) {
	const urls = entries
		.map(
			({ path, lastModified }) =>
				`<url><loc>${xmlEscape(`${siteUrl}${path}`)}</loc>${lastmod(lastModified)}<changefreq>daily</changefreq><priority>0.8</priority></url>`,
		)
		.join("");
	return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function sitemapIndexXml(paths: string[]) {
	const maps = paths
		.map((path) => `<sitemap><loc>${xmlEscape(`${siteUrl}${path}`)}</loc></sitemap>`)
		.join("");
	return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps}</sitemapindex>`;
}

export function xmlResponse(xml: string) {
	return new Response(xml, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}

export async function fetchAll<T>(path: string, key: SitemapListKey) {
	const entries: T[] = [];
	let page = 1;
	let hasMore = true;

	try {
		// shortcut: a sitemap is limited to 50,000 URLs; add numbered child maps before a content type reaches this cap.
		while (hasMore && entries.length < 50_000) {
			const response = await fetch(`${apiUrl}${path}?page=${page}&limit=24`, {
				next: { revalidate: 3600 },
			});
			if (!response.ok) break;
			const result = (await response.json()) as Paginated<T>;
			entries.push(...(result[key] || []));
			hasMore = result.hasMore;
			page += 1;
		}
	} catch {
		// The static sitemap remains available while the API is unavailable.
	}

	return entries.slice(0, 50_000);
}
