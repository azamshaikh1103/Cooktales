"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { useCookieConsent } from "@/lib/context/CookieContext";

const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
const analyticsMeasurementId =
	process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-WW9DP3T4V4";

declare global {
	interface Window {
		dataLayer?: unknown[][];
		gtag?: (...args: unknown[]) => void;
	}
}

export default function ScriptManager() {
	const { consent } = useCookieConsent();
	const pathname = usePathname();

	useEffect(() => {
		if (!consent.analytics) return;

		window.dataLayer = window.dataLayer || [];
		window.gtag =
			window.gtag ||
			((...args: unknown[]) => {
				window.dataLayer?.push(args);
			});
		window.gtag("js", new Date());
		window.gtag("config", analyticsMeasurementId, { send_page_view: false });
	}, [consent.analytics]);

	useEffect(() => {
		if (!consent.analytics || !window.gtag) return;

		window.gtag?.("event", "page_view", {
			page_location: window.location.href,
			page_path: `${pathname}${window.location.search}`,
		});
	}, [consent.analytics, pathname]);

	return (
		<>
			{/* --- 1. GOOGLE ADSENSE --- */}
			{consent.advertising && adsenseId && (
				<Script
					async
					id="adsbygoogle-init"
					strategy="afterInteractive"
					src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
					crossOrigin="anonymous"
				/>
			)}
			{consent.analytics && analyticsMeasurementId && (
				<Script
					id="google-analytics-loader"
					src={`https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`}
					strategy="afterInteractive"
				/>
			)}
		</>
	);
}
