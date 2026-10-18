"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
	FaTimes,
	FaCheck,
	FaCrown,
	FaStar,
	FaArrowRight,
} from "react-icons/fa";

interface AdFreePopupProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AdFreePopup = ({ isOpen, onClose }: AdFreePopupProps) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-60 flex items-center justify-center px-4">
					{/* --- BACKDROP --- */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm"
					/>

					{/* --- MODAL CARD --- */}
					<motion.div
						initial={{ opacity: 0, scale: 0.9, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.9, y: 20 }}
						transition={{ type: "spring", duration: 0.5 }}
						className="relative w-full max-w-md overflow-hidden rounded-4xl border border-white/20 bg-white shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
					>
						{/* Close Button */}
						<button
							aria-label="Close Popup"
							onClick={onClose}
							className="absolute top-4 right-4 z-20 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white"
						>
							<FaTimes />
						</button>

						{/* Background Glow Blob */}
						<div className="pointer-events-none absolute top-0 left-1/2 h-40 w-full -translate-x-1/2 bg-amber-400/20 blur-[60px]" />

						<div className="relative z-10 p-8 text-center lg:p-10">
							{/* Badge */}
							<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-amber-400 to-orange-500 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-lg">
								<FaStar className="animate-spin-slow" /> Best Value
							</div>

							{/* Header */}
							<div className="mb-2 flex items-center justify-center gap-2 text-[#006C5E] dark:text-white">
								<FaCrown className="text-2xl text-amber-400" />
								<h2 className="text-3xl font-black tracking-tight">
									Sous Chef
								</h2>
							</div>
							<p className="mb-8 text-sm font-medium text-gray-500 dark:text-gray-500">
								Complete access to the culinary world.
							</p>

							{/* Pricing Block */}
							<div className="mb-8 rounded-3xl border border-gray-100 bg-gray-50 p-6 dark:border-white/5 dark:bg-black/20">
								<div className="mb-1 flex items-end justify-center gap-1 text-gray-900 dark:text-white">
									<span className="text-5xl font-black tracking-tighter">
										$29.99
									</span>
									<span className="mb-1.5 text-lg font-bold text-gray-500">
										/yr
									</span>
								</div>
								<div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-[#4ADE80]">
									Equivalent to $2.50/mo
								</div>
							</div>

							{/* Features List */}
							<ul className="mx-auto mb-8 max-w-[280px] space-y-3 text-left">
								<Feature text="Unlock 'Secret Family' Recipes" />
								<Feature text="Ad-Free, Focus Mode Reading" />
								<Feature text="Advanced Nutritional Data" />
								<Feature text="Unlimited Collections & Saves" />
								<Feature text="Direct Support to Creators (70%)" />
							</ul>

							{/* CTA Button */}
							<Link href="/membership" onClick={onClose}>
								<button className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-amber-400 to-orange-500 py-4 text-lg font-black text-white shadow-xl shadow-amber-500/20 transition-colors hover:from-amber-300 hover:to-orange-400">
									Join the Club <FaArrowRight />
								</button>
							</Link>

							<p className="mt-4 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:text-gray-500">
								Cancel anytime • Secure payment
							</p>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

// Helper Component
const Feature = ({ text }: { text: string }) => (
	<li className="flex items-start gap-3 text-sm font-bold text-gray-600 dark:text-gray-300">
		<div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#006C5E] text-[8px] text-white shadow-sm dark:bg-[#4ADE80] dark:text-black">
			<FaCheck />
		</div>
		<span className="leading-tight">{text}</span>
	</li>
);
