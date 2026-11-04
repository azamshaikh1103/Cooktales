"use client";

import { useEffect, useRef } from "react";

const GENTLE_MESSAGES = [
	"Back in a sec, chef?",
	"Your pan is getting lonely.",
	"Nothing's burning. Yet.",
	"Your recipe will wait for you.",
];

const NUDGE_MESSAGES = [
	"Chef? Chef?? CHEF??",
	"The potatoes are asking where you went.",
	"Dinner plans are cooling off.",
	"Your ingredients believed in you.",
];

const PATIENT_MESSAGES = [
	"Your recipe will be right where you left it.",
	"Take your time. Dinner will wait.",
	"Still here. Salted and waiting.",
];

export const getTabMessage = (awayForMs: number, position: number) => {
	const messages =
		awayForMs >= 180_000
			? PATIENT_MESSAGES
			: awayForMs >= 60_000
				? NUDGE_MESSAGES
				: GENTLE_MESSAGES;

	return messages[position % messages.length];
};

export default function TabManager() {
	const originalTitle = useRef<string | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const hiddenAtRef = useRef<number | null>(null);
	const messagePositionRef = useRef(0);

	useEffect(() => {
		if (!originalTitle.current) originalTitle.current = document.title;

		const handleVisibilityChange = () => {
			if (document.hidden) {
				hiddenAtRef.current = Date.now();
				messagePositionRef.current = 0;
				if (intervalRef.current) clearInterval(intervalRef.current);
				const updateTitle = () => {
					const awayForMs = Date.now() - (hiddenAtRef.current || Date.now());
					document.title = getTabMessage(awayForMs, messagePositionRef.current);
					messagePositionRef.current += 1;
				};

				updateTitle();
				intervalRef.current = setInterval(() => {
					updateTitle();
				}, 12_000);
			} else {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
				hiddenAtRef.current = null;
				if (originalTitle.current) {
					document.title = originalTitle.current;
				}
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);

	return null;
}
