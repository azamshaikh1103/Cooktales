"use client";

import { useEffect, useState } from "react";
import { FaEnvelope, FaUsers } from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PrimaryActionLink } from "@/components/ui/PrimaryActionLink";

const SECTIONS = [
	{ id: "purpose", label: "1. Our community" },
	{ id: "post", label: "2. Content and integrity" },
	{ id: "conduct", label: "3. Respectful conduct" },
	{ id: "safety", label: "4. Food safety and law" },
	{ id: "moderation", label: "5. Moderation and enforcement" },
	{ id: "reports", label: "6. Reporting and copyright" },
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
							Last updated: October 29, 2026. These guidelines set the standards
							for participating in CookTale&apos;s recipes, comments, reviews,
							and community discussion threads.
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
									CookTale is a global culinary community for food creators,
									home cooks, and food lovers to exchange recipes, share
									techniques, and discuss cooking. We welcome diverse cultures,
									culinary traditions, and dietary perspectives.
								</p>
								<p>
									By starting a discussion, replying to a topic, or leaving a
									recipe review or comment, you agree to treat other members
									with respect and follow these standards.
								</p>
							</GuidelineSection>

							<GuidelineSection
								id="post"
								title="2. Content standards and integrity"
							>
								<List
									items={[
										"Originality and ownership: Only upload recipes, stories, photographs, and media that you created or have express permission to share. Do not scrape or repost content from cookbooks, food blogs, or paid publications.",
										"Commercial transparency: Clearly disclose affiliate links, sponsored partnerships, paid endorsements, or self-promotional products, for example #ad, #sponsored, or [Affiliate].",
										"No unsolicited promotion or spam: Do not post automated links, affiliate spam, repetitive self-promotion, or deceptive commercial schemes.",
										"Privacy and confidentiality: Never post another person's private information, including phone numbers, home addresses, email addresses, or payment details.",
									]}
								/>
							</GuidelineSection>

							<GuidelineSection
								id="conduct"
								title="3. Respectful conduct and discussions"
							>
								<List
									items={[
										"Harassment and hate speech: No bullying, targeted harassment, insults, threats of violence, or hate speech targeting race, ethnicity, religion, gender, sexual orientation, disability, or national origin.",
										"Constructive critique: Honest recipe feedback and culinary debate are welcome. Personal attacks, derogatory insults, and bad-faith disruption are not.",
										"Impersonation and deception: Do not impersonate chefs, creators, brands, or CookTale representatives, or mislead the community with fraudulent credentials.",
										"Review and thread manipulation: Do not use duplicate accounts to manipulate recipe ratings, artificially boost likes, or coordinate review-bombing campaigns.",
									]}
								/>
							</GuidelineSection>

							<GuidelineSection
								id="safety"
								title="4. Food safety, health and legal compliance"
							>
								<p>
									Food preparation carries real-world health responsibilities.
									Do not post preservation or preparation instructions known to
									pose serious biological or chemical hazards, such as unsafe
									home canning, toxic wild-mushroom foraging, or improperly
									handled raw perishables.
								</p>
								<p>
									Do not present recipes as medical cures or offer unverified
									medical, allergy, or dietary diagnoses. Do not share illegal,
									dangerous, sexually explicit, or self-harm content.
								</p>
								<p>
									Community discussions, reviews, comments, and cooking tips are
									the views of their authors. CookTale does not endorse,
									guarantee, or take responsibility for user-submitted advice.
								</p>
							</GuidelineSection>

							<GuidelineSection
								id="moderation"
								title="5. Moderation and enforcement"
							>
								<p>
									To protect the community, CookTale may review content and
									account behaviour that violates these guidelines, our Terms,
									or applicable law. We may act promptly, including by:
								</p>
								<List
									items={[
										"Editing, locking, or removing discussion threads, comments, reviews, or uploaded recipes.",
										"Muting, restricting, or suspending posting and commenting privileges.",
										"Withholding or ending creator monetisation eligibility when community rules are breached.",
										"Banning accounts and associated access when necessary to protect the platform or community.",
									]}
								/>
							</GuidelineSection>

							<GuidelineSection
								id="reports"
								title="6. Reporting violations and copyright notices"
							>
								<p>
									If you encounter harmful content, harassment, or another
									violation, use the report option on the relevant recipe,
									comment, review, or thread when it is available. For serious
									safety threats, impersonation, or persistent harassment, email
									us with direct URLs and context.
								</p>
								<p>
									For copyright or DMCA notices, email our designated copyright
									team with the work you own, the exact CookTale URL, your legal
									name and contact details, your signature, and a good-faith
									statement that the use is unauthorised.
								</p>
								<div className="mt-8 flex flex-wrap gap-3">
									<PrimaryActionLink href="mailto:support@cooktale.in">
										<FaEnvelope /> Email support
									</PrimaryActionLink>
									<PrimaryActionLink href="mailto:legal@cooktale.in">
										<FaEnvelope /> Copyright and DMCA
									</PrimaryActionLink>
								</div>
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
