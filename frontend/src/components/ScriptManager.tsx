"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

const analyticsMeasurementId =
	process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-WW9DP3T4V4";

declare global {
	interface Window {
		dataLayer?: unknown[][];
		gtag?: (...args: unknown[]) => void;
	}
}

export default function ScriptManager() {
	const pathname = usePathname();

	useEffect(() => {
		if (!analyticsMeasurementId) return;

		window.dataLayer = window.dataLayer || [];
		window.gtag =
			window.gtag ||
			((...args: unknown[]) => {
				window.dataLayer?.push(args);
			});
		window.gtag("js", new Date());
		window.gtag("config", analyticsMeasurementId, { send_page_view: false });
	}, []);

	useEffect(() => {
		if (!window.gtag) return;

		window.gtag?.("event", "page_view", {
			page_location: window.location.href,
			page_path: `${pathname}${window.location.search}`,
		});
	}, [pathname]);

	return (
		<Script
			id="google-analytics-loader"
			src={`https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`}
			strategy="afterInteractive"
		/>
	);
}
