"use client";

import { useEffect, useRef } from "react";

const MESSAGES = [
	"Dear, come back please! 🥺",
	"Your food is getting cold... 🍜",
	"Don't leave me hungry! 😭",
	"Cooking paused... ⏸️",
	"Psst... the secret ingredient is here 🤫",
	"We miss you already! 💔",
];

export default function TabManager() {
	const originalTitle = useRef<string | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!originalTitle.current) originalTitle.current = document.title;

		const handleVisibilityChange = () => {
			if (document.hidden) {
				const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
				let tickerText = ` ${message}  —  ${message}  —  `;

				if (intervalRef.current) clearInterval(intervalRef.current);

				intervalRef.current = setInterval(() => {
					document.title = tickerText;
					tickerText = tickerText.substring(1) + tickerText.substring(0, 1);
				}, 400);
			} else {
				if (intervalRef.current) {
					clearInterval(intervalRef.current);
					intervalRef.current = null;
				}
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
