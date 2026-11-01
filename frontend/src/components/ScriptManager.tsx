"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

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
	const isInitialPageView = useRef(true);

	useEffect(() => {
		if (isInitialPageView.current) {
			isInitialPageView.current = false;
			return;
		}

		window.gtag?.("config", analyticsMeasurementId, {
			page_location: window.location.href,
			page_path: `${pathname}${window.location.search}`,
		});
	}, [pathname]);

	return null;
}
