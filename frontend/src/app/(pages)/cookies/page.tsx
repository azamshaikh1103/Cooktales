"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
	FaCookieBite,
	FaEnvelope,
	FaInfoCircle,
	FaShieldAlt,
} from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PrimaryActionLink } from "@/components/ui/PrimaryActionLink";

const sections = [
	{ id: "storage", label: "1. Cookies and storage" },
	{ id: "categories", label: "2. Technologies we use" },
	{ id: "consent", label: "3. Advertising choices" },
	{ id: "preferences", label: "4. Manage preferences" },
];

type GoogleFundingChoices = {
	callbackQueue?: Array<() => void>;
	showRevocationMessage?: () => void;
};

export default function CookiePolicyPage() {
	const [activeSection, setActiveSection] = useState(sections[0].id);

	useEffect(() => {
		const updateActiveSection = () => {
			const position = window.scrollY + 200;
			for (const section of sections) {
				const element = document.getElementById(section.id);
				if (element && element.offsetTop <= position) {
					setActiveSection(section.id);
				}
			}
		};

		updateActiveSection();
		window.addEventListener("scroll", updateActiveSection, { passive: true });
		return () => window.removeEventListener("scroll", updateActiveSection);
	}, []);

	const openRegionalPrivacyChoices = () => {
		const googleFundingChoices = (
			window as typeof window & {
				googlefc?: GoogleFundingChoices;
			}
		).googlefc;

		if (
			googleFundingChoices?.callbackQueue &&
			googleFundingChoices.showRevocationMessage
		) {
			googleFundingChoices.callbackQueue.push(
				googleFundingChoices.showRevocationMessage,
			);
			return;
		}

		window.open(
			"https://adssettings.google.com",
			"_blank",
			"noopener,noreferrer",
		);
	};

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
					<div className="mb-16 max-w-4xl lg:mb-24">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-amber-600 uppercase dark:border-white/10 dark:bg-white/5 dark:text-amber-400">
							<FaCookieBite /> Legal centre
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
							Cookie{" "}
							<span className="text-amber-600 dark:text-amber-400">
								Policy.
							</span>
						</h1>
						<p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400">
							Last updated: October 28, 2026
						</p>
					</div>

					<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24">
						<aside className="hidden lg:col-span-3 lg:block">
							<nav
								className="sticky top-32 space-y-1"
								aria-label="Cookie policy sections"
							>
								<p className="mb-6 ml-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
									Contents
								</p>
								{sections.map((section) => (
									<button
										type="button"
										key={section.id}
										onClick={() => scrollTo(section.id)}
										className={`w-full cursor-pointer rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors ${
											activeSection === section.id
												? "bg-[#006C5E]/5 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]"
												: "text-gray-500 hover:text-gray-900 dark:hover:text-white"
										}`}
									>
										{section.label}
									</button>
								))}
							</nav>
						</aside>

						<div className="space-y-16 lg:col-span-9">
							<section id="storage" className="scroll-mt-32">
								<h2 className="mb-5 text-3xl font-black">
									1. Cookies and storage technologies
								</h2>
								<p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
									When you browse CookTale, we and authorised service partners
									may use cookies, pixels and browser storage. These help us
									recognise your browser, maintain sign-in sessions, secure
									creator accounts and preserve interface preferences.
								</p>
								<p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
									Session storage expires when you close your browser.
									Persistent storage remains until it expires or you clear it.
								</p>
							</section>

							<section id="categories" className="scroll-mt-32">
								<h2 className="mb-6 text-3xl font-black">
									2. Categories of technologies we use
								</h2>
								<div className="grid gap-4">
									<CookieCard
										icon={<FaShieldAlt />}
										title="Strictly necessary and security"
										badge="Always active"
										description="Used for sign-in, account security, fraud prevention, saved preferences and legitimate recipe-view verification for creator earnings. These technologies cannot be switched off in CookTale."
									/>
									<CookieCard
										icon={<FaInfoCircle />}
										title="Measurement and performance"
										badge="Google Analytics"
										description="Google Analytics helps us understand site traffic, engagement and technical performance. Where consent is required, Google records and respects your choice."
									/>
									<CookieCard
										icon={<FaCookieBite />}
										title="Advertising and creator monetisation"
										badge="Google AdSense"
										description="Google AdSense helps keep CookTale free and supports creator earnings. Depending on your location and choices, advertising may be personalised, non-personalised or limited."
									/>
								</div>
							</section>

							<section id="consent" className="scroll-mt-32">
								<h2 className="mb-5 text-3xl font-black">
									3. Advertising choices and regional consent
								</h2>
								<p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
									CookTale is free for readers and uses advertising revenue to
									support recipe creators. Google AdSense may use identifiers to
									measure ad performance, limit repeat ads and, where allowed,
									tailor advertising.
								</p>
								<ul className="mt-6 space-y-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
									<li>
										<strong className="text-gray-900 dark:text-white">
											EEA, UK and Switzerland:
										</strong>{" "}
										Google&apos;s certified consent manager asks for the choices
										required before advertising and analytics use non-essential
										identifiers.
									</li>
									<li>
										<strong className="text-gray-900 dark:text-white">
											United States:
										</strong>{" "}
										Visitors in applicable US states can opt out of the sale,
										sharing or processing of personal information for targeted
										advertising.
									</li>
									<li>
										<strong className="text-gray-900 dark:text-white">
											Other regions:
										</strong>{" "}
										Ads help support CookTale and its creators. You can still
										manage interest-based advertising through browser and
										third-party controls.
									</li>
								</ul>
								<div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-500/20 dark:bg-amber-900/10 dark:text-amber-100">
									<p className="font-bold">Advertising remains visible</p>
									<p className="mt-1 leading-relaxed text-amber-900/80 dark:text-amber-100/80">
										Opting out of personalised advertising does not remove ads.
										It means ads are selected from the page context rather than
										cross-site browsing history.
									</p>
								</div>
							</section>

							<section id="preferences" className="scroll-mt-32">
								<h2 className="mb-5 text-3xl font-black">
									4. Managing your preferences
								</h2>
								<div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-900/10">
									<h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">
										Regional privacy choices
									</h3>
									<p className="mt-2 leading-relaxed text-amber-900/80 dark:text-amber-100/80">
										If Google&apos;s regional consent message applies to you,
										you can reopen it here to revise your choices.
									</p>
									<button
										type="button"
										onClick={openRegionalPrivacyChoices}
										className="mt-5 inline-flex cursor-pointer rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-[#0d1f1c]"
									>
										Manage regional privacy choices
									</button>
								</div>

								<div className="mt-6 space-y-3 text-gray-600 dark:text-gray-300">
									<p className="font-bold text-gray-900 dark:text-white">
										Third-party advertising controls
									</p>
									<ul className="list-disc space-y-2 pl-5">
										<li>
											<a
												className="font-bold underline hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
												href="https://adssettings.google.com"
												target="_blank"
												rel="noreferrer"
											>
												Google Ads Settings
											</a>
										</li>
										<li>
											<a
												className="font-bold underline hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
												href="https://optout.aboutads.info"
												target="_blank"
												rel="noreferrer"
											>
												Digital Advertising Alliance (US)
											</a>
										</li>
										<li>
											<a
												className="font-bold underline hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
												href="https://www.youronlinechoices.eu"
												target="_blank"
												rel="noreferrer"
											>
												Your Online Choices (EU)
											</a>
										</li>
									</ul>
									<p className="pt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
										You can also clear or block cookies in browser settings.
										Blocking essential technologies may prevent sign-in and
										recipe publishing from working properly. For questions,
										contact our Privacy Team or read our{" "}
										<Link
											href="/privacy"
											className="font-bold underline hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
										>
											Privacy Policy
										</Link>
										.
									</p>
									<PrimaryActionLink
										href="mailto:privacy@cooktale.in"
										className="mt-5"
									>
										<FaEnvelope /> Email privacy@cooktale.in
									</PrimaryActionLink>
								</div>
							</section>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}

function CookieCard({
	icon,
	title,
	badge,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	badge: string;
	description: string;
}) {
	return (
		<div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-[#152a26]">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="text-xl text-amber-500">{icon}</div>
					<h3 className="font-bold">{title}</h3>
				</div>
				<span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:bg-white/10 dark:text-gray-300">
					{badge}
				</span>
			</div>
			<p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
				{description}
			</p>
		</div>
	);
}
