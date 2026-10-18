"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCrown, FaTimes, FaShieldAlt, FaCheck } from "react-icons/fa";
import { toast } from "sonner";
import { paymentClient } from "@/lib/api/paymentClient";

interface UpgradeModalProps {
	isOpen: boolean;
	onClose: () => void;
	plan: "monthly" | "yearly" | "lifetime";
}

export default function UpgradeModal({
	isOpen,
	onClose,
	plan,
}: UpgradeModalProps) {
	const [loading, setLoading] = useState(false);

	let price;
	if (plan === "monthly") price = "$3.99";
	if (plan === "yearly") price = "$29.99";
	if (plan === "lifetime") price = "$79.99";

	const handlePayment = async () => {
		setLoading(true);
		try {
			const res = await paymentClient.createCheckout(plan);
			window.location.href = res.url;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to load checkout");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<div className="perspective-1000 fixed inset-0 z-90 flex items-center justify-center p-4">
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={onClose}
							className="absolute inset-0 bg-[#050a09]/90 backdrop-blur-xl"
						/>

						{/* The Golden Ticket */}
						<motion.div
							initial={{ scale: 0.9, rotateX: 10, y: 50 }}
							animate={{ scale: 1, rotateX: 0, y: 0 }}
							exit={{ scale: 0.9, rotateX: 10, y: 50 }}
							transition={{ type: "spring", bounce: 0.4 }}
							className="group relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-amber-500/30 bg-[#0d1f1c] shadow-2xl"
						>
							{/* Animated Shine */}
							<div className="oup-hover:animate-shimmer absolute inset-0 -translate-x-full bg-linear-to-tr from-transparent via-white/5 to-transparent" />

							{/* Top Banner */}
							<div className="h-2 w-full bg-linear-to-r from-amber-300 via-yellow-500 to-amber-600" />

							<button
								onClick={onClose}
								className="absolute top-5 right-5 z-20 cursor-pointer p-2 text-white/30 transition-colors hover:text-white"
							>
								<FaTimes />
							</button>

							<div className="p-10 text-center">
								{/* Logo Crown */}
								<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-amber-600 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
									<FaCrown className="text-5xl text-[#0d1f1c] drop-shadow-sm" />
								</div>

								<div className="mb-2 text-xs font-bold tracking-[0.3em] text-amber-500 uppercase">
									CookTale Elite
								</div>

								<h2 className="mb-8 text-4xl font-black text-white">
									Confirm Access
								</h2>

								{/* Receipt Box */}
								<div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-6 text-left">
									<div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
										<span className="font-medium text-gray-400">
											Plan Selected
										</span>
										<span className="rounded-lg bg-white/10 px-3 py-1 text-sm font-bold text-white capitalize">
											{plan}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="font-medium text-gray-400">Total Due</span>
										<span className="text-3xl font-black text-amber-400">
											{price}
										</span>
									</div>
								</div>

								<button
									onClick={handlePayment}
									disabled={loading}
									className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-600 py-4 text-lg font-black text-[#0d1f1c] shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-300 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
								>
									{loading ? (
										<span className="animate-pulse">Processing...</span>
									) : (
										<>
											Confirm Payment <FaCheck />
										</>
									)}
								</button>

								<div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-gray-600 uppercase">
									<FaShieldAlt /> 256-bit SSL Secure Payment
								</div>
							</div>
						</motion.div>
					</div>
				)}
			</AnimatePresence>
		</>
	);
}
