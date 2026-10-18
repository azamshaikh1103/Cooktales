"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FaCookieBite, FaTimes } from "react-icons/fa";
import { useCookieConsent } from "@/lib/context/CookieContext";

export default function CookieConsent() {
	const { consent, updateConsent, isLoading } = useCookieConsent();
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (isLoading) return;
		if (consent.hasInteracted) {
			setIsVisible(false);
			return;
		}

		const timer = setTimeout(() => setIsVisible(true), 1500);

		return () => clearTimeout(timer);
	}, [isLoading, consent.hasInteracted]);

	const handleAcceptAll = () => {
		updateConsent({ analytics: true, advertising: true });
		setIsVisible(false);
	};

	const handleDecline = () => {
		updateConsent({ analytics: false, advertising: false });
		setIsVisible(false);
	};

	if (isLoading) return null;

	return (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: "spring", stiffness: 300, damping: 30 }}
					className="fixed right-6 bottom-6 z-100 w-full max-w-sm px-4 md:px-0"
				>
					<div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-[#152a26]">
						<div className="relative z-10">
							<div className="mb-4 flex items-start gap-4">
								<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/20 dark:text-[#4ADE80]">
									<FaCookieBite className="text-lg" />
								</div>
								<div>
									<h4 className="text-lg font-bold text-gray-900 dark:text-white">
										Cookie preferences
									</h4>
									<p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
										We use cookies to ensure you get the best experience. Some
										are essential, others help us serve you better recipes.
									</p>
								</div>
							</div>

							<div className="flex flex-col gap-3">
								<div className="flex gap-3">
									<button
										onClick={handleDecline}
										className="flex-1 cursor-pointer rounded-xl border border-gray-200 bg-transparent py-2.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
									>
										Necessary Only
									</button>
									<button
										onClick={handleAcceptAll}
										className="flex-1 cursor-pointer rounded-xl bg-[#006C5E] py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
									>
										Accept All
									</button>
								</div>

								<Link
									href="/cookies"
									className="text-center text-[10px] font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
								>
									Manage Preferences
								</Link>
							</div>
						</div>

						<button
							aria-label="Close"
							onClick={handleDecline}
							className="absolute top-4 right-4 cursor-pointer text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-white"
						>
							<FaTimes />
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
