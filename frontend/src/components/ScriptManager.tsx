"use client";

import Script from "next/script";
import { useCookieConsent } from "@/lib/context/CookieContext";

const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID;
const analyticsMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function ScriptManager() {
	const { consent } = useCookieConsent();

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
				<>
					<Script
						src={`https://www.googletagmanager.com/gtag/js?id=${analyticsMeasurementId}`}
						strategy="afterInteractive"
					/>
					<Script id="google-analytics" strategy="afterInteractive">
						{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${analyticsMeasurementId}');
            `}
					</Script>
				</>
			)}
		</>
	);
}
