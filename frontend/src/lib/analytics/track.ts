import type { AnalyticsEventName, AnalyticsEventParams } from "./catalog";

declare global {
	interface Window {
		dataLayer?: Record<string, unknown>[];
	}
}

/**
 * Sends one analytics event to Google Tag Manager's dataLayer.
 *
 * Params travel under `ct_params`. It is reset to null before every event so values from a
 * previous event can never leak into the next one (the dataLayer remembers old keys).
 * Never include personal data (emails, names, free-text the user wrote).
 */
export function track<E extends AnalyticsEventName>(
	event: E,
	params: AnalyticsEventParams<E> = {} as AnalyticsEventParams<E>,
) {
	if (typeof window === "undefined") return;
	try {
		window.dataLayer = window.dataLayer ?? [];
		window.dataLayer.push({ ct_params: null });
		const clean = Object.fromEntries(
			Object.entries(params).filter(
				([, value]) => value !== undefined && value !== null && value !== "",
			),
		);
		window.dataLayer.push({ event, ct_params: clean });
	} catch {
		// Analytics must never break the product.
	}
}

/** Persistent context attached to every later event (kept by the dataLayer on purpose). */
export function setAnalyticsUser({ loggedIn }: { loggedIn: boolean }) {
	if (typeof window === "undefined") return;
	try {
		window.dataLayer = window.dataLayer ?? [];
		window.dataLayer.push({ logged_in: loggedIn });
	} catch {
		// ignore
	}
}
