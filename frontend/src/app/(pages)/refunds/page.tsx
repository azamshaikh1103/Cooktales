"use client";

import { useEffect, useState } from "react";
import { FaCreditCard, FaEnvelope } from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const SECTIONS = [
	{ id: "plans", label: "1. Plans and billing" },
	{ id: "cancellation", label: "2. Cancelling a plan" },
	{ id: "refunds", label: "3. Refund requests" },
	{ id: "lifetime", label: "4. Lifetime access" },
	{ id: "contact", label: "5. Contact" },
];

export default function RefundPolicyPage() {
	const [activeSection, setActiveSection] = useState("plans");

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
							<FaCreditCard /> Billing
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black lg:text-6xl">
							Refund &amp; Cancellation Policy
						</h1>
						<p className="max-w-2xl text-lg leading-relaxed text-gray-500 dark:text-gray-400">
							Last updated: September 5, 2026. This page explains subscriptions,
							cancellations, and how to ask for help with a payment.
						</p>
					</header>

					<div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-24">
						<aside className="hidden lg:col-span-3 lg:block">
							<nav
								className="sticky top-32 space-y-1"
								aria-label="Refund policy sections"
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
							<PolicySection id="plans" title="1. Plans and billing">
								<p>
									CookTale may offer monthly, yearly, and lifetime paid plans.
									The price, billing period, taxes, included features, and any
									trial are shown before you complete checkout.
								</p>
								<p>
									Payments are processed by Lemon Squeezy or the payment
									provider shown at checkout. CookTale does not receive or store
									your full card number.
								</p>
							</PolicySection>

							<PolicySection id="cancellation" title="2. Cancelling a plan">
								<p>
									You can cancel a monthly or yearly subscription through the
									billing portal linked in your purchase receipt or account
									billing settings. Cancel before the next renewal date to avoid
									the next charge.
								</p>
								<p>
									Cancellation stops future renewals. You keep paid access until
									the end of the period you already paid for, unless a refund is
									approved or the law requires a different result.
								</p>
							</PolicySection>

							<PolicySection id="refunds" title="3. Refund requests">
								<p>
									If you believe a charge was made in error or you have a
									problem with your purchase, contact support within 14 days of
									the charge. Include the email used at checkout, the order
									number, and a short explanation.
								</p>
								<p>
									We review requests fairly and may issue a refund where
									appropriate. Refund eligibility can depend on the plan, the
									reason for the request, paid access already used, the checkout
									provider&apos;s rules, and the law that applies to you.
								</p>
								<p>
									Nothing in this policy limits a refund, cancellation, or
									consumer right that the law gives you.
								</p>
							</PolicySection>

							<PolicySection id="lifetime" title="4. Lifetime access">
								<p>
									A lifetime plan is a one-time payment and does not renew.
									“Lifetime” means the lifetime of CookTale&apos;s paid plan
									service, not the lifetime of an individual person. We may
									change or discontinue features where reasonably necessary, but
									we will not remove paid access without a valid reason or
									without meeting our legal obligations.
								</p>
							</PolicySection>

							<PolicySection id="contact" title="5. Contact">
								<p>
									For payment, cancellation, or refund questions, contact
									support:
								</p>
								<a
									href="mailto:support@cooktale.in"
									className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#006C5E] px-6 py-3 font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
								>
									<FaEnvelope /> support@cooktale.in
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
