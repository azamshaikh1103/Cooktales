"use client";

import { useEffect } from "react";
import { newScrollMilestones } from "./catalog";
import { track } from "./track";

/** Reports how far readers scroll a recipe or story (25 / 50 / 75 / 90%), once each per view. */
export function useScrollDepth(
	contentType: "recipe" | "story",
	contentId: string | undefined,
) {
	useEffect(() => {
		if (!contentId) return;
		const reported = new Set<number>();
		let frame = 0;

		const check = () => {
			frame = 0;
			const scrollable = document.documentElement.scrollHeight;
			if (scrollable <= 0) return;
			const percent = ((window.scrollY + window.innerHeight) / scrollable) * 100;
			for (const milestone of newScrollMilestones(percent, reported)) {
				reported.add(milestone);
				track("scroll_depth", {
					content_type: contentType,
					content_id: contentId,
					scroll_percent: milestone,
				});
			}
		};
		const onScroll = () => {
			if (!frame) frame = window.requestAnimationFrame(check);
		};

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => {
			window.removeEventListener("scroll", onScroll);
			if (frame) window.cancelAnimationFrame(frame);
		};
	}, [contentType, contentId]);
}
