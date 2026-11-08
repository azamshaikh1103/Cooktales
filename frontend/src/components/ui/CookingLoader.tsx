"use client";

import { motion, useReducedMotion } from "framer-motion";

const STEAM_PATHS = [
	"M20 17c-2-3 2-5 0-8",
	"M32 17c-2-3 2-5 0-8",
	"M44 17c-2-3 2-5 0-8",
];

export default function CookingLoader({
	label = "Stirring up more recipes…",
}: {
	label?: string;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<div
			role="status"
			aria-live="polite"
			className="flex flex-col items-center gap-2 font-semibold text-[#006C5E] dark:text-[#4ADE80]"
		>
			<svg
				viewBox="0 0 64 56"
				className="h-12 w-14"
				fill="none"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
				strokeLinejoin="round"
				aria-hidden="true"
			>
				{STEAM_PATHS.map((d, index) => (
					<motion.path
						key={d}
						d={d}
						initial={{ opacity: reduceMotion ? 0.6 : 0, y: 4 }}
						animate={
							reduceMotion
								? { opacity: 0.6 }
								: { opacity: [0, 1, 0], y: [4, -4, -8] }
						}
						transition={{
							duration: 1.8,
							repeat: Number.POSITIVE_INFINITY,
							delay: index * 0.45,
							ease: "easeOut",
						}}
					/>
				))}
				<motion.g
					animate={reduceMotion ? undefined : { y: [0, -1.5, 0] }}
					transition={{
						duration: 0.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				>
					<path d="M10 22h44" />
				</motion.g>
				<path d="M13 22v14a10 10 0 0 0 10 10h18a10 10 0 0 0 10-10V22" />
				<path d="M13 28H7M51 28h6" />
			</svg>
			<span className="text-sm">{label}</span>
		</div>
	);
}
