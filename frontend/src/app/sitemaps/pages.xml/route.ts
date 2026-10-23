import { sitemapXml, xmlResponse } from "@/lib/seo/sitemap";

export const revalidate = 86400;

const pages = [
	"",
	"/recipe",
	"/stories",
	"/search",
	"/community",
	"/community/discussion",
	"/community/challenge",
	"/community/leaderboard",
	"/membership",
	"/about",
	"/careers",
	"/partners",
	"/contact",
	"/faq",
	"/privacy",
	"/terms",
	"/cookies",
	"/site-map",
];

export function GET() {
	return xmlResponse(sitemapXml(pages.map((path) => ({ path }))));
}
