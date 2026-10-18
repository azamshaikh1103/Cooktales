"use client";

import { useEffect, useState } from "react";
import { FaEnvelope, FaUsers } from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const SECTIONS = [
	{ id: "purpose", label: "1. Our community" },
	{ id: "post", label: "2. What you can post" },
	{ id: "conduct", label: "3. Treat people well" },
	{ id: "safety", label: "4. Safety and rights" },
	{ id: "moderation", label: "5. Moderation" },
	{ id: "reports", label: "6. Reporting a problem" },
];

export default function CommunityGuidelinesPage() {
	const [activeSection, setActiveSection] = useState("purpose");

	useEffect(() => {
		const handleScroll = () => {
			const position = window.scrollY + 200;
			for (const section of SECTIONS) {
				const element = document.getElementById(section.id);
				if (element && element.offsetTop <= position)
					setActiveSection(section.id);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-gray-100">
			<Navbar />
			<main className="grow pt-24 pb-20 lg:pt-32">
				<div className="container mx-auto px-6 lg:px-24">
					<header className="mb-16 max-w-4xl lg:mb-24">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:border-white/10 dark:bg-white/5 dark:text-[#4ADE80]">
							<FaUsers /> Community
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
							Community Guidelines
						</h1>
						<p className="max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
							Last updated: September 5, 2026. These guidelines help make
							CookTale useful, safe, and welcoming for everyone.
						</p>
					</header>

					<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24">
						<aside className="hidden lg:col-span-3 lg:block">
							<nav
								className="sticky top-32 space-y-1"
								aria-label="Community guideline sections"
							>
								<p className="mb-6 ml-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
									Contents
								</p>
								{SECTIONS.map((section) => (
									<button
										type="button"
										key={section.id}
										onClick={() =>
											document
												.getElementById(section.id)
												?.scrollIntoView({ behavior: "smooth", block: "start" })
										}
										className={`w-full cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors ${activeSection === section.id ? "bg-[#006C5E]/5 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
									>
										{section.label}
									</button>
								))}
							</nav>
						</aside>

						<div className="space-y-16 lg:col-span-9">
							<GuidelineSection id="purpose" title="1. Our community">
								<p>
									CookTale is for people who enjoy cooking, learning, and
									sharing food. We welcome different cultures, skill levels,
									diets, and opinions. Be helpful, honest, and respectful.
								</p>
							</GuidelineSection>

							<GuidelineSection id="post" title="2. What you can post">
								<List
									items={[
										"Share recipes, food stories, reviews, tips, and comments that are useful and truthful.",
										"Use photos, videos, and text that you created or have permission to use.",
										"Make clear when a post includes a paid partnership, affiliate link, or promotion.",
										"Keep private information, such as phone numbers, addresses, passwords, and payment details, out of public posts.",
									]}
								/>
							</GuidelineSection>

							<GuidelineSection id="conduct" title="3. Treat people well">
								<List
									items={[
										"Do not harass, threaten, shame, discriminate against, or target another person.",
										"Do not spam, mislead people, impersonate others, or repeatedly post unwanted promotions.",
										"Disagree with ideas without attacking the person who shared them.",
										"Do not manipulate reviews, likes, follows, or other community activity.",
									]}
								/>
							</GuidelineSection>

							<GuidelineSection id="safety" title="4. Safety and rights">
								<p>
									Do not share dangerous instructions, illegal content, or
									content that encourages self-harm or harm to others. Recipes
									are shared for general information, so readers must still
									check allergens, ingredients, and safe cooking temperatures.
								</p>
								<p>
									Respect copyright, privacy, and other people&apos;s rights. Do
									not copy someone&apos;s recipe, photo, or story and present it
									as your own.
								</p>
							</GuidelineSection>

							<GuidelineSection id="moderation" title="5. Moderation">
								<p>
									We may remove content, limit features, or suspend accounts
									that break these guidelines, our Terms of Service, or the law.
									We make these decisions to protect people and the CookTale
									community. We may act quickly when there is a safety,
									security, or legal risk.
								</p>
							</GuidelineSection>

							<GuidelineSection id="reports" title="6. Reporting a problem">
								<p>
									Use the report option on a post when available. For urgent
									safety concerns, copyright concerns, or a decision you believe
									was wrong, email us with a link to the content, a short
									explanation, and any useful evidence.
								</p>
								<a
									href="mailto:legal@cooktale.in"
									className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#006C5E] px-6 py-3 font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
								>
									<FaEnvelope /> legal@cooktale.in
								</a>
							</GuidelineSection>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

function GuidelineSection({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<section
			id={id}
			className="scroll-mt-32 prose prose-lg max-w-none text-gray-600 dark:prose-invert dark:text-gray-400"
		>
			<h2 className="!mb-8 text-3xl font-black text-gray-900 dark:text-white">
				{title}
			</h2>
			{children}
		</section>
	);
}

function List({ items }: { items: string[] }) {
	return (
		<ul className="list-disc space-y-3 pl-5">
			{items.map((item) => (
				<li key={item}>{item}</li>
			))}
		</ul>
	);
}
