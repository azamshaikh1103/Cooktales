"use client";

import Image from "next/image";
import Link from "next/link";
import { FaBookOpen, FaStar, FaUtensils } from "react-icons/fa";
import {
	type InlineToken,
	isSafeUrl,
	parseBlocks,
	tokenizeInline,
} from "@/lib/community/discussionMarkdown";
import imageLoader from "@/lib/loader";

const LINK_CLASS = "text-[#006C5E] underline dark:text-[#4ADE80]";

const renderTokens = (tokens: InlineToken[], key: string): React.ReactNode[] =>
	tokens.map((token, position) => {
		const childKey = `${key}-${position}`;
		switch (token.type) {
			case "text":
				return token.value;
			case "code":
				return (
					<code
						key={childKey}
						className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/10"
					>
						{token.value}
					</code>
				);
			case "strong":
				return (
					<strong key={childKey}>
						{renderTokens(token.children, childKey)}
					</strong>
				);
			case "em":
				return <em key={childKey}>{renderTokens(token.children, childKey)}</em>;
			case "del":
				return <s key={childKey}>{renderTokens(token.children, childKey)}</s>;
			case "link":
				return (
					<a
						key={childKey}
						href={token.href}
						target="_blank"
						rel="noopener noreferrer"
						className={LINK_CLASS}
					>
						{token.label}
					</a>
				);
			case "url":
				return (
					<a
						key={childKey}
						href={token.href}
						target="_blank"
						rel="noopener noreferrer"
						className={`break-all ${LINK_CLASS}`}
					>
						{token.href}
					</a>
				);
			case "mention":
				return (
					<Link
						key={childKey}
						href={`/profile/${token.value}`}
						className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
					>
						{token.value}
					</Link>
				);
			default:
				return null;
		}
	});

const renderInline = (value: string, key: string) =>
	renderTokens(tokenizeInline(value), key);

const HEADING_CLASS = {
	1: "mt-8 mb-3 text-2xl font-black text-gray-900 dark:text-white",
	2: "mt-6 mb-2 text-xl font-bold text-gray-900 dark:text-white",
	3: "mt-5 mb-2 text-lg font-bold text-gray-900 dark:text-white",
} as const;

const MarkdownText = ({ text, itemKey }: { text: string; itemKey: string }) => (
	<>
		{parseBlocks(text).map((block, blockPosition) => {
			const blockKey = `${itemKey}-${block.type}-${blockPosition}`;
			switch (block.type) {
				case "heading": {
					const Heading = `h${block.level + 1}` as "h2" | "h3" | "h4";
					return (
						<Heading key={blockKey} className={HEADING_CLASS[block.level]}>
							{renderInline(block.text, blockKey)}
						</Heading>
					);
				}
				case "quote":
					return (
						<blockquote
							key={blockKey}
							className="my-4 rounded-xl bg-gray-100 px-4 py-3 text-gray-700 dark:bg-white/5 dark:text-gray-300"
						>
							{renderInline(block.lines.join("\n"), blockKey)}
						</blockquote>
					);
				case "code":
					return (
						<pre
							key={blockKey}
							className="my-4 overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-[13px] leading-6 text-gray-100"
						>
							<code>{block.text}</code>
						</pre>
					);
				case "list": {
					const List = block.ordered ? "ol" : "ul";
					return (
						<List
							key={blockKey}
							className={`my-4 space-y-1 pl-6 ${block.ordered ? "list-decimal" : "list-disc"}`}
						>
							{block.items.map((item, itemPosition) => {
								const listKey = `${blockKey}-${itemPosition}`;
								return <li key={listKey}>{renderInline(item, listKey)}</li>;
							})}
						</List>
					);
				}
				case "paragraph":
					return (
						<p key={blockKey} className="mb-4 whitespace-pre-line">
							{renderInline(block.lines.join("\n"), blockKey)}
						</p>
					);
				default:
					return null;
			}
		})}
	</>
);

const parseContent = (text: string, attachments: any) => {
	const splitRegex =
		/((?:\[RECIPE:[^\]]+\])|(?:\[BLOG:[^\]]+\])|(?:!\[.*?\]\(.*?\)))/g;
	return text.split(splitRegex).map((part, index) => {
		if (part.startsWith("[RECIPE:")) {
			const id = part.replace("[RECIPE:", "").replace("]", "");
			const data = attachments?.recipes?.find(
				(recipe: any) => recipe.id === id,
			);
			// biome-ignore lint/suspicious/noArrayIndexKey: parts come from splitting one immutable string, so position is the only identity and never reorders
			return data ? <EmbedCard key={index} data={data} type="recipe" /> : null;
		}
		if (part.startsWith("[BLOG:")) {
			const id = part.replace("[BLOG:", "").replace("]", "");
			const data = attachments?.stories?.find((story: any) => story.id === id);
			// biome-ignore lint/suspicious/noArrayIndexKey: parts come from splitting one immutable string, so position is the only identity and never reorders
			return data ? <EmbedCard key={index} data={data} type="story" /> : null;
		}
		if (part.startsWith("![") && part.includes("](")) {
			const match = part.match(/!\[(.*?)\]\((.*?)\)/);
			if (!match || !isSafeUrl(match[2])) return null;
			return (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: parts come from splitting one immutable string, so position is the only identity and never reorders
					key={index}
					className="relative my-8 aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 shadow-lg dark:border-white/10"
				>
					<Image
						src={match[2]}
						fill
						alt={match[1]}
						className="object-cover"
						loader={imageLoader}
					/>
				</div>
			);
		}
		return (
			// biome-ignore lint/suspicious/noArrayIndexKey: parts come from splitting one immutable string, so position is the only identity and never reorders
			<MarkdownText key={index} text={part} itemKey={`content-${index}`} />
		);
	});
};

const EmbedCard = ({ data, type }: { data: any; type: "recipe" | "story" }) => (
	<Link
		href={
			type === "recipe" && data.slug
				? `/recipe/${data.slug}`
				: type === "recipe"
					? "/recipe"
					: `/stories/${data.slug || data.id}`
		}
		className="not-prose block"
	>
		<div className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#006C5E] dark:border-white/10 dark:bg-[#152a26] dark:hover:border-[#4ADE80]">
			<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
				<Image
					src={type === "recipe" ? data.mainImage : data.coverImage}
					fill
					alt=""
					className="object-cover transition-transform group-hover:scale-110"
					loader={imageLoader}
				/>
			</div>
			<div className="min-w-0 flex-1">
				<div className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
					{type === "recipe" ? (
						<FaUtensils className="text-[#006C5E] dark:text-[#4ADE80]" />
					) : (
						<FaBookOpen className="text-blue-500" />
					)}
					<span>{type}</span>
				</div>
				<h4 className="truncate text-lg font-bold text-gray-900 dark:text-white">
					{type === "recipe" ? data.name : data.title}
				</h4>
				{type === "recipe" && data.ratings > 0 && (
					<div className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
						<FaStar className="text-yellow-400" /> {data.ratings.toFixed(1)}
					</div>
				)}
				{type === "story" && (
					<p className="truncate text-sm text-gray-500 dark:text-gray-400">
						{data.shortDesc}
					</p>
				)}
			</div>
		</div>
	</Link>
);

export default function RichContent({
	content,
	attachments,
}: {
	content: string;
	attachments: any;
}) {
	return (
		<div className="text-lg leading-loose text-gray-600 dark:text-gray-300">
			{parseContent(content, attachments)}
		</div>
	);
}
