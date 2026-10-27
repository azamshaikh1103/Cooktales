"use client";

import Link from "next/link";
import {
	FaFacebookF,
	FaInstagram,
	FaYoutube,
	FaArrowRight,
	FaEnvelope,
	FaTwitter,
	FaCheck,
} from "react-icons/fa";
import { useState } from "react";
import { newsletterClient } from "@/lib/api/newsletterClient";
import { toast } from "sonner";
import { BiLoaderAlt } from "react-icons/bi";

const Footer = () => {
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const handleSubscribe = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const res = await newsletterClient.subscribe(email);
			toast.success(res.message);
			setIsSuccess(true);
			setEmail("");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Newsletter signup is unavailable right now.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<footer className="relative w-full overflow-hidden rounded-t-[2.5rem] bg-[#006C5E] text-white transition-colors duration-500 lg:rounded-t-[4rem] dark:border-t dark:border-white/5 dark:bg-[#0a1a18]">
			{/* --- BACKGROUND ACCENTS --- */}
			<div
				className="pointer-events-none absolute inset-0 opacity-10"
				style={{
					backgroundImage:
						"radial-gradient(circle, white 1px, transparent 1px)",
					backgroundSize: "30px 30px",
				}}
			/>

			{/* Giant Watermark */}
			<div className="pointer-events-none absolute bottom-0 left-0 -translate-x-10 translate-y-1/3 opacity-[0.05] select-none">
				<span className="text-[20vw] leading-none font-black text-white dark:text-[#006C5E]">
					COOKTALE
				</span>
			</div>

			{/* Glow Blob (Dark Mode Only) */}
			<div className="pointer-events-none absolute top-0 right-0 hidden h-[500px] w-[500px] rounded-full bg-[#006C5E]/20 blur-[150px] dark:block" />

			<div className="relative z-10 container mx-auto px-6 pt-16 pb-12 lg:px-24 lg:pt-24">
				{/* --- TOP SECTION: CTA & NEWSLETTER --- */}
				<div className="mb-20 flex flex-col items-start justify-between gap-10 border-b border-white/20 pb-16 lg:flex-row lg:items-end">
					{/* Headline */}
					<div className="lg:w-1/2">
						<div className="mb-4 text-xs font-bold tracking-widest text-[#A3E6DE] uppercase dark:text-[#4ADE80]">
							Join the Movement
						</div>
						<h2 className="mb-6 text-4xl leading-tight font-black text-white lg:text-6xl">
							Experience the taste of <br /> your own food.
						</h2>
						<Link
							href="/recipe"
							className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-[#006C5E] shadow-xl transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:bg-[#006C5E] dark:text-white dark:hover:bg-[#005a4e]"
						>
							Start Cooking Now
							<FaArrowRight className="transition-transform group-hover:translate-x-1" />
						</Link>
					</div>

					{/* Newsletter Box */}
					<div className="w-full rounded-3xl border border-white/10 bg-[#005a4e] p-8 shadow-lg transition-colors lg:w-1/3 dark:border-white/10 dark:bg-white/5">
						<h3 className="mb-2 text-xl font-bold text-white">
							Weekly Inspiration
						</h3>
						<p className="mb-4 text-sm text-white/70">
							Get curated recipes and chef tips delivered to your inbox.
						</p>

						<form onSubmit={handleSubscribe}>
							<div className="flex rounded-xl border border-white/10 bg-[#00463d] p-1 transition-colors focus-within:border-white/50 dark:bg-black/20">
							<div className="flex items-center pl-3 text-white/40">
								<FaEnvelope />
							</div>
							<input
								type="email"
								required
								disabled={isLoading || isSuccess}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder={
									isSuccess ? "You're subscribed!" : "Enter your email"
								}
								className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
							/>
							<button
								type="submit"
								disabled={isLoading || isSuccess}
								className={`flex min-w-[80px] cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-all ${
									isSuccess
										? "bg-green-500 text-white"
										: "bg-[#006C5E] text-white hover:bg-[#007d6d] dark:bg-white dark:text-black dark:hover:bg-gray-200"
								}`}
							>
								{isLoading ? (
									<BiLoaderAlt className="animate-spin" />
								) : isSuccess ? (
									<FaCheck />
								) : (
									"Join"
								)}
							</button>
							</div>
							<p className="mt-3 text-xs leading-relaxed text-white/55">
								By joining, you agree to receive CookTale emails. Unsubscribe anytime.
							</p>
						</form>
					</div>
				</div>

				{/* --- MIDDLE SECTION: LINKS GRID --- */}
				<div className="mb-16 grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-8">
					{/* Brand Column */}
					<div className="col-span-2 md:col-span-1">
						<h3 className="mb-6 text-2xl font-bold tracking-tight text-white">
							CookTale.
						</h3>
						<p className="mb-6 max-w-xs text-sm leading-relaxed text-white/60">
							Empowering home chefs to explore, create, and share the joy of
							cooking with the world.
						</p>
					</div>

					{/* Column 1 */}
					<div className="flex flex-col gap-4">
						<h4 className="mb-2 text-lg font-bold text-white">Discover</h4>
						<Link
							href="/recipe"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Recipes
						</Link>
						<Link
							href="/stories"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Stories
						</Link>
						<Link
							href="/community"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Community
						</Link>
						<Link
							href="/search"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Advanced Search
						</Link>
					</div>

					{/* Column 2 */}
					<div className="flex flex-col gap-4">
						<h4 className="mb-2 text-lg font-bold text-white">Company</h4>
						<Link
							href="/about"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							About Us
						</Link>
						<Link
							href="/contact"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Contact
						</Link>
						<Link
							href="/careers"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Careers
						</Link>
						<Link
							href="/partners"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Partners
						</Link>
					</div>

					{/* Column 3 */}
					<div className="flex flex-col gap-4">
						<h4 className="mb-2 text-lg font-bold text-white">Legal</h4>
						<Link
							href="/privacy"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Privacy Policy
						</Link>
						<Link
							href="/terms"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Terms of Service
						</Link>
						<Link
							href="/cookies"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Cookie Policy
						</Link>
						<Link
							href="/community-guidelines"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Community Guidelines
						</Link>
						<Link
							href="/refunds"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Refund & Cancellation
						</Link>
						<Link
							href="/site-map"
							className="text-sm text-white/70 transition-colors hover:text-white"
						>
							Sitemap
						</Link>
					</div>
				</div>

				{/* --- BOTTOM SECTION: COPYRIGHT & SOCIALS --- */}
				<div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
					<div className="text-xs font-medium text-white/60">
						© 2026 COOKTALE INC. ALL RIGHTS RESERVED.
					</div>

					<div className="flex gap-4">
						<SocialLink
							href="https://instagram.com/cooktale.in"
							label="Instagram"
							icon={<FaInstagram />}
						/>
						<SocialLink
							href="https://facebook.com/cooktale.in"
							label="Facebook"
							icon={<FaFacebookF />}
						/>
						<SocialLink
							href="https://youtube.com/cooktale.in"
							label="Youtube"
							icon={<FaYoutube />}
						/>
						<SocialLink
							href="https://x.com/cooktaleapp"
							label="X"
							icon={<FaTwitter />}
						/>
					</div>
				</div>
			</div>
		</footer>
	);
};

// Helper for Social Icons
const SocialLink = ({
	href,
	label,
	icon,
}: {
	href: string;
	label: string;
	icon: React.ReactNode;
}) => (
	<Link
		href={href}
		target="_blank"
		aria-label={label}
		className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all duration-300 hover:bg-white hover:text-[#006C5E] dark:hover:border-[#006C5E] dark:hover:bg-[#006C5E] dark:hover:text-white"
	>
		{icon}
	</Link>
);

export default Footer;
