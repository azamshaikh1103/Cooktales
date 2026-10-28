"use client";

import { useState } from "react";
import {
	FaBug,
	FaClock,
	FaEnvelope,
	FaGlobeAmericas,
	FaHandshake,
	FaMapMarkerAlt,
	FaPaperPlane,
	FaWallet,
} from "react-icons/fa";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { ThemedSelect } from "@/components/ui/ThemedSelect";
import { sendContactMessage } from "@/lib/api/contactClient";

const SUBJECTS = [
	"General Question",
	"Creator Monetization & Payouts",
	"Bug / Technical Issue",
	"Recipe & Content Feedback",
	"Copyright / Content Removal (DMCA)",
	"Business & Brand Partnerships",
];

const QUICK_TOPICS = [
	{
		title: "Creator Monetization",
		description:
			"Questions about your creator dashboard, recipe views, or payouts.",
		subject: "Creator Monetization & Payouts",
		icon: FaWallet,
	},
	{
		title: "Bug & Technical Report",
		description:
			"Let us know if a page, tool, or feature is not working as expected.",
		subject: "Bug / Technical Issue",
		icon: FaBug,
	},
	{
		title: "Partnerships & Press",
		description: "Brand collaborations, sponsorships, or media inquiries.",
		subject: "Business & Brand Partnerships",
		icon: FaHandshake,
	},
] as const;

export default function ContactPage() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [subject, setSubject] = useState(SUBJECTS[0]);

	const chooseTopic = (nextSubject: string) => {
		setSubject(nextSubject);
		document
			.getElementById("contact-form")
			?.scrollIntoView({ behavior: "smooth", block: "center" });
	};

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const form = event.currentTarget;
		const formData = new FormData(form);
		setIsSubmitting(true);

		try {
			await sendContactMessage({
				name: String(formData.get("name") || ""),
				email: String(formData.get("email") || ""),
				subject,
				message: String(formData.get("message") || ""),
			});
			toast.success("Your message has been sent.");
			form.reset();
			setSubject(SUBJECTS[0]);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not send your message.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-gray-100">
			<Navbar />
			<main className="grow pt-24 pb-20 lg:pt-32">
				<div className="container mx-auto px-6 lg:px-24">
					<header className="mx-auto mb-14 max-w-3xl text-center lg:mb-20">
						<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:border-white/10 dark:bg-white/5 dark:text-[#4ADE80]">
							<FaEnvelope /> Contact CookTale
						</div>
						<h1 className="mb-5 text-4xl leading-tight font-black lg:text-6xl">
							Contact &amp; Support.
						</h1>
						<p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400">
							Have a question about recipes, your creator account, or technical
							feedback? Get in touch with our team below.
						</p>
					</header>

					<section
						aria-label="Contact topics"
						className="mb-14 grid gap-5 md:grid-cols-3 lg:mb-20"
					>
						{QUICK_TOPICS.map((topic) => {
							const Icon = topic.icon;
							const isSelected = subject === topic.subject;
							return (
								<button
									type="button"
									key={topic.title}
									onClick={() => chooseTopic(topic.subject)}
									className={`cursor-pointer rounded-3xl border p-7 text-left transition-colors ${isSelected ? "border-[#006C5E] bg-[#006C5E]/5 dark:border-[#4ADE80] dark:bg-[#4ADE80]/10" : "border-gray-200 bg-white hover:border-[#006C5E]/40 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#4ADE80]/40"}`}
								>
									<span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
										<Icon />
									</span>
									<h2 className="mb-2 text-lg font-bold">{topic.title}</h2>
									<p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
										{topic.description}
									</p>
								</button>
							);
						})}
					</section>

					<div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
						<aside className="space-y-5 lg:col-span-4">
							<h2 className="text-2xl font-black">Support details</h2>
							<p className="leading-relaxed text-gray-500 dark:text-gray-400">
								Use the form for the quickest route to the right team, or email
								us directly.
							</p>
							<div className="space-y-4">
								<ContactDetail
									icon={FaEnvelope}
									title="Email"
									value="contact@cooktale.in"
									href="mailto:contact@cooktale.in"
								/>
								<ContactDetail
									icon={FaMapMarkerAlt}
									title="Location"
									value="Mumbai, India"
								/>
								<ContactDetail
									icon={FaClock}
									title="Response time"
									value="Typically within 1–2 business days"
									detail="Monday–Friday"
								/>
							</div>
							<div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
								<FaGlobeAmericas className="mb-4 text-2xl text-[#006C5E] dark:text-[#4ADE80]" />
								<h3 className="mb-2 font-bold">Built for a global community</h3>
								<p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
									CookTale is built and maintained for home cooks and creators
									around the world.
								</p>
							</div>
						</aside>

						<section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9 dark:border-white/10 dark:bg-white/5 lg:col-span-8">
							<h2 className="mb-2 text-2xl font-black">Send a message</h2>
							<p className="mb-8 text-sm text-gray-500 dark:text-gray-400">
								We typically respond to inquiries within 1–2 business days.
							</p>
							<form
								id="contact-form"
								onSubmit={handleSubmit}
								className="space-y-6"
							>
								<div className="grid gap-6 sm:grid-cols-2">
									<Field label="Full name" htmlFor="name">
										<input
											id="name"
											name="name"
											required
											maxLength={80}
											placeholder="Your name"
											className={inputClassName}
										/>
									</Field>
									<Field label="Email address" htmlFor="email">
										<input
											id="email"
											name="email"
											type="email"
											required
											maxLength={254}
											placeholder="you@example.com"
											className={inputClassName}
										/>
									</Field>
								</div>
								<ThemedSelect
									label="Subject"
									name="subject"
									value={subject}
									options={SUBJECTS}
									onChange={setSubject}
								/>
								<Field label="Message" htmlFor="message">
									<textarea
										id="message"
										name="message"
										required
										minLength={10}
										maxLength={5000}
										rows={6}
										placeholder="Please describe your inquiry or issue in detail..."
										className={`${inputClassName} resize-y`}
									/>
								</Field>
								<PrimaryActionButton type="submit" disabled={isSubmitting}>
									<FaPaperPlane />{" "}
									{isSubmitting ? "Sending..." : "Send Message"}
								</PrimaryActionButton>
							</form>
						</section>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}

const inputClassName =
	"w-full rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/15 dark:border-white/10 dark:bg-[#0d1f1c] dark:placeholder:text-gray-500 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/15";

function Field({
	label,
	htmlFor,
	children,
}: {
	label: string;
	htmlFor: string;
	children: React.ReactNode;
}) {
	return (
		<label htmlFor={htmlFor} className="block text-sm font-bold">
			<span className="mb-2 block">{label}</span>
			{children}
		</label>
	);
}

function ContactDetail({
	icon: Icon,
	title,
	value,
	href,
	detail,
}: {
	icon: typeof FaEnvelope;
	title: string;
	value: string;
	href?: string;
	detail?: string;
}) {
	return (
		<div className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
			<span className="mt-0.5 text-[#006C5E] dark:text-[#4ADE80]">
				<Icon />
			</span>
			<div>
				<p className="text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">
					{title}
				</p>
				{href ? (
					<a
						href={href}
						className="mt-1 inline-block font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
					>
						{value}
					</a>
				) : (
					<p className="mt-1 font-bold">{value}</p>
				)}
				{detail && (
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{detail}
					</p>
				)}
			</div>
		</div>
	);
}
