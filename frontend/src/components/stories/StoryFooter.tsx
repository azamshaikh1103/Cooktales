import Link from "next/link";

const links = [
	{ href: "/recipe", label: "Recipes" },
	{ href: "/stories", label: "Stories" },
	{ href: "/community", label: "Community" },
	{ href: "/about", label: "About" },
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
];

export default function StoryFooter() {
	return (
		<footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-[#0a1a18]">
			<div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<Link
						href="/"
						className="text-2xl font-bold text-[#006c5e] dark:text-[#4ade80]"
					>
						CookTale
					</Link>
					<p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
						Recipes and food stories made for home kitchens.
					</p>
				</div>
				<nav
					aria-label="Footer"
					className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600 dark:text-slate-300"
				>
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="cursor-pointer hover:text-[#006c5e] dark:hover:text-[#4ade80]"
						>
							{link.label}
						</Link>
					))}
				</nav>
			</div>
		</footer>
	);
}
