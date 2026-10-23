import { ArrowRight, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import AdUnit from "@/components/AdUnit";
import { StoryCoverImage } from "@/components/stories/StoryImage";
import { PrimaryActionLink } from "@/components/ui/PrimaryActionLink";
import type { Story } from "@/lib/api/storyClient";

const API_URL =
	process.env.SERVER_API_URL ||
	process.env.NEXT_SERVER_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"http://127.0.0.1:4000/api/v1";

const storyDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

export const metadata: Metadata = {
	title: "Food Stories",
	description:
		"Practical food stories, kitchen notes, and cooking ideas from CookTale creators.",
	alternates: { canonical: "/stories" },
	openGraph: {
		title: "Food Stories | CookTale",
		description:
			"Practical food stories, kitchen notes, and cooking ideas from CookTale creators.",
		url: "/stories",
	},
};

async function getStories(): Promise<Story[]> {
	try {
		const response = await fetch(`${API_URL}/stories?limit=12`, {
			cache: "no-store",
		});
		if (!response.ok) return [];
		return ((await response.json()) as { stories: Story[] }).stories;
	} catch {
		return [];
	}
}

export default async function StoriesPage() {
	const stories = await getStories();
	const freshStories = stories.slice(0, 3);
	return (
		<main className="mx-auto min-h-screen w-full max-w-7xl px-5 pt-28 pb-16 sm:px-8 sm:pt-32 lg:px-16 lg:pt-28 lg:pb-24 xl:px-20">
			<div className="border-b border-slate-200 pb-8 dark:border-white/10">
				<p className="text-sm font-medium text-[#006c5e] dark:text-[#4ade80]">
					CookTale stories
				</p>
				<div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
							From the kitchen
						</h1>
						<p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
							Useful food ideas, small kitchen discoveries, and stories worth
							saving for later.
						</p>
					</div>
					<PrimaryActionLink href="/new-story">
						<PenLine className="h-4 w-4" aria-hidden="true" />
						Write a story
					</PrimaryActionLink>
				</div>
			</div>

			<div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
				<section aria-labelledby="latest-stories-heading">
					<h2 id="latest-stories-heading" className="sr-only">
						Latest stories
					</h2>
					{stories.length === 0 ? (
						<div className="py-14 text-center">
							<p className="text-lg font-medium text-slate-900 dark:text-white">
								No stories published yet
							</p>
							<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
								The first kitchen story can start here.
							</p>
						</div>
					) : (
						<div>
							{stories.map((story, index) => (
								<article key={story.id}>
								<Link
									href={`/stories/${story.slug}`}
									className={`group grid gap-5 px-2 py-7 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-8 sm:px-3 sm:py-9 ${
										index > 0 ? "border-t border-slate-200 dark:border-white/10" : ""
									}`}
								>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
											<span>{story.author?.name || "CookTale creator"}</span>
											<span aria-hidden="true">·</span>
											<span>
												{story.publishedAt
													? storyDateFormatter.format(
															new Date(story.publishedAt),
														)
													: "New story"}
											</span>
										</div>
										<h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-[#006c5e] dark:text-white dark:group-hover:text-[#4ade80] sm:text-3xl">
											{story.title}
										</h3>
										{story.shortDesc && (
											<p className="mt-3 line-clamp-2 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
												{story.shortDesc}
											</p>
										)}
										<div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#006c5e] dark:text-[#4ade80]">
											Read story{" "}
											<ArrowRight
												className="h-4 w-4 transition-transform group-hover:translate-x-1"
												aria-hidden="true"
											/>
										</div>
									</div>
									{story.coverImage && (
										<div className="relative order-first aspect-[16/10] overflow-hidden rounded-lg sm:order-last">
											<StoryCoverImage
												src={story.coverImage}
												alt=""
												sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 176px"
												className="object-cover"
											/>
										</div>
									)}
								</Link>
								{index > 0 && (index + 1) % 12 === 0 && (
									<AdUnit
										type="banner"
										slot="stories-list-inline"
										className="mx-2 sm:mx-3"
									/>
								)}
								</article>
							))}
						</div>
					)}
				</section>

				<aside
					className="space-y-8 lg:sticky lg:top-28"
					aria-label="Story recommendations"
				>
					<div className="rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.03]">
						<p className="text-sm font-semibold text-slate-950 dark:text-white">
							Have a kitchen story to share?
						</p>
						<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
							Pass on a practical tip, a food memory, or a useful dinner idea.
						</p>
						<Link
							href="/new-story"
							className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#006c5e] hover:underline dark:text-[#4ade80]"
						>
							Start writing{" "}
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
						</Link>
					</div>

					{freshStories.length > 0 && (
						<div className="border-t border-slate-200 pt-6 dark:border-white/10">
							<h2 className="text-sm font-semibold text-slate-950 dark:text-white">
								Fresh from CookTale
							</h2>
							<ul className="mt-4 space-y-5">
								{freshStories.map((story) => (
									<li key={story.id}>
										<Link
											href={`/stories/${story.slug}`}
											className="group block"
										>
											<p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800 group-hover:text-[#006c5e] dark:text-slate-100 dark:group-hover:text-[#4ade80]">
												{story.title}
											</p>
											<p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
												{story.author?.name || "CookTale creator"}
											</p>
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</aside>
			</div>
		</main>
	);
}
