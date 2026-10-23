import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/api/",
				"/admin/",
				"/auth/",
				"/new-recipe",
				"/edit-recipe/",
				"/new-story",
				"/studio/",
				"/notifications",
				"/onboarding",
				"/payment/",
				"/profile/settings",
				"/community/discussion/create",
			],
		},
		sitemap: "https://cooktale.in/sitemap.xml",
	};
}
