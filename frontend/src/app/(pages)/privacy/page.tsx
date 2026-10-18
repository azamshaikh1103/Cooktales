"use client";

import { useEffect, useState } from "react";
import { FaEnvelope, FaShieldAlt } from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const SECTIONS = [
	{ id: "information", label: "1. Information we collect" },
	{ id: "use", label: "2. How we use it" },
	{ id: "sharing", label: "3. When we share it" },
	{ id: "content", label: "4. Public content" },
	{ id: "retention", label: "5. Storage and security" },
	{ id: "choices", label: "6. Your choices" },
	{ id: "cookies", label: "7. Cookies and ads" },
	{ id: "contact", label: "8. Contact" },
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
							Last updated: September 5, 2026. This policy explains how CookTale
							handles personal information when you use the website and its
							features.
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
									We collect the information needed to run CookTale and the
									information you choose to give us.
								</p>
								<List
									items={[
										"Account details, such as your name, email address, username, profile image, and sign-in method.",
										"Content and activity, such as recipes, stories, comments, reviews, bookmarks, follows, notification settings, and the media you upload.",
										"Technical and security information, such as IP address, browser or device details, log records, and information used to prevent abuse or protect accounts.",
										"Payment-related records, such as membership status and transaction references. Card details are handled by the payment provider, not stored by CookTale.",
									]}
								/>
							</PolicySection>

							<PolicySection id="use" title="2. How we use it">
								<List
									items={[
										"To create and secure accounts, provide the features you ask for, and respond to support requests.",
										"To show your public profile and community activity where you choose to publish it.",
										"To send service messages, such as verification, password reset, account, payment, and notification emails.",
										"To investigate misuse, enforce our rules, improve reliability, and meet legal obligations.",
										"To provide optional analytics or advertising only when you allow the related cookies.",
									]}
								/>
							</PolicySection>

							<PolicySection id="sharing" title="3. When we share it">
								<p>
									We do not sell personal information. We share it only when
									needed to operate CookTale, process a request, comply with
									law, or protect people and the service.
								</p>
								<p>
									Examples include hosting and database providers, Cloudinary
									for media storage, Google for sign-in, Cloudflare Turnstile
									for abuse prevention, Resend for email delivery, Lemon Squeezy
									for payments, and Google services if you opt in to analytics
									or advertising. Each provider handles information under its
									own terms and privacy policy.
								</p>
							</PolicySection>

							<PolicySection id="content" title="4. Public content">
								<p>
									Recipes, stories, comments, reviews, profile details, and
									media that you publish can be visible to other people and may
									be indexed by search engines. Do not publish personal,
									private, or sensitive information that you do not want others
									to see.
								</p>
								<p>
									Deleting an item removes it from CookTale&apos;s normal public
									view. Copies may remain temporarily in backups, browser
									caches, or third-party search indexes until they refresh.
								</p>
							</PolicySection>

							<PolicySection id="retention" title="5. Storage and security">
								<p>
									We keep account information while your account is active and
									for a reasonable period afterward when needed for security,
									legal records, dispute handling, or backups. We keep public
									content until you delete it, we remove it, or your account is
									deleted.
								</p>
								<p>
									We use reasonable technical and organisational safeguards,
									including access controls and encrypted connections. No online
									system can guarantee absolute security.
								</p>
							</PolicySection>

							<PolicySection id="choices" title="6. Your choices">
								<p>
									You can update profile and notification settings in CookTale.
									You can request an export of your account data or delete your
									account from account settings. Depending on where you live,
									you may also have rights to access, correct, delete, restrict,
									object to, or receive a copy of your personal information.
								</p>
								<p>
									To make a privacy request that settings do not cover, email us
									from the address connected to your account. We may need to
									verify your identity before acting on the request.
								</p>
							</PolicySection>

							<PolicySection id="cookies" title="7. Cookies and advertising">
								<p>
									Essential cookies keep the site working and protect accounts.
									Analytics and advertising tools are optional and are not
									loaded until you choose them. You can change this choice at
									any time in the{" "}
									<a
										className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
										href="/cookies"
									>
										Cookie Policy
									</a>
									.
								</p>
								<p>
									When advertising is enabled, Google AdSense may process data
									under Google&apos;s policies. You can also manage personalised
									Google ads in{" "}
									<a
										className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
										href="https://www.google.com/settings/ads"
										target="_blank"
										rel="noreferrer"
									>
										Google Ads Settings
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
								<a
									href="mailto:privacy@cooktale.in"
									className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#006C5E] px-6 py-3 font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
								>
									<FaEnvelope /> privacy@cooktale.in
								</a>
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
