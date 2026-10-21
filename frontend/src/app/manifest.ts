import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "CookTale — Recipes and food stories",
		short_name: "CookTale",
		description:
			"Discover, save, and share practical recipes and food stories.",
		start_url: "/",
		display: "standalone",
		background_color: "#fafafa",
		theme_color: "#006c5e",
		categories: ["food", "lifestyle"],
		icons: [
			{
				src: "/favicon-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/favicon-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
