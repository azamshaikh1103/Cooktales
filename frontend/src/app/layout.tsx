import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Raleway } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import OfflineStatus from "@/components/OfflineStatus";
import ScriptManager from "@/components/ScriptManager";
import ScrollToTop from "@/components/ScrollToTop";
import TabManager from "@/components/TabManager";
import ReduxContextProvider from "./provider";

export const raleway = Raleway({
	subsets: ["latin"],
	variable: "--font-raleway",
});

export const montserrat = Montserrat({
	subsets: ["latin"],
	variable: "--font-montserrat",
});

const BASE_URL = "https://cooktale.in";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	alternates: { canonical: "/" },
	title: {
		default: "CookTale | The Global Recipe Community & Platform",
		template: "%s | CookTale",
	},
	description:
		"Join the world's best community of home chefs. Discover thousands of recipes, share your culinary stories, and cook better, together.",
	applicationName: "CookTale",
	authors: [{ name: "CookTale", url: BASE_URL }],
	keywords: [
		"authentic recipes",
		"home cooking community",
		"chef social network",
		"easy dinner ideas for students",
		"healthy meal prep recipes",
		"CookTale",
		"CookTale.in",
		"CookTale.com",
		"food stories",
		"recipes",
		"cooking",
		"food blog",
		"chef community",
		"foodie",
	],
	creator: "CookTale",
	publisher: "CookTale Inc.",
	openGraph: {
		title: "CookTale | Experience the taste of your own food",
		description: "Join the world's best community of home chefs.",
		url: BASE_URL,
		siteName: "CookTale",
		images: [
			{
				url: "/og-image.jpg",
				width: 1200,
				height: 630,
				alt: "CookTale Homepage",
			},
		],
		locale: "en_US",
		type: "website",
	},
	icons: {
		icon: [
			{ url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
			{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
			{ url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
			{ url: "/favicon-256x256.png", sizes: "256x256", type: "image/png" },
			{ url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
		shortcut: ["/favicon-512x512.png"],
	},
	twitter: {
		card: "summary_large_image",
		title: "CookTale",
		description: "Discover & Share Premium Recipes.",
		images: ["/og-image.jpg"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	verification: {
		google: "vwzyW74J7PUUW8yAkcCew_MQqVGSBZxdmKkLnJ7-p9I",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const organizationSchema = {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": "https://cooktale.in/#organization",
				name: "CookTale",
				url: "https://cooktale.in",
				logo: {
					"@type": "ImageObject",
					url: "https://cooktale.in/favicon-512x512.png",
					width: 512,
					height: 512,
				},
				sameAs: [
					"https://instagram.com/cooktale.in",
					"https://www.facebook.com/cooktale.in",
					"https://x.com/cooktaleapp",
					"https://www.linkedin.com/company/cooktale/",
				],
				contactPoint: {
					"@type": "ContactPoint",
					telephone: "+91-9867584687",
					contactType: "customer service",
					email: "support@cooktale.in",
				},
			},
			{
				"@type": "WebSite",
				"@id": "https://cooktale.in/#website",
				url: "https://cooktale.in",
				name: "CookTale",
				alternateName: "CookTale Recipes",
				inLanguage: "en",
				image: "https://cooktale.in/og-image.jpg",
				publisher: { "@id": "https://cooktale.in/#organization" },
				potentialAction: {
					"@type": "SearchAction",
					target: {
						"@type": "EntryPoint",
						urlTemplate: "https://cooktale.in/search?q={search_term_string}",
					},
					"query-input": "required name=search_term_string",
				},
			},
		],
	};

	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${raleway.variable} ${montserrat.variable}`}
		>
			<head>
				<meta name="application-name" content="CookTale" />
				<meta property="og:site_name" content="CookTale" />
				<meta
					name="cooktale-build-revision"
					content={process.env.NEXT_PUBLIC_APP_REVISION ?? "unknown"}
				/>
				<meta name="google-adsense-account" content="ca-pub-6574614841664693" />
				<script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6574614841664693"
					crossOrigin="anonymous"
				/>
				<script
					dangerouslySetInnerHTML={{
						__html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (localTheme === 'dark' || (!localTheme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
					}}
				/>
			</head>
			<body
				className={`overflow-x-clip bg-[#fafafa] antialiased transition-colors duration-500 dark:bg-[#0d1f1c]`}
			>
				<ScriptManager />

				<Script
					id="org-schema"
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationSchema),
					}}
				/>

				<ReduxContextProvider>
					<NextTopLoader
						color="#006C5E"
						initialPosition={0.08}
						crawlSpeed={200}
						height={3}
						crawl={true}
						showSpinner={false}
						easing="ease"
						speed={200}
						shadow="0 0 10px #006C5E,0 0 5px #006C5E"
						zIndex={99999} // Forces it above everything
					/>
					<ScrollToTop />
					<TabManager />
					<OfflineStatus />
					{children}
					<Toaster
						position="bottom-right"
						theme="system"
						richColors
						expand={true}
					/>
				</ReduxContextProvider>
			</body>
		</html>
	);
}
