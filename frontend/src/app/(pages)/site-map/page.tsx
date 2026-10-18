import Link from "next/link";
import { MetadataRoute } from "next";
import {
	FaHome,
	FaSearch,
	FaUtensils,
	FaQuestionCircle,
	FaShieldAlt,
	FaEnvelope,
	FaFileContract,
	FaBookOpen,
	FaPenNib,
	FaMapMarkedAlt,
	FaComments,
	FaTrophy,
	FaCrown,
	FaCookieBite,
	FaBriefcase,
} from "react-icons/fa";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function Sitemap() {
	const sections = [
		{
			title: "Discover",
			links: [
				{ href: "/", icon: FaHome, label: "Home", desc: "The main dashboard." },
				{
					href: "/recipe",
					icon: FaUtensils,
					label: "Recipes",
					desc: "Browse thousands of dishes.",
				},
				{
					href: "/stories",
					icon: FaBookOpen,
					label: "Stories",
					desc: "Culinary articles & news.",
				},
				{
					href: "/community",
					icon: FaMapMarkedAlt,
					label: "Community",
					desc: "Join the chef tribe.",
				},
				{
					href: "/search",
					icon: FaSearch,
					label: "Search",
					desc: "Find recipes, Stories, and creators.",
				},
				{
					href: "/community/discussion",
					icon: FaComments,
					label: "Discussions",
					desc: "Talk food with the community.",
				},
				{
					href: "/community/challenge",
					icon: FaTrophy,
					label: "Challenges",
					desc: "Explore community cooking challenges.",
				},
				{
					href: "/community/leaderboard",
					icon: FaTrophy,
					label: "Leaderboard",
					desc: "See active community creators.",
				},
			],
		},
		{
			title: "Create",
			links: [
				{
					href: "/new-recipe",
					icon: FaUtensils,
					label: "New Recipe",
					desc: "Share your dish.",
				},
				{
					href: "/new-story",
					icon: FaPenNib,
					label: "New Story",
					desc: "Write an article.",
				},
				{
					href: "/community/discussion/create",
					icon: FaComments,
					label: "Start a Discussion",
					desc: "Ask the community a cooking question.",
				},
				{
					href: "/membership",
					icon: FaCrown,
					label: "Membership",
					desc: "View CookTale membership options.",
				},
			],
		},
		{
			title: "Company & Support",
			links: [
				{
					href: "/about",
					icon: FaUtensils,
					label: "About Us",
					desc: "Our mission & team.",
				},
				{
					href: "/careers",
					icon: FaBriefcase,
					label: "Careers",
					desc: "Explore opportunities with CookTale.",
				},
				{
					href: "/partners",
					icon: FaMapMarkedAlt,
					label: "Partners",
					desc: "Learn about working with CookTale.",
				},
				{
					href: "/contact",
					icon: FaEnvelope,
					label: "Contact",
					desc: "Get in touch.",
				},
				{
					href: "/faq",
					icon: FaQuestionCircle,
					label: "FAQ",
					desc: "Common questions.",
				},
				{
					href: "/privacy",
					icon: FaShieldAlt,
					label: "Privacy",
					desc: "Data protection.",
				},
				{
					href: "/cookies",
					icon: FaCookieBite,
					label: "Cookie Policy",
					desc: "Understand and manage cookie preferences.",
				},
				{
					href: "/site-map",
					icon: FaMapMarkedAlt,
					label: "Sitemap",
					desc: "Browse every main CookTale destination.",
				},
				{
					href: "/terms",
					icon: FaFileContract,
					label: "Terms",
					desc: "Usage guidelines.",
				},
			],
		},
	];

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
			<Navbar />

			<main className="grow pt-24 pb-20 lg:pt-32">
				<div className="container mx-auto px-6 lg:px-24">
					{/* --- HEADER --- */}
					<div className="mx-auto mb-16 max-w-3xl text-center lg:mb-24">
						<div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#006C5E]/10 text-3xl text-[#006C5E] shadow-sm dark:bg-[#006C5E]/20 dark:text-[#4ADE80]">
							<FaMapMarkedAlt />
						</div>
						<h1 className="mb-6 text-4xl leading-tight font-black text-gray-900 lg:text-6xl dark:text-white">
							Explore the <br />
							<span className="bg-linear-to-r from-[#006C5E] to-[#009478] bg-clip-text text-transparent dark:from-[#4ADE80] dark:to-[#006C5E]">
								CookTale Atlas.
							</span>
						</h1>
						<p className="text-lg leading-relaxed text-gray-500 dark:text-gray-500">
							Get a bird's-eye view of our culinary world. Jump to any section
							to start your journey.
						</p>
					</div>

					{/* --- MAP GRID --- */}
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
						{sections.map((section, idx) => (
							<div key={idx} className="flex flex-col gap-6">
								<h3 className="border-b border-gray-200 pb-4 text-sm font-bold tracking-widest text-gray-500 uppercase dark:border-white/10 dark:text-gray-500">
									{section.title}
								</h3>

								<div className="flex flex-col gap-4">
									{section.links.map((link, i) => (
										<Link
											key={i}
											href={link.href}
											className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-colors duration-300 hover:border-[#006C5E]/30 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#006C5E]/50 dark:hover:bg-white/10"
										>
											<div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-500 shadow-sm transition-colors group-hover:bg-[#006C5E] group-hover:text-white dark:bg-white/10 dark:text-gray-500 dark:group-hover:bg-[#006C5E] dark:group-hover:text-white">
												<link.icon className="text-sm" />
											</div>
											<div>
												<h4 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-[#006C5E] dark:text-gray-100 dark:group-hover:text-[#4ADE80]">
													{link.label}
												</h4>
												<p className="mt-1 text-xs font-medium text-gray-500 transition-colors group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300">
													{link.desc}
												</p>
											</div>
										</Link>
									))}
								</div>
							</div>
						))}
					</div>

					{/* --- BOTTOM CTA --- */}
					<div className="relative mt-24 overflow-hidden rounded-[2.5rem] bg-[#006C5E] p-12 text-center text-white shadow-2xl shadow-[#006C5E]/30 dark:bg-[#004d41]">
						{/* Decor */}
						<div
							className="absolute top-0 left-0 h-full w-full opacity-10"
							style={{
								backgroundImage:
									"radial-gradient(circle, white 1px, transparent 1px)",
								backgroundSize: "20px 20px",
							}}
						/>

						<div className="relative z-10">
							<h2 className="mb-4 text-3xl font-black">Still lost?</h2>
							<p className="mx-auto mb-8 max-w-md text-white/80">
								Use our powerful search engine to find specific recipes,
								ingredients, or chefs.
							</p>
							<Link
								href="/search"
								className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 font-bold text-[#006C5E] transition-colors hover:bg-gray-100 dark:bg-[#0d1f1c] dark:text-white dark:hover:bg-black"
							>
								<FaSearch /> Open Search
							</Link>
						</div>
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
