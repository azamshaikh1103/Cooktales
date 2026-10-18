"use client";

import { useEffect, useState } from "react";
import {
	FaCookieBite,
	FaShieldAlt,
	FaToggleOn,
	FaToggleOff,
	FaInfoCircle,
} from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { useCookieConsent } from "@/lib/context/CookieContext";

// --- SECTIONS ---
const SECTIONS = [
	{ id: "what", label: "1. Cookies and local storage" },
	{ id: "types", label: "2. Categories we use" },
	{ id: "adsense", label: "3. Advertising" },
	{ id: "manage", label: "4. Your choices" },
];

export default function CookiePolicy() {
	const [activeSection, setActiveSection] = useState("what");
	const { consent, updateConsent } = useCookieConsent();
	const [preferences, setPreferences] = useState({
		analytics: false,
		advertising: false,
	});

	useEffect(() => {
		setPreferences({
			analytics: consent.analytics,
			advertising: consent.advertising,
		});
	}, [consent.analytics, consent.advertising]);

	// 2. Toggle Handler
	const togglePreference = (key: "analytics" | "advertising") => {
		setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	// 3. Save Handler
	const handleSave = () => {
		updateConsent(preferences);
		toast.success("Cookie preferences saved.");
	};

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY + 200;
			for (const section of SECTIONS) {
				const element = document.getElementById(section.id);
				if (element && element.offsetTop <= scrollPosition) {
					setActiveSection(section.id);
				}
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollTo = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			window.scrollTo({ top: element.offsetTop - 120, behavior: "smooth" });
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-gray-100">
			<Navbar />

			<main className="relative grow pt-24 pb-20 lg:pt-32">
				<div className="relative z-10 container mx-auto px-6 lg:px-24">
					{/* --- HEADER --- */}
					<div className="mb-16 max-w-4xl lg:mb-24">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-amber-600 uppercase transition-colors dark:border-white/10 dark:bg-white/5 dark:text-amber-400">
							<FaCookieBite /> Legal Center
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
							Cookie <br />
							<span className="text-amber-600 dark:text-amber-400">
								Policy.
							</span>
						</h1>
						<p className="max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-500">
							Last updated: September 5, 2026
						</p>
					</div>

					{/* --- MAIN CONTENT GRID --- */}
					<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24">
						{/* LEFT: Sticky Navigation */}
						<div className="hidden lg:col-span-3 lg:block">
							<div className="sticky top-32 space-y-1">
								<p className="mb-6 ml-4 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
									Contents
								</p>
								{SECTIONS.map((section) => (
									<button
										type="button"
										key={section.id}
										onClick={() => scrollTo(section.id)}
										className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-colors ${
											activeSection === section.id
												? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
												: "text-gray-500 hover:text-gray-900 dark:text-gray-500 dark:hover:text-white"
										}`}
									>
										{section.label}
									</button>
								))}
							</div>
						</div>

						{/* RIGHT: Content */}
						<div className="space-y-16 lg:col-span-9">
							{/* 1. Cookies and local storage */}
							<section
								id="what"
								className="prose prose-lg max-w-none dark:prose-invert [&>h2]:!mb-8"
							>
								<h2 className="flex items-center gap-3 text-3xl font-black text-gray-900 dark:text-white">
									1. Cookies and Local Storage
								</h2>
								<p className="leading-relaxed text-gray-600 dark:text-gray-500">
									Cookies are small files stored by your browser. CookTale also
									uses browser storage for choices such as cookie consent and
									display preferences. These technologies help the site remember
									your session and settings.
								</p>
							</section>

							{/* 2. Types of Cookies */}
							<section
								id="types"
								className="prose prose-lg max-w-none dark:prose-invert [&>h2]:!mb-8"
							>
								<h2 className="text-3xl font-black text-gray-900 dark:text-white">
									2. Categories We Use
								</h2>
								<div className="not-prose mt-6 grid gap-4">
									<CookieCard
										title="Essential Cookies"
										desc="Needed for sign-in, account security, fraud prevention, and the preferences required to run CookTale. These cannot be switched off in our settings."
										type="Strictly Necessary"
										icon={<FaShieldAlt />}
									/>
									<CookieCard
										title="Performance Cookies"
										desc="Optional measurement tools. They are used only after you allow analytics cookies and only when CookTale has configured a measurement provider."
										type="Analytics"
										icon={<FaInfoCircle />}
									/>
									<CookieCard
										title="Advertising Cookies"
										desc="Optional tools used by advertising partners, such as Google AdSense, to measure ads and, where allowed, make advertising more relevant."
										type="Advertising"
										icon={<FaCookieBite />}
									/>
								</div>
							</section>

							{/* 3. AdSense (Crucial) */}
							<section
								id="adsense"
								className="prose prose-lg max-w-none dark:prose-invert [&>h2]:!mb-8"
							>
								<h2 className="text-3xl font-black text-gray-900 dark:text-white">
									3. Advertising
								</h2>
								<p className="leading-relaxed text-gray-600 dark:text-gray-500">
									If CookTale enables advertising, it may use Google AdSense.
									Advertising scripts do not load until you allow advertising
									cookies. Google may then use its own technologies to measure
									advertising and, where permitted, tailor ads.
								</p>
								<div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-900/10">
									<h4 className="mb-2 font-bold text-amber-800 dark:text-amber-400">
										User Control
									</h4>
									<p className="text-sm text-amber-900/80 dark:text-amber-200/80">
										Users may opt out of personalized advertising by visiting{" "}
										<a
											href="https://www.google.com/settings/ads"
											target="_blank"
											rel="noreferrer"
											className="font-bold underline"
										>
											Google Ads Settings
										</a>
										.
									</p>
								</div>
							</section>

							{/* 4. Manage Cookies */}
							<section
								id="manage"
								className="prose prose-lg max-w-none dark:prose-invert [&>h2]:!mb-8"
							>
								<h2 className="text-3xl font-black text-gray-900 dark:text-white">
									4. Your Choices
								</h2>
								<p className="leading-relaxed text-gray-600 dark:text-gray-500">
									You can choose optional analytics and advertising below. You
									can also delete or block cookies in your browser settings.
									Blocking essential cookies may stop parts of CookTale from
									working correctly.
								</p>

								<div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#152a26]">
									<h3 className="mb-6 text-lg font-bold">Cookie Preferences</h3>

									<div className="space-y-6">
										<ToggleRow
											title="Essential Cookies"
											desc="Required for login and site security. Cannot be disabled."
											active={true}
											locked={true}
											onClick={() => {}}
										/>
										<ToggleRow
											title="Analytics Cookies"
											desc="Help us improve our website by tracking usage."
											active={preferences.analytics}
											onClick={() => togglePreference("analytics")}
										/>
										<ToggleRow
											title="Advertising Cookies"
											desc="Used to show you relevant ads from our partners (Google)."
											active={preferences.advertising}
											onClick={() => togglePreference("advertising")}
										/>
									</div>

									<button
										type="button"
										onClick={handleSave}
										className="mt-8 cursor-pointer rounded-xl bg-gray-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
									>
										Save Preferences
									</button>
									<p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
										Your choice controls future optional scripts. Refresh this
										page to stop an optional script that was already loaded.
									</p>
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

// --- SUB COMPONENTS ---

const CookieCard = ({ title, desc, type, icon }: any) => (
	<div className="rounded-2xl border border-gray-100 bg-white p-6 transition-colors dark:border-white/5 dark:bg-[#152a26]">
		<div className="mb-3 flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="text-xl text-amber-500">{icon}</div>
				<h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
			</div>
			<span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold tracking-wider text-gray-500 uppercase dark:bg-white/10 dark:text-gray-500">
				{type}
			</span>
		</div>
		<p className="text-sm leading-relaxed text-gray-500 dark:text-gray-500">
			{desc}
		</p>
	</div>
);

// --- TOGGLE COMPONENT ---
const ToggleRow = ({ title, desc, active, locked, onClick }: any) => (
	<div
		onClick={locked ? undefined : onClick}
		className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${
			locked ? "cursor-default" : "cursor-pointer"
		} ${
			active
				? "border-[#006C5E]/20 bg-[#006C5E]/5 dark:border-[#4ADE80]/20 dark:bg-[#4ADE80]/5"
				: "border-transparent bg-transparent hover:bg-gray-50 dark:hover:bg-white/5"
		}`}
	>
		<div>
			<h5 className="flex items-center gap-3 text-lg font-bold">
				{title}
				{locked && (
					<span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-600 uppercase">
						Required
					</span>
				)}
			</h5>
			<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>
		</div>

		<div
			className={`text-4xl transition-colors duration-300 ${locked ? "opacity-50" : ""} ${
				active
					? "text-[#006C5E] dark:text-[#4ADE80]"
					: "text-gray-300 dark:text-gray-600"
			}`}
		>
			{active ? <FaToggleOn /> : <FaToggleOff />}
		</div>
	</div>
);
