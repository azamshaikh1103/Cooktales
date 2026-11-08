import "./globals.css";
import type { Metadata } from "next";
import { Montserrat, Raleway } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import InstallCookTalePrompt from "@/components/InstallCookTalePrompt";
import OfflineStatus from "@/components/OfflineStatus";
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
const tagManagerId = "GTM-N774P8VR";

export const metadata: Metadata = {
	metadataBase: new URL(BASE_URL),
	alternates: { canonical: "/" },
	title: {
		default: "CookTale | Practical Recipes and Food Stories for Home Cooks",
		template: "%s | CookTale",
	},
	description:
		"CookTale is a home cooking community for practical recipes, seasonal food ideas, cooking tips, and food stories from everyday cooks.",
	applicationName: "CookTale",
	authors: [{ name: "CookTale", url: BASE_URL }],
	keywords: [
		"CookTale",
		"home cooking recipes",
		"easy dinner recipes",
		"seasonal recipes",
		"food stories",
		"cooking tips",
		"recipe community",
		"home chefs",
	],
	creator: "CookTale",
	publisher: "CookTale",
	category: "food",
	openGraph: {
		title: "CookTale | Practical Recipes and Food Stories for Home Cooks",
		description:
			"Find practical recipes, seasonal food ideas, cooking tips, and food stories from the CookTale community.",
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
		title: "CookTale | Practical Recipes and Food Stories",
		description:
			"Practical recipes, seasonal food ideas, cooking tips, and food stories for home cooks.",
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
					"https://www.pinterest.com/cooktale_in/",
					"https://www.instagram.com/cooktale_in/",
					"https://www.facebook.com/profile.php?id=61596221366707",
				],
				contactPoint: {
					"@type": "ContactPoint",
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
					name="p:domain_verify"
					content="410288d10339588c451fc47fdd3d3ebf"
				/>
				<meta
					name="cooktale-build-revision"
					content={process.env.NEXT_PUBLIC_APP_REVISION ?? "unknown"}
				/>
				<script
					id="cooktale-analytics-context"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static inline script authored in this file; no user input
					dangerouslySetInnerHTML={{
						__html: `window.dataLayer=window.dataLayer||[];(function(){try{var q=new URLSearchParams(location.search).get('internal');if(q==='1')localStorage.setItem('cooktale.internal','1');if(q==='0')localStorage.removeItem('cooktale.internal');var h=location.hostname;var pub=h==='cooktale.in'||h==='www.cooktale.in';if(!pub||localStorage.getItem('cooktale.internal')==='1')window.dataLayer.push({traffic_type:'internal'});}catch(e){}})();`,
					}}
				/>
				<script
					id="google-tag-manager"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static GTM bootstrap; only interpolates the constant container id
					dangerouslySetInnerHTML={{
						__html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${tagManagerId}');`,
					}}
				/>
				<meta name="google-adsense-account" content="ca-pub-6574614841664693" />
				<script
					async
					src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6574614841664693"
					crossOrigin="anonymous"
				/>
				<script
					async
					src="https://fundingchoicesmessages.google.com/i/pub-6574614841664693?ers=1"
				/>
				<script
					id="google-funding-choices-present"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static Google Funding Choices snippet authored in this file
					dangerouslySetInnerHTML={{
						__html: `(function() {
  function signalGooglefcPresent() {
    if (!window.frames.googlefcPresent) {
      if (document.body) {
        var iframe = document.createElement('iframe');
        iframe.style = 'width:0;height:0;border:0;z-index:-1000;left:-1000px;top:-1000px;display:none';
        iframe.name = 'googlefcPresent';
        document.body.appendChild(iframe);
      } else {
        setTimeout(signalGooglefcPresent, 0);
      }
    }
  }
  signalGooglefcPresent();
})();`,
					}}
				/>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: static theme bootstrap script authored in this file
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
				<noscript>
					<iframe
						src={`https://www.googletagmanager.com/ns.html?id=${tagManagerId}`}
						height="0"
						width="0"
						style={{ display: "none", visibility: "hidden" }}
						title="Google Tag Manager"
					/>
				</noscript>

				<Script
					id="org-schema"
					type="application/ld+json"
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD of a constant organization object defined in this file
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
					<InstallCookTalePrompt />
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
