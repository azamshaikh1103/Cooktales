"use client";

import { ArrowRight, BookOpenText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { type Story, storyClient } from "@/lib/api/storyClient";

export default function RelatedStories({
	storyId,
	tags,
}: {
	storyId: string;
	tags: string[];
}) {
	const [stories, setStories] = useState<Story[]>([]);

	useEffect(() => {
		if (!tags[0]) return;
		void storyClient
			.list({ tag: tags[0], limit: 4, sortBy: "popular" })
			.then((result) =>
				setStories(
					result.stories.filter((item) => item.id !== storyId).slice(0, 3),
				),
			)
			.catch(() => undefined);
	}, [storyId, tags]);

	if (!stories.length) return null;
	return (
		<section className="mx-auto mt-16 max-w-3xl border-t border-slate-200 pt-12 dark:border-white/10">
			<p className="text-sm font-semibold uppercase tracking-wide text-[#006c5e] dark:text-[#4ade80]">
				Keep reading
			</p>
			<h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
				More from CookTale
			</h2>
			<div className="mt-6 grid gap-3 sm:grid-cols-3">
				{stories.map((story) => (
					<Link
						key={story.id}
						href={`/stories/${story.slug}`}
						className="group cursor-pointer rounded-lg border border-slate-200 p-4 transition hover:border-[#006c5e] dark:border-white/10 dark:hover:border-[#4ade80]"
					>
						<BookOpenText
							size={19}
							className="text-[#006c5e] dark:text-[#4ade80]"
						/>
						<h3 className="mt-4 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 group-hover:text-[#006c5e] dark:text-white dark:group-hover:text-[#4ade80]">
							{story.title}
						</h3>
						<div className="mt-4 flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
							Read story{" "}
							<ArrowRight
								className="ml-1 transition-transform group-hover:translate-x-1"
								size={14}
							/>
						</div>
					</Link>
				))}
			</div>
		</section>
	);
}
