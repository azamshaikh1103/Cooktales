"use client";

import { useEffect, useState } from "react";
import {
	FaEnvelope,
	FaExclamationTriangle,
	FaFileContract,
} from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PrimaryActionLink } from "@/components/ui/PrimaryActionLink";

const SECTIONS = [
	{ id: "service", label: "1. Using CookTale" },
	{ id: "accounts", label: "2. Accounts" },
	{ id: "content", label: "3. Content and monetization" },
	{ id: "payments", label: "4. Creator payments" },
	{ id: "conduct", label: "5. Community rules" },
	{ id: "safety", label: "6. Food safety" },
	{ id: "availability", label: "7. Availability and liability" },
	{ id: "contact", label: "8. Changes and contact" },
];

export default function TermsPage() {
	const [activeSection, setActiveSection] = useState("service");

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

	const scrollTo = (id: string) => {
		document
			.getElementById(id)
			?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-gray-100">
			<Navbar />
			<main className="grow pt-24 pb-20 lg:pt-32">
				<div className="container mx-auto px-6 lg:px-24">
					<header className="mb-16 max-w-4xl lg:mb-24">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:border-white/10 dark:bg-white/5 dark:text-[#4ADE80]">
							<FaFileContract /> Terms of service
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
							Terms of Service
						</h1>
						<p className="max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
							Last updated: October 28, 2026. These terms set the legal rules
							for accessing and using CookTale (&quot;we&quot;, &quot;us&quot;,
							or &quot;our&quot;).
						</p>
					</header>

					<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24">
						<aside className="hidden lg:col-span-3 lg:block">
							<nav
								className="sticky top-32 space-y-1"
								aria-label="Terms sections"
							>
								<p className="mb-6 ml-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
									Contents
								</p>
								{SECTIONS.map((section) => (
									<button
										type="button"
										key={section.id}
										onClick={() => scrollTo(section.id)}
										className={`w-full cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors ${activeSection === section.id ? "bg-[#006C5E]/5 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
									>
										{section.label}
									</button>
								))}
							</nav>
						</aside>

						<div className="space-y-16 lg:col-span-9">
							<TermsSection id="service" title="1. Using CookTale">
								<p>
									CookTale is a global platform to discover, save, publish, and
									discuss food-related content. By accessing or using CookTale,
									you agree to be bound by these Terms of Service and our
									Privacy Policy. Do not use CookTale if you cannot legally form
									a binding contract in your jurisdiction.
								</p>
								<p>
									We may modify, update, limit, or discontinue parts of the
									service when reasonably necessary for security, maintenance,
									legal compliance, or platform evolution.
								</p>
							</TermsSection>

							<TermsSection id="accounts" title="2. Accounts">
								<List
									items={[
										"Accurate information: You must provide accurate registration and payout information and keep it updated.",
										"Account security: Keep your password and authentication credentials confidential. Notify us immediately if you suspect unauthorised access to your account.",
										"Account responsibility: You are responsible for all activity occurring under your account unless caused by a verified security breach on CookTale's part.",
										"No impersonation: Do not create accounts to impersonate another person, brand, or creator, or to evade a prior suspension or restriction.",
									]}
								/>
							</TermsSection>

							<TermsSection
								id="content"
								title="3. Your content and platform monetization"
							>
								<p>
									You retain ownership of the original recipes, stories,
									comments, reviews, photos, and media you submit to CookTale.
									By publishing content on the platform, you grant CookTale a
									non-exclusive, worldwide, royalty-free license to host, store,
									cache, reproduce, adapt for technical formatting, display,
									distribute, and promote that content across CookTale and our
									marketing channels while it remains published on the service.
								</p>
								<List
									items={[
										"Right to monetize: You acknowledge and agree that CookTale may display third-party advertisements and promotional placements alongside, within, or adjacent to any content uploaded to the platform.",
										"Content rights and plagiarism: You represent and warrant that you own or have the necessary legal rights to publish your submitted content, and that it does not infringe any copyright, trademark, or third-party right. Copying recipes, verbatim instructions, or photographs from other websites, cookbooks, or creators without authorisation is strictly prohibited and will result in content removal and forfeiture of monetisation eligibility.",
									]}
								/>
							</TermsSection>

							<TermsSection
								id="payments"
								title="4. Creator monetization and payments"
							>
								<p>
									Eligible creators may earn a share of net advertising revenue
									generated by their published recipes, subject to the following
									program terms:
								</p>
								<List
									items={[
										"Revenue calculation and Net-30 cycle: Creator revenue shares (targeted at 70% of net realised ad revenue) are calculated monthly based on verified, legitimate pageviews in proportion to total platform views. Earnings displayed in your dashboard during an active month are estimates only. Finalised earnings are settled and disbursed on a Net-30 monthly schedule only after CookTale actually receives settled funds from our advertising partners.",
										"Minimum thresholds and processing fees: Payouts are issued only once an account's finalised balance reaches the applicable minimum payout threshold (for example, $50 USD for international payouts or ₹500 INR for domestic payouts). Third-party payment processor, currency conversion, or cross-border transfer fees (such as a 2% international payout processing fee) are deducted from the gross payout amount at the time of transfer.",
										"Invalid traffic and forfeiture: If our automated systems or advertising partners detect invalid traffic, bot views, self-refreshing, click-exchange rings, or plagiarised or AI-spammed content, CookTale reserves the absolute right to deduct invalid impressions, withhold payouts, or permanently terminate monetisation access.",
										"Taxes and independent status: Participating creators act strictly as independent third parties and not as employees, agents, or legal partners of CookTale. You are solely responsible for reporting and paying any applicable local, state, or national income taxes on payouts you receive.",
										"Future paid features: If CookTale introduces optional paid features, courses, or digital products in the future, the pricing, billing intervals, taxes, and refund terms displayed at checkout will govern those purchases, processed securely via our third-party payment providers.",
									]}
								/>
							</TermsSection>

							<TermsSection id="conduct" title="5. Community rules">
								<List
									items={[
										"Harass, threaten, deceive, spam, or post hateful, defamatory, illegal, or harmful material.",
										"Artificially inflate recipe views, ad impressions, or engagement using bots, scripts, VPN cycling, auto-refreshers, or traffic-exchange networks.",
										"Upload malware, scrape platform data, bypass rate limits, overload infrastructure, or attempt unauthorised access to accounts or systems.",
										"Upload another creator's photographs, recipes, or personal details without authorisation, or use CookTale to promote scams or deceptive links.",
									]}
								/>
							</TermsSection>

							<TermsSection id="safety" title="6. Food safety">
								<div className="not-prose rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-100">
									<h3 className="flex items-center gap-3 text-xl font-black">
										<FaExclamationTriangle /> Use your judgement in the kitchen
									</h3>
									<p className="mt-3 leading-relaxed">
										CookTale is a community publishing platform and does not
										independently test, verify, or certify user-submitted
										recipes, cooking times, or nutritional statements. Always
										check ingredients carefully for food allergies,
										intolerances, and dietary restrictions, follow safe
										food-handling and cross-contamination practices, cook meats
										and perishables to safe internal temperatures, and handle
										kitchen equipment with care. Consult a qualified physician
										or dietitian for medical, allergy, or nutritional advice.
									</p>
								</div>
							</TermsSection>

							<TermsSection
								id="availability"
								title="7. Availability and liability"
							>
								<p>
									CookTale and all community-submitted content are provided on
									an &quot;as is&quot; and &quot;as available&quot; basis
									without warranties of any kind, whether express or implied.
								</p>
								<p>
									To the maximum extent permitted by applicable law, CookTale
									and its operators shall not be liable for any indirect,
									incidental, consequential, or unexpected damages, including
									loss of data, loss of anticipated ad revenue, or physical harm
									or illness resulting from the preparation or consumption of
									any recipe published on the service. Nothing in these terms
									excludes liability where doing so is prohibited by applicable
									law.
								</p>
							</TermsSection>

							<TermsSection id="contact" title="8. Changes and contact">
								<p>
									We may update these Terms of Service as CookTale introduces
									new features or to comply with legal requirements. The
									&quot;Last updated&quot; date at the top of this page reflects
									the current version. Continued use of CookTale after an update
									constitutes acceptance of the revised terms.
								</p>
								<p>
									For legal inquiries, copyright or DMCA takedown notices, or
									questions regarding these terms, contact us at:
								</p>
								<PrimaryActionLink
									href="mailto:legal@cooktale.in"
									className="mt-8"
								>
									<FaEnvelope /> legal@cooktale.in
								</PrimaryActionLink>
							</TermsSection>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

function TermsSection({
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
