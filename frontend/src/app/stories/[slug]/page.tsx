import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import RelatedStories from "@/components/stories/RelatedStories";
import StoryComments from "@/components/stories/StoryComments";
import StoryEngagement from "@/components/stories/StoryEngagement";
import {
	StoryCoverImage,
	StoryInlineImage,
} from "@/components/stories/StoryImage";
import { StoryRichText } from "@/components/stories/StoryRichText";
import type { Story } from "@/lib/api/storyClient";

type PageProps = { params: Promise<{ slug: string }> };

const API_URL =
	process.env.SERVER_API_URL ||
	process.env.NEXT_SERVER_API_URL ||
	process.env.NEXT_PUBLIC_API_URL ||
	"http://localhost:4000/api/v1";
const SITE_URL = process.env.FRONTEND_URL || "https://www.cooktale.in";

async function getStory(slug: string): Promise<Story | null> {
	const response = await fetch(
		`${API_URL}/stories/${encodeURIComponent(slug)}`,
		{ cache: "no-store" },
	);
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`Story API returned ${response.status}`);
	return ((await response.json()) as { story: Story }).story;
}

function storyDescription(story: Story) {
	const firstParagraph = story.content?.find(
		(block) => block.type === "paragraph",
	);
	const firstParagraphText =
		typeof firstParagraph?.content.text === "string"
			? firstParagraph.content.text
			: "";
	return (
		story.shortDesc ||
		firstParagraphText ||
		`Read ${story.title} on CookTale.`
	).slice(0, 160);
}

function textFromBlock(block: NonNullable<Story["content"]>[number]) {
	return typeof block.content?.text === "string" ? block.content.text : "";
}

function readTime(story: Story) {
	const words =
		story.content?.reduce(
			(total, block) =>
				total + textFromBlock(block).trim().split(/\s+/).filter(Boolean).length,
			0,
		) || 0;
	return Math.max(1, Math.ceil(words / 220));
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const story = await getStory(slug);
	if (!story) return { title: "Story Not Found" };

	const description = storyDescription(story);
	const url = `${SITE_URL}/stories/${story.slug || slug}`;
	return {
		title: story.title,
		description,
		alternates: { canonical: url },
		openGraph: {
			type: "article",
			title: story.title,
			description,
			url,
			siteName: "CookTale",
			...(story.publishedAt ? { publishedTime: story.publishedAt } : {}),
			...(story.author?.name ? { authors: [story.author.name] } : {}),
			...(story.coverImage
				? {
						images: [
							{
								url: story.coverImage,
								width: 1200,
								height: 630,
								alt: story.title,
							},
						],
					}
				: {}),
		},
		twitter: {
			card: "summary_large_image",
			title: story.title,
			description,
			...(story.coverImage ? { images: [story.coverImage] } : {}),
		},
	};
}

export default async function StoryDetailPage({ params }: PageProps) {
	const { slug } = await params;
	const story = await getStory(slug);
	if (!story) notFound();

	const url = `${SITE_URL}/stories/${story.slug || slug}`;
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Article",
		headline: story.title,
		description: storyDescription(story),
		mainEntityOfPage: url,
		datePublished: story.publishedAt || story.createdAt,
		dateModified: story.updatedAt || story.publishedAt || story.createdAt,
		author: story.author?.name
			? { "@type": "Person", name: story.author.name }
			: undefined,
		image: story.coverImage ? [story.coverImage] : undefined,
		publisher: { "@type": "Organization", name: "CookTale", url: SITE_URL },
	};

	return (
		<main className="min-h-screen bg-white pb-24 dark:bg-[#0d1f1c]">
			<JsonLd data={jsonLd} />
			<article className="mx-auto max-w-3xl px-6 pt-28">
				<Link
					href="/stories"
					className="cursor-pointer text-sm font-medium text-[#006c5e] hover:underline dark:text-[#4ade80]"
				>
					Back to stories
				</Link>
				<p className="mt-8 text-sm font-semibold uppercase tracking-wide text-[#006c5e] dark:text-[#4ade80]">
					CookTale story
				</p>
				<h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl dark:text-white">
					{story.title}
				</h1>
				{story.shortDesc && (
					<p className="mt-5 text-xl text-gray-600 dark:text-gray-300">
						{story.shortDesc}
					</p>
				)}
				<div className="mt-8 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-8 dark:border-white/10">
					<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#006c5e]/10 text-sm font-bold text-[#006c5e] dark:bg-[#4ade80]/10 dark:text-[#4ade80]">
						{(story.author?.name || "C").slice(0, 1).toUpperCase()}
					</div>
					<div className="min-w-0">
						{story.author?.username ? (
							<Link
								href={`/profile/${story.author.username}`}
								className="cursor-pointer text-sm font-semibold text-slate-900 hover:text-[#006c5e] dark:text-white dark:hover:text-[#4ade80]"
							>
								{story.author.name || story.author.username}
							</Link>
						) : (
							<p className="text-sm font-semibold text-slate-900 dark:text-white">
								{story.author?.name || "CookTale"}
							</p>
						)}
						<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
							{story.publishedAt
								? new Date(story.publishedAt).toLocaleDateString(undefined, {
										year: "numeric",
										month: "long",
										day: "numeric",
									})
								: "Recently published"}{" "}
							· {readTime(story)} min read
						</p>
					</div>
					{story.tags.length > 0 && (
						<div className="ml-auto flex flex-wrap gap-2">
							{story.tags.slice(0, 3).map((tag) => (
								<Link
									key={tag}
									href={`/stories?tag=${encodeURIComponent(tag)}`}
									className="cursor-pointer rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:text-[#006c5e] dark:bg-white/10 dark:text-slate-300 dark:hover:text-[#4ade80]"
								>
									{tag}
								</Link>
							))}
						</div>
					)}
				</div>
				{story.coverImage && (
					<div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-lg">
						<StoryCoverImage
							src={story.coverImage}
							alt={story.title}
							priority
							sizes="(max-width: 768px) 100vw, 768px"
							className="object-cover"
						/>
					</div>
				)}
				<StoryEngagement
					storyId={story.id}
					initialLikes={story.likes || 0}
					initialViews={story.views || 0}
					initialComments={story.commentsCount || 0}
				/>
				<div className="mt-10 space-y-6 text-lg leading-relaxed text-slate-700 dark:text-gray-200">
					{story.content?.map((block) => (
						<StoryBlock key={block.id} block={block} />
					))}
				</div>
			</article>
			<div className="px-6">
				<StoryComments storyId={story.id} />
				<RelatedStories storyId={story.id} tags={story.tags} />
			</div>
		</main>
	);
}

function StoryBlock({
	block,
}: {
	block: NonNullable<Story["content"]>[number];
}) {
	const content = block.content || {};
	const text = typeof content.text === "string" ? content.text : "";
	if (block.type === "divider")
		return <hr className="border-gray-200 dark:border-white/15" />;
	if (block.type === "headline")
		return (
			<h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
				<StoryRichText value={text} />
			</h2>
		);
	if (block.type === "quote")
		return (
			<blockquote className="border-l-4 border-[#006c5e] pl-5 text-2xl italic dark:border-[#4ade80]">
				<StoryRichText value={text} />
			</blockquote>
		);
	if (block.type === "image" && typeof content.url === "string")
		return <StoryInlineImage src={content.url} alt="Story media" />;
	if (block.type === "video")
		return (
			// biome-ignore lint/a11y/useMediaCaption: Captions are only available when the author supplies a caption track.
			<video
				src={typeof content.url === "string" ? content.url : text}
				controls
				className="aspect-video w-full rounded-lg"
			/>
		);
	if (block.type === "link")
		return (
			<a
				href={text}
				target="_blank"
				rel="noreferrer"
				className="text-[#006c5e] underline dark:text-[#4ade80]"
			>
				{text}
			</a>
		);
	if (block.type === "codeblock")
		return (
			<pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-green-300">
				<code>{text}</code>
			</pre>
		);
	return (
		<p>
			<StoryRichText value={text} />
		</p>
	);
}
