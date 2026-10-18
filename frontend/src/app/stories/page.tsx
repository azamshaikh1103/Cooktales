"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoryCoverImage } from "@/components/stories/StoryImage";
import { type Story, storyClient } from "@/lib/api/storyClient";

export default function StoriesPage() {
	const [stories, setStories] = useState<Story[]>([]);
	const [loading, setLoading] = useState(true);
	useEffect(() => {
		void storyClient
			.list()
			.then(({ stories: next }) => setStories(next))
			.finally(() => setLoading(false));
	}, []);
	return (
		<main className="mx-auto min-h-screen max-w-6xl px-6 py-28 dark:bg-[#0d1f1c]">
			<div className="mb-10 flex items-end justify-between">
				<div>
					<p className="text-sm text-[#006c5e] dark:text-[#4ade80]">
						CookTale stories
					</p>
					<h1 className="mt-2 text-4xl font-semibold text-slate-900 dark:text-white">
						From the kitchen
					</h1>
				</div>
				<Link
					href="/new-story"
					className="cursor-pointer rounded-md bg-[#006c5e] px-4 py-2 text-sm font-medium text-white dark:bg-[#4ade80] dark:text-[#092019]"
				>
					Write a story
				</Link>
			</div>
			{loading ? (
				<p className="text-gray-500">Loading stories...</p>
			) : stories.length === 0 ? (
				<p className="text-gray-500">No stories have been published yet.</p>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{stories.map((story) => (
						<Link
							href={`/stories/${story.slug}`}
							key={story.id}
							className="group overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-[#122923]"
						>
							<div className="relative aspect-[16/9] bg-gray-100 dark:bg-white/5">
								{story.coverImage && (
									<StoryCoverImage
										src={story.coverImage}
										alt=""
										sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
										className="object-cover"
									/>
								)}
							</div>
							<div className="p-5">
								<div className="mb-2 text-xs text-gray-500">
									{story.publishedAt
										? new Date(story.publishedAt).toLocaleDateString()
										: ""}
								</div>
								<h2 className="text-xl font-medium text-slate-900 group-hover:text-[#006c5e] dark:text-white dark:group-hover:text-[#4ade80]">
									{story.title}
								</h2>
								<p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
									{story.shortDesc}
								</p>
								<p className="mt-4 text-sm text-gray-500">
									{story.author?.name}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</main>
	);
}
