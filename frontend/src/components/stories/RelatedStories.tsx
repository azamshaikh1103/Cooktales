"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoryPreviewCard } from "@/components/stories/StoryPreviewCard";
import { type Story, storyClient } from "@/lib/api/storyClient";

type StoryCollectionProps = {
	title: string;
	stories: Story[];
	seeMoreHref: string;
};

function StoryCollection({
	title,
	stories,
	seeMoreHref,
}: StoryCollectionProps) {
	if (!stories.length) return null;

	const headingId = `${title.replaceAll(" ", "-").toLowerCase()}-heading`;
	return (
		<section aria-labelledby={headingId}>
			<div className="flex items-baseline justify-between gap-4">
				<h2
					id={headingId}
					className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white"
				>
					{title}
				</h2>
				<Link
					href={seeMoreHref}
					className="shrink-0 text-sm font-semibold text-[#006c5e] hover:underline dark:text-[#4ade80]"
				>
					See more
				</Link>
			</div>
			<ul className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
				{stories.map((story) => (
					<li key={story.id}>
						<StoryPreviewCard story={story} compact />
					</li>
				))}
			</ul>
		</section>
	);
}

export default function RelatedStories({
	storyId,
	tags,
	author,
}: {
	storyId: string;
	tags: string[];
	author?: Story["author"];
}) {
	const [recommendations, setRecommendations] = useState<Story[]>([]);
	const [fromAuthor, setFromAuthor] = useState<Story[]>([]);

	useEffect(() => {
		void storyClient
			.list({ tag: tags[0], limit: 5, sortBy: "popular" })
			.then((result) =>
				setRecommendations(
					result.stories.filter((item) => item.id !== storyId).slice(0, 4),
				),
			)
			.catch(() => undefined);
	}, [storyId, tags]);

	useEffect(() => {
		if (!author?.id) return;
		void storyClient
			.list({ authorId: author.id, limit: 5 })
			.then((result) =>
				setFromAuthor(
					result.stories.filter((item) => item.id !== storyId).slice(0, 4),
				),
			)
			.catch(() => undefined);
	}, [author?.id, storyId]);

	if (!recommendations.length && !fromAuthor.length) return null;

	const recommendationHref = tags[0]
		? `/stories?tag=${encodeURIComponent(tags[0])}`
		: "/stories";
	const authorHref = author?.username
		? `/profile/${author.username}`
		: "/stories";

	return (
		<div className="mx-auto mt-16 max-w-3xl space-y-14">
			<StoryCollection
				title="Recommended for you"
				stories={recommendations}
				seeMoreHref={recommendationHref}
			/>
			<StoryCollection
				title={
					author?.name ? `More from ${author.name}` : "More from this author"
				}
				stories={fromAuthor}
				seeMoreHref={authorHref}
			/>
		</div>
	);
}
