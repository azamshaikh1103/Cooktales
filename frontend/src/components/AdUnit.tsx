"use client";

import { useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		adsbygoogle: any[];
	}
}

type AdUnitProps = {
	type?: "banner" | "box";
	isPremium?: boolean;
	slot: string;
	className?: string;
};

const AdUnit = ({
	type = "banner",
	isPremium = false,
	slot,
	className = "",
}: AdUnitProps) => {
	const adRef = useRef<HTMLModElement>(null);

	useEffect(() => {
		if (isPremium) return;

		try {
			if (adRef.current && adRef.current.innerHTML === "") {
				(window.adsbygoogle = window.adsbygoogle || []).push({});
			}
		} catch (err) {
			console.error("AdSense error:", err);
		}
	}, [isPremium]);

	if (isPremium) return null;

	const containerClass =
		type === "banner"
			? "w-full h-[100px] md:h-[120px] my-8"
			: "w-full h-[280px] md:h-[300px] mb-8";

	return (
		<div
			className={`relative overflow-hidden rounded-2xl border transition-colors
        bg-gray-50 border-gray-200
        dark:bg-[#112220] dark:border-white/5 ${containerClass} ${className}`}
		>
			<span className="absolute top-2 right-2 z-20 text-[9px] font-bold uppercase tracking-widest text-gray-500/50 dark:text-gray-600">
				Advertisement
			</span>

			<div className="absolute inset-0 flex flex-col items-center justify-center text-center z-0 p-4">
				<p className="text-sm font-bold text-gray-500 dark:text-gray-600 mb-1">
					Support CookTale
				</p>
				<p className="text-[10px] text-gray-300 dark:text-gray-700 max-w-[200px]">
					Please consider disabling your adblocker to help us keep the kitchen
					running.
				</p>
			</div>
		</div>
	);
};

export default AdUnit;
