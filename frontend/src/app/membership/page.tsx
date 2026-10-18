"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
	FaCheck,
	FaTimes,
	FaCrown,
	FaStar,
	FaArrowRight,
	FaLock,
	FaInfinity,
} from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import imageloader from "@/lib/loader";
import { redirect } from "next/navigation";
import UpgradeModal from "@/components/UpgradeModal";

// const PremiumItem = ({ text }: { text: string }) => (
//   <li className="flex items-center gap-4">
//     <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[10px] text-white shadow-lg">
//       <FaCheck />
//     </div>
//     <span className="font-semibold tracking-wide text-gray-200">{text}</span>
//   </li>
// );

export default function MembershipPage() {
	const [billing, setBilling] = useState<"monthly" | "yearly" | "lifetime">(
		"yearly",
	);

	const [showUpgrade, setShowUpgrade] = useState(false);

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] font-sans transition-colors duration-500 selection:bg-[#006C5E] selection:text-white dark:bg-[#0d1f1c] dark:selection:bg-[#4ADE80]">
			<Navbar />

			<main className="relative grow overflow-hidden pt-24 pb-20 lg:pt-32">
				{/* --- BACKGROUNDS --- */}
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 rounded-full bg-green-100 opacity-30 blur-[120px] transition-colors duration-700 dark:bg-[#006C5E]/20" />
				</div>

				{/* --- HEADER --- */}
				<div className="relative z-10 container mx-auto mb-12 px-6 text-center lg:px-24">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#006C5E]/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-[#006C5E] uppercase dark:bg-[#006C5E]/20 dark:text-[#4ADE80]"
					>
						<FaCrown className="text-sm" /> The Chef's Table
					</motion.div>

					<h1 className="mb-6 text-5xl leading-[1.1] font-black text-gray-900 lg:text-7xl dark:text-white">
						Stop Cooking. <br />
						<span className="bg-linear-to-r from-[#006C5E] to-[#009478] bg-clip-text text-transparent dark:from-[#4ADE80] dark:to-[#006C5E]">
							Start Creating.
						</span>
					</h1>
				</div>

				{/* --- 3-WAY TOGGLE --- */}
				<div className="relative z-10 mb-16 flex justify-center">
					<div className="relative flex rounded-full border bg-gray-100 p-1.5 transition-colors dark:border-white/10 dark:bg-white/10">
						{["monthly", "yearly", "lifetime"].map((type) => (
							<button
								key={type}
								onClick={() => setBilling(type as any)}
								className={`relative z-10 flex cursor-pointer items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition-colors duration-300 ${billing === type ? "text-gray-900 dark:text-gray-900" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
							>
								{type === "monthly" && "Monthly"}
								{type === "yearly" && "Yearly"}
								{type === "lifetime" && "Lifetime"}

								{type === "yearly" && (
									<span className="rounded bg-green-500 px-1.5 py-0.5 text-[9px] text-white">
										Save 38%
									</span>
								)}
								{type === "lifetime" && (
									<span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] text-black">
										LTD
									</span>
								)}

								{billing === type && (
									<motion.div
										layoutId="billing-tab"
										className="absolute inset-0 z-[-1] rounded-full bg-white shadow-sm"
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
									/>
								)}
							</button>
						))}
					</div>
				</div>

				{/* --- PRICING CARDS --- */}
				<div className="relative z-10 container mx-auto px-4 lg:px-24">
					{/* LIFETIME DEAL VIEW (Special Layout) */}
					{billing === "lifetime" ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-[#006C5E]/25 bg-white text-gray-900 shadow-xl shadow-[#006C5E]/10 dark:bg-[#152a26] dark:text-white"
						>
							<div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
								<div className="flex flex-col justify-center p-8 sm:p-12">
									<div className="mb-5 inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#006C5E] uppercase dark:text-[#4ADE80]">
										<FaInfinity /> Lifetime access
									</div>
									<h2 className="mb-5 text-4xl leading-tight font-black sm:text-5xl">
										One payment.
										<br />
										Keep your kitchen.
									</h2>
									<p className="mb-8 max-w-xl leading-relaxed text-gray-600 dark:text-gray-300">
										A single purchase for ongoing Sous Chef access. There is no
										renewal date and no subscription to remember.
									</p>
									<div className="mb-8 flex items-baseline gap-2">
										<span className="text-6xl font-black">$79.99</span>
										<span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
											one time
										</span>
									</div>
									<button
										onClick={() => setShowUpgrade(true)}
										className="w-full cursor-pointer rounded-xl bg-[#006C5E] py-4 text-lg font-black text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#86efac]"
									>
										Get lifetime access
									</button>
								</div>

								<div className="border-t border-[#006C5E]/15 bg-[#f3f8f6] p-8 lg:border-t-0 lg:border-l lg:p-12 dark:bg-black/10">
									<h3 className="mb-7 text-xs font-bold tracking-[0.16em] text-[#006C5E] uppercase dark:text-[#4ADE80]">
										Included for good
									</h3>
									<ul className="space-y-4">
										<PremiumItem text="Everything in Sous Chef" />
										<PremiumItem text="No renewal payments" />
										<PremiumItem text="Ad-free recipe and story reading" />
										<PremiumItem text="Nutrition and portion tools" />
										<PremiumItem text="Support for CookTale creators" />
									</ul>
								</div>
							</div>
						</motion.div>
					) : (
						/* STANDARD GRID (Monthly/Yearly) */
						<div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
							{/* Free Tier */}
							<div className="order-2 lg:order-1">
								<div className="rounded-[2.5rem] border border-gray-200 bg-white p-10 opacity-80 transition-all duration-300 hover:opacity-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
									<h3 className="mb-2 text-2xl font-bold text-gray-500 dark:text-gray-500">
										Guest
									</h3>
									<div className="mb-6 text-4xl font-black text-gray-900 dark:text-white">
										$0
									</div>
									<p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-500">
										Good for browsing, but you'll be missing out on the secret
										sauce.
									</p>
									<ul className="mb-8 space-y-4">
										<ListItem text="Public Recipes Only" check />
										<ListItem text="Standard Search" check />
										<ListItem text="Ads Enabled" cross />
										<ListItem text="No Secret Ingredients" cross />
										<ListItem text="No Portion Calculator" cross />
									</ul>
									<button
										onClick={() => redirect("/")}
										className="w-full cursor-pointer rounded-xl border-2 border-gray-200 py-3 font-bold text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-900 dark:border-white/20 dark:text-gray-500 dark:hover:border-white dark:hover:text-white"
									>
										Stay as Guest
									</button>
								</div>
							</div>

							{/* Pro Tier */}
							<div className="relative order-1 lg:order-2">
								<div className="absolute inset-0 rounded-full bg-[#006C5E] opacity-40 blur-[60px] dark:opacity-30" />
								<div className="relative rounded-[2.5rem] border border-[#006C5E]/30 bg-[#0d1f1c] p-10 text-white shadow-2xl shadow-[#006C5E]/30 lg:p-14 dark:border-[#006C5E]/50 dark:bg-[#0f2925] dark:shadow-[#006C5E]/20">
									<div className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-linear-to-r from-green-400 to-green-500 px-6 py-2 text-xs font-black tracking-widest text-white uppercase shadow-lg">
										<FaStar className="animate-spin-slow" /> Chef's Choice
									</div>
									<div className="mt-4 mb-10 text-center">
										<h3 className="mb-2 flex items-center justify-center gap-2 text-3xl font-black text-white">
											Sous Chef <FaCrown className="text-green-400" />
										</h3>
										<p className="text-sm text-gray-400">
											Complete access to the culinary world.
										</p>
									</div>
									<div className="mb-2 flex items-end justify-center gap-1 text-white">
										<span className="text-6xl font-black tracking-tighter">
											${billing === "monthly" ? "3.99" : "29.99"}
										</span>
										<span className="mb-2 text-xl font-medium text-gray-500">
											/{billing === "monthly" ? "mo" : "yr"}
										</span>
									</div>
									<p className="mb-10 h-6 text-center text-sm font-medium text-green-400/80">
										{billing === "yearly"
											? "Equivalent to $2.50/mo"
											: "Less than a cup of coffee."}
									</p>
									<div className="mb-12 space-y-5">
										<PremiumItem text="Unlock Chef-Exclusive Recipes" />
										<PremiumItem text="Zero Ads & Cinema Mode" />
										<PremiumItem text="Macro & Nutrition Tracking" />
										<PremiumItem text="Personal AI Sous Chef" />
										<PremiumItem text="70% Revenue Share to Chefs" />
									</div>
									<button
										onClick={() => setShowUpgrade(true)}
										className="group flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-[#006C5E] to-[#008a7a] py-5 text-lg font-black text-white shadow-lg shadow-[#006C5E]/40 transition-colors hover:from-[#005a4e] hover:to-[#00786b]"
									>
										Join the Club <FaArrowRight />
									</button>
									<p className="mt-4 text-center text-[10px] tracking-widest text-gray-500 uppercase">
										Secure • Cancel Anytime
									</p>
								</div>
							</div>

							{/* Visual Hook */}
							<div className="order-3 hidden lg:block">
								<div className="group relative aspect-3/4 w-full overflow-hidden rounded-[2.5rem] border border-gray-100 shadow-xl dark:border-white/10">
									<Image
										src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1000&auto=format&fit=crop"
										alt="Locked"
										fill
										className="object-cover blur-md"
										loader={imageloader}
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-6 text-center">
										<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 text-2xl text-white shadow-inner backdrop-blur-md">
											<FaLock />
										</div>
										<h4 className="mb-2 text-xl font-bold text-white">
											Grandma's Secret Lasagna
										</h4>
										<p className="text-xs text-white/80">
											This recipe is locked for Guests.
										</p>
										<div className="mt-6 inline-block rounded-lg bg-[#006C5E] px-4 py-2 text-xs font-bold text-white">
											Unlock with Pro
										</div>
									</div>
								</div>
								<p className="mt-4 text-center text-xs text-gray-500 italic">
									"I joined just for this recipe. Totally worth it." — Sarah J.
								</p>
							</div>
						</div>
					)}
				</div>
			</main>
			<Footer />
			<UpgradeModal
				isOpen={showUpgrade}
				onClose={() => setShowUpgrade(false)}
				plan={billing}
			/>
		</div>
	);
}

// --- COMPONENTS ---

const ListItem = ({
	text,
	check = false,
	cross = false,
}: {
	text: string;
	check?: boolean;
	cross?: boolean;
}) => (
	<li
		className={`flex items-center gap-3 text-sm font-medium ${cross ? "text-gray-500 line-through decoration-current opacity-50" : "text-gray-600 dark:text-gray-300"}`}
	>
		{check && (
			<FaCheck className="shrink-0 text-[#006C5E] dark:text-[#4ADE80]" />
		)}
		{cross && <FaTimes className="shrink-0" />}
		{text}
	</li>
);

const PremiumItem = ({ text }: { text: string }) => (
	<li className="flex items-center gap-4">
		<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006C5E] text-[10px] text-white dark:bg-[#4ADE80] dark:text-[#0d1f1c]">
			<FaCheck />
		</div>
		<span className="font-semibold text-gray-700 dark:text-gray-200">
			{text}
		</span>
	</li>
);
