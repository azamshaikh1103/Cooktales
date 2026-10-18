"use client";

import { useEffect, useState } from "react";
import {
	FaEnvelope,
	FaExclamationTriangle,
	FaFileContract,
} from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const SECTIONS = [
	{ id: "service", label: "1. Using CookTale" },
	{ id: "accounts", label: "2. Accounts" },
	{ id: "content", label: "3. Your content" },
	{ id: "payments", label: "4. Paid plans" },
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
							Last updated: September 5, 2026. These terms set the rules for
							using CookTale.
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
									CookTale is a place to find, save, publish, and discuss
									food-related content. By using it, you agree to these terms
									and our Privacy Policy. Do not use CookTale if you cannot
									legally agree to these terms where you live.
								</p>
								<p>
									We may change, improve, limit, or stop parts of the service
									when reasonably needed for security, maintenance, legal
									reasons, or the operation of CookTale.
								</p>
							</TermsSection>

							<TermsSection id="accounts" title="2. Accounts">
								<List
									items={[
										"Give accurate account information and keep it updated.",
										"Keep your password and sign-in method private. Tell us promptly if you believe someone has accessed your account without permission.",
										"You are responsible for activity from your account unless it resulted from CookTale's failure to protect it.",
										"Do not create accounts to impersonate another person or bypass a restriction.",
									]}
								/>
							</TermsSection>

							<TermsSection id="content" title="3. Your content">
								<p>
									You keep ownership of the recipes, stories, comments, reviews,
									photos, and other content you submit. You give CookTale a
									non-exclusive, worldwide, royalty-free licence to host, store,
									reproduce, adapt for technical formatting, display,
									distribute, and promote that content through CookTale while it
									is available on the service.
								</p>
								<p>
									You confirm that you have the rights needed to post your
									content and that it does not break the law, infringe another
									person&apos;s rights, or contain private information without
									permission. We may remove or limit content that breaks these
									terms, the law, or a valid rights complaint.
								</p>
							</TermsSection>

							<TermsSection id="payments" title="4. Paid plans">
								<p>
									If you buy a paid plan, the price, billing period, taxes,
									features, and any trial terms shown at checkout apply to that
									purchase. Payments are processed by Lemon Squeezy or another
									checkout provider shown at checkout.
								</p>
								<p>
									Monthly and yearly plans renew unless you cancel before the
									next renewal using the billing option provided by the checkout
									provider. A lifetime plan is a one-time payment and does not
									renew. We may change future plan prices or features, but a
									change will not alter a completed payment without notice or a
									lawful basis.
								</p>
								<p>
									Refund and cancellation rights depend on the checkout terms
									and the laws that apply to you. We will publish a specific
									refund policy before public paid-plan launch.
								</p>
							</TermsSection>

							<TermsSection id="conduct" title="5. Community rules">
								<List
									items={[
										"Do not harass, threaten, deceive, spam, or post hateful, illegal, or harmful material.",
										"Do not upload malware, scrape the service, overload it, or attempt to access accounts or data without permission.",
										"Do not use another person's content, identity, or personal details without permission.",
										"Do not use CookTale to advertise scams, collect personal data, or break applicable law.",
									]}
								/>
							</TermsSection>

							<TermsSection id="safety" title="6. Food safety">
								<div className="not-prose rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-900/10 dark:text-amber-100">
									<h3 className="flex items-center gap-3 text-xl font-black">
										<FaExclamationTriangle /> Use your judgement in the kitchen
									</h3>
									<p className="mt-3 leading-relaxed">
										CookTale does not independently test every recipe or
										nutrition statement. Check ingredients for allergies and
										dietary needs, follow safe food-handling practices, cook
										food to safe temperatures, and use equipment carefully. Talk
										to a qualified professional for medical, allergy, or
										nutrition advice.
									</p>
								</div>
							</TermsSection>

							<TermsSection
								id="availability"
								title="7. Availability and liability"
							>
								<p>
									We work to keep CookTale available and accurate, but the
									service and community content are provided on an "as
									available" basis. To the extent allowed by law, CookTale is
									not responsible for indirect or unexpected losses arising from
									use of the service or reliance on user-posted content.
								</p>
								<p>
									Nothing in these terms removes rights that the law does not
									allow us to remove. If a law requires a different outcome,
									that law applies.
								</p>
							</TermsSection>

							<TermsSection id="contact" title="8. Changes and contact">
								<p>
									We may update these terms as CookTale changes. The date above
									shows the latest version. Continued use after an update means
									you accept the updated terms, where the law allows this.
								</p>
								<p>For questions or rights complaints, contact:</p>
								<a
									href="mailto:legal@cooktale.in"
									className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#006C5E] px-6 py-3 font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
								>
									<FaEnvelope /> legal@cooktale.in
								</a>
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
