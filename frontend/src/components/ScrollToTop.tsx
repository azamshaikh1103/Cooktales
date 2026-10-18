"use client";

import { useEffect } from "react";

export default function ScrollToTop() {
	useEffect(() => {
		// Immediate scroll reset
		window.scrollTo(0, 0);

		// Safari/Chrome sometimes fight back, so we double-tap
		const timeout = setTimeout(() => {
			window.scrollTo(0, 0);
		}, 100);

		// Disable browser's native scroll restoration
		if ("scrollRestoration" in history) {
			history.scrollRestoration = "manual";
		}

		return () => {
			clearTimeout(timeout);
			if ("scrollRestoration" in history) {
				history.scrollRestoration = "auto";
			}
		};
	}, []);

	return null;
}
