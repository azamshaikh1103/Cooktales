"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaCheck, FaLock } from "react-icons/fa";
import { useDispatch } from "react-redux";
import Navbar from "@/components/Navbar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { useAuth } from "@/lib/auth/AuthContext";
import imageLoader from "@/lib/loader";
import { setProfilePopup } from "@/lib/Slices/ProfileMenuPopup";
import { setTab } from "@/lib/Slices/tabSlice";

export default function Auth() {
	const dispatch = useDispatch();
	const router = useRouter();
	const { status } = useAuth();

	useEffect(() => {
		if (status === "authenticated") {
			router.replace("/");
		}
	}, [router, status]);

	if (status === "loading" || status === "authenticated") {
		return (
			<div className="min-h-screen bg-[#fafafa] transition-colors dark:bg-[#0d1f1c]">
				<Navbar />
			</div>
		);
	}

	const openLogin = () => {
		dispatch(setTab("login"));
		dispatch(setProfilePopup(false));
	};

	const openSignup = () => {
		dispatch(setTab("signup"));
		dispatch(setProfilePopup(false));
	};

	return (
		<div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fafafa] transition-colors duration-300 dark:bg-[#0d1f1c]">
			<Navbar />

			{/* --- BACKGROUNDS --- */}
			<div className="pointer-events-none absolute inset-0 z-0">
				{/* Hero Image - Blends into background based on mode */}
				<Image
					src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop"
					alt="Background"
					fill
					className="object-cover opacity-[0.03] mix-blend-overlay dark:opacity-20"
					loader={imageLoader}
				/>
				{/* Gradient Overlay: White fade in Light mode, Dark fade in Dark mode */}
				<div className="absolute inset-0 bg-linear-to-r from-[#fafafa] via-[#fafafa]/90 to-transparent dark:from-[#0d1f1c] dark:via-[#0d1f1c]/90 dark:to-transparent" />

				{/* Decorative Blobs */}
				<div className="absolute top-1/2 left-0 h-[800px] w-[800px] -translate-y-1/2 rounded-full bg-[#006C5E]/5 blur-[120px] dark:bg-[#006C5E]/20" />
			</div>

			{/* --- MAIN CONTENT --- */}
			<main className="relative z-10 flex grow items-center justify-center px-6 py-20 lg:px-24 lg:py-0">
				<div className="grid w-full max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
					{/* LEFT: The Pitch */}
					<div className="space-y-8">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#006C5E] uppercase shadow-sm dark:border-[#006C5E]/50 dark:bg-[#006C5E]/20 dark:text-[#4ADE80] dark:shadow-none">
							<FaLock className="text-xs" /> Members Only
						</div>

						{/* Headline */}
						<h1 className="text-5xl leading-[1.1] font-black tracking-tight text-gray-900 lg:text-7xl dark:text-white">
							Unlock your <br />
							<span className="bg-linear-to-r from-[#006C5E] to-[#009478] bg-clip-text text-transparent dark:from-[#4ADE80] dark:to-[#006C5E]">
								Culinary Potential.
							</span>
						</h1>

						<p className="max-w-lg text-lg leading-relaxed font-medium text-gray-500 dark:text-gray-500">
							Join a community of chefs. Save your favorite recipes, share
							useful stories, and find your next thing to cook.
						</p>

						{/* Feature List */}
						<ul className="space-y-4 pt-2">
							<FeatureItem text="Publish unlimited recipes & stories" />
							<FeatureItem text="Build your personal chef profile" />
							<FeatureItem text="Access exclusive community challenges" />
						</ul>

						{/* CTA Group */}
						<div className="flex flex-col gap-4 pt-6 sm:flex-row">
							<PrimaryActionButton
								onClick={openSignup}
								className="justify-center px-8 py-4 text-lg"
							>
								Get Started Free
							</PrimaryActionButton>

							<PrimaryActionButton
								onClick={openLogin}
								className="justify-center px-8 py-4 text-lg"
							>
								Sign In
							</PrimaryActionButton>
						</div>
					</div>

					{/* RIGHT: The Visual Hook (Card Stack) */}
					<div className="relative hidden h-[600px] w-full lg:block">
						{/* Glow Behind Cards */}
						<div className="absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100/50 blur-[100px] dark:bg-[#006C5E]/20" />

						{/* Floating Card 1 (Profile - Background) */}
						<div className="absolute top-10 right-10 z-0 w-72 rotate-6 rounded-4xl border border-gray-100 bg-white p-5 opacity-90 shadow-2xl transition-all duration-500 dark:border-white/20 dark:bg-white/10 dark:opacity-100 dark:backdrop-blur-xl">
							<div className="mb-6 flex items-center gap-3">
								<div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-white/20" />
								<div className="space-y-2">
									<div className="h-3 w-24 rounded-full bg-gray-100 dark:bg-white/20" />
									<div className="h-2 w-16 rounded-full bg-gray-50 dark:bg-white/10" />
								</div>
							</div>
							<div className="space-y-3">
								<div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10" />
								<div className="h-2 w-5/6 rounded-full bg-gray-100 dark:bg-white/10" />
							</div>
						</div>

						{/* Floating Card 2 (Recipe - Main Focus) */}
						<div className="absolute top-1/2 left-1/2 z-10 w-80 -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-[2.5rem] border border-gray-50 bg-white p-5 text-gray-900 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:rotate-0 dark:border-white/5 dark:bg-[#1a2c29] dark:text-white dark:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
							<div className="relative mb-5 h-56 w-full overflow-hidden rounded-4xl bg-gray-100 shadow-inner dark:bg-black/20">
								<Image
									src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop"
									alt="Food"
									fill
									className="object-cover"
									loader={imageLoader}
								/>
								<div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900 shadow-sm backdrop-blur-md">
									4.9 ★
								</div>
							</div>

							<div className="px-2">
								<h3 className="mb-1 text-2xl font-black">Spicy Basil Pasta</h3>
								<p className="mb-4 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-500">
									by Chef Mario
								</p>

								<div className="flex gap-2 border-t border-gray-100 pt-2 dark:border-white/10">
									<span className="rounded-xl bg-green-50 px-3 py-1.5 text-xs font-bold text-[#006C5E] dark:bg-[#006C5E]/20 dark:text-[#4ADE80]">
										Healthy
									</span>
									<span className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
										20m
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}

// Helper Component with Dark Mode support
const FeatureItem = ({ text }: { text: string }) => (
	<li className="flex items-center gap-4 text-lg font-semibold text-gray-600 transition-colors dark:text-gray-300">
		<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#006C5E]/10 text-xs text-[#006C5E] dark:bg-[#006C5E] dark:text-white">
			<FaCheck />
		</span>
		{text}
	</li>
);
