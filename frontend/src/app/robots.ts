import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: ["/api/", "/admin/", "/profile/settings"],
		},
		sitemap: "https://www.cooktale.in/sitemap.xml",
	};
}
