import { ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import { StoryCoverImage } from "@/components/stories/StoryImage";

type StoryPreview = {
	id: string;
	slug?: string | null;
	title: string;
	shortDesc?: string | null;
	coverImage?: string | null;
	publishedAt?: string | null;
	createdAt?: string;
	author?: { name?: string | null };
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

export function StoryPreviewCard({
	story,
	compact = false,
}: {
	story: StoryPreview;
	compact?: boolean;
}) {
	if (!story.slug) return null;
	const date = story.publishedAt || story.createdAt;

	return (
		<Link
			href={`/stories/${story.slug}`}
			className={`group grid gap-5 rounded-xl px-2 py-7 transition-colors hover:bg-slate-50/70 dark:hover:bg-white/[0.03] ${
				compact
					? "sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6 sm:px-3"
					: "sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-8 sm:px-3 sm:py-9"
			}`}
		>
			<div className={`min-w-0 ${compact ? "sm:self-center" : ""}`}>
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
					<span>{story.author?.name || "CookTale"}</span>
					{date && (
						<>
							<span aria-hidden="true">·</span>
							<span>{dateFormatter.format(new Date(date))}</span>
						</>
					)}
				</div>
				<h3
					className={`${compact ? "mt-2 text-lg leading-6" : "mt-3 text-2xl leading-tight sm:text-3xl"} line-clamp-2 font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-[#006c5e] dark:text-white dark:group-hover:text-[#4ade80]`}
				>
					{story.title}
				</h3>
				{story.shortDesc && (
					<p
						className={`${compact ? "mt-2 line-clamp-2 text-sm leading-6" : "mt-3 line-clamp-2 text-base leading-7"} text-slate-600 dark:text-slate-300`}
					>
						{story.shortDesc}
					</p>
				)}
				{!compact && (
					<div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#006c5e] dark:text-[#4ade80]">
						Read story <ArrowRight className="h-4 w-4" aria-hidden="true" />
					</div>
				)}
			</div>
			<div
				className={`relative order-first aspect-[16/10] overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5 ${
					compact ? "sm:order-first" : "sm:order-last"
				}`}
			>
				{story.coverImage ? (
					<StoryCoverImage
						src={story.coverImage}
						alt=""
						sizes={
							compact
								? "(max-width: 640px) 100vw, 128px"
								: "(max-width: 640px) 100vw, 176px"
						}
						className="object-cover"
					/>
				) : (
					<div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500">
						<FileText className="h-6 w-6" aria-hidden="true" />
					</div>
				)}
			</div>
		</Link>
	);
}
