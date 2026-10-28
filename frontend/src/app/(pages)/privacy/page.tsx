"use client";

import { useEffect, useState } from "react";
import { FaEnvelope, FaShieldAlt } from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PrimaryActionLink } from "@/components/ui/PrimaryActionLink";

const SECTIONS = [
	{ id: "information", label: "1. Information we collect" },
	{ id: "use", label: "2. How we use it" },
	{ id: "sharing", label: "3. When we share it" },
	{ id: "content", label: "4. Public content" },
	{ id: "retention", label: "5. Storage and security" },
	{ id: "choices", label: "6. Your choices and rights" },
	{ id: "cookies", label: "7. Cookies and advertising" },
	{ id: "contact", label: "8. Changes and contact" },
];

export default function PrivacyPolicy() {
	const [activeSection, setActiveSection] = useState("information");

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
							<FaShieldAlt /> Privacy
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
							Privacy Policy
						</h1>
						<p className="max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
							Last updated: October 28, 2026. This policy explains how CookTale
							(&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects,
							uses, and protects your personal information when you use our
							website and services.
						</p>
					</header>

					<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24">
						<aside className="hidden lg:col-span-3 lg:block">
							<nav
								className="sticky top-32 space-y-1"
								aria-label="Privacy policy sections"
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
							<PolicySection id="information" title="1. Information we collect">
								<p>
									We collect information required to operate CookTale, support
									our creator community, and maintain platform security.
								</p>
								<List
									items={[
										"Account and profile details: Information you provide when registering or updating your profile, such as your name, email address, username, profile image, bio, and authentication method.",
										"Public content and community activity: Recipes, stories, ingredients, instructions, photos, comments, reviews, bookmarks, follows, and notification preferences you choose to submit or publish.",
										"Creator monetization and payment records: If you participate in creator monetization or make transactions on the platform, we collect necessary payout identifiers (such as your designated payout email, bank or transfer routing identifiers, or tax compliance status) and transaction reference records. Payment card credentials for any purchases are processed directly by our third-party payment gateways and are never stored by CookTale.",
										"Technical, usage, and anti-fraud data: Information collected automatically when you interact with the platform, including IP addresses, browser and device characteristics, operating system, referring URLs, page interaction logs, and session identifiers used to verify legitimate traffic, prevent automated abuse, and secure accounts.",
									]}
								/>
							</PolicySection>

							<PolicySection id="use" title="2. How we use it">
								<List
									items={[
										"Provide and secure the service: To create and authenticate accounts, deliver platform features, personalise your recipe feed, and respond to support inquiries.",
										"Enable community features: To display your public profile, published recipes, and community interactions where you choose to share them.",
										"Creator earnings and payouts: To measure content performance, verify authentic pageviews, detect invalid or fraudulent traffic, calculate creator ad-revenue shares, and disburse payouts.",
										"Transactional communications: To send essential service notifications, including email verification codes, password resets, security alerts, and billing or payout updates.",
										"Safety, compliance, and analytics: To investigate misuse, enforce our Terms of Service, meet tax and legal obligations, and—where permitted by your cookie preferences—analyse site performance and serve advertisements.",
									]}
								/>
							</PolicySection>

							<PolicySection id="sharing" title="3. When we share it">
								<p>
									We do not sell your personal information to third parties. We
									share data only when necessary to operate CookTale, complete a
									transaction you requested, or comply with the law.
								</p>
								<List
									items={[
										"Service providers: We engage trusted third-party vendors to perform essential infrastructure functions on our behalf—such as cloud hosting, database storage, media content delivery, transactional email delivery, security and bot protection, and payment or payout processing. These providers are authorised to process data strictly as needed to perform their services for us.",
										"Advertising and analytics partners: Where enabled, we work with advertising networks and analytics providers to measure traffic trends and display advertisements across the platform.",
										"Legal and safety obligations: We may disclose information if required by law, regulation, or legal process, or when necessary to investigate fraud, enforce our policies, or protect the rights, property, and safety of CookTale, our users, or the public.",
									]}
								/>
							</PolicySection>

							<PolicySection id="content" title="4. Public content">
								<p>
									Recipes, stories, comments, reviews, profile information, and
									media that you publish on CookTale are public by default and
									may be indexed by third-party search engines or shared across
									the web. Do not publish private, confidential, or sensitive
									personal information in public areas.
								</p>
								<p>
									When you delete published content, it is removed from
									CookTale&apos;s public views; however, residual copies may
									remain temporarily in system backups, browser caches, or
									external search engine indexes until they naturally refresh.
								</p>
							</PolicySection>

							<PolicySection id="retention" title="5. Storage and security">
								<p>
									We retain account information for as long as your account
									remains active and for a reasonable period afterward as
									necessary to maintain security, prevent fraud, resolve
									disputes, or comply with statutory tax, accounting, and legal
									record-keeping requirements.
								</p>
								<p>
									We implement industry-standard technical, administrative, and
									organisational safeguards—including encrypted data
									transmission (TLS/SSL) and strict access controls—to protect
									your information. However, no internet transmission or
									electronic storage system can guarantee absolute security.
								</p>
							</PolicySection>

							<PolicySection id="choices" title="6. Your choices and rights">
								<p>
									You can review and update your profile details, payout
									settings, and notification preferences directly in your
									account settings. You may also request an export of your
									account data or delete your account at any time.
								</p>
								<p>
									Depending on your location, you may have statutory rights
									under applicable data protection laws to access, correct,
									delete, restrict, or object to our processing of your personal
									information, or to withdraw previously granted consent. To
									submit a privacy request not covered by your account settings,
									email us from the address associated with your account. We may
									require identity verification before fulfilling a request.
								</p>
							</PolicySection>

							<PolicySection id="cookies" title="7. Cookies and advertising">
								<p>
									We use essential cookies and local storage technologies to
									keep the site functioning, authenticate sessions, remember
									preferences, and protect against unauthorised access. Optional
									analytics and advertising cookies are governed by your
									preferences, which you can adjust at any time via our{" "}
									<a
										className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
										href="/cookies"
									>
										Cookie Policy
									</a>
									.
								</p>
								<p>
									When advertising is active, third-party vendors, including
									Google AdSense, use cookies to serve ads based on a
									user&apos;s prior visits to CookTale or other websites on the
									internet. Google&apos;s use of advertising cookies enables it
									and its partners to serve personalised or contextual ads to
									users. You may opt out of personalised advertising at any time
									by visiting{" "}
									<a
										className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
										href="https://www.google.com/settings/ads"
										target="_blank"
										rel="noreferrer"
									>
										Google Ads Settings
									</a>{" "}
									or{" "}
									<a
										className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
										href="https://www.aboutads.info"
										target="_blank"
										rel="noreferrer"
									>
										www.aboutads.info
									</a>
									.
								</p>
							</PolicySection>

							<PolicySection id="contact" title="8. Changes and contact">
								<p>
									We may update this policy when CookTale or the law changes.
									The date above shows the latest version. Material changes will
									be communicated through the site or by email when appropriate.
								</p>
								<p>For privacy questions or requests, contact CookTale at:</p>
								<PrimaryActionLink
									href="mailto:privacy@cooktale.in"
									className="mt-8"
								>
									<FaEnvelope /> privacy@cooktale.in
								</PrimaryActionLink>
							</PolicySection>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

function PolicySection({
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
