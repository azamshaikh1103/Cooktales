"use client";

import Image from "next/image";
import Link from "next/link";
import { FaBookOpen, FaStar, FaUtensils } from "react-icons/fa";
import imageLoader from "@/lib/loader";

const isSafeUrl = (value: string) => /^https?:\/\//i.test(value);

const renderInline = (value: string, key: string) =>
	value
		.split(
			/(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+|@\w+)/g,
		)
		.map((part, index) => {
			const childKey = `${key}-${index}`;
			if (/^\*\*[^*]+\*\*$/.test(part))
				return <strong key={childKey}>{part.slice(2, -2)}</strong>;
			if (/^_[^_]+_$/.test(part))
				return <em key={childKey}>{part.slice(1, -1)}</em>;
			const markdownLink = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
			if (markdownLink && isSafeUrl(markdownLink[2]))
				return (
					<a
						key={childKey}
						href={markdownLink[2]}
						target="_blank"
						rel="noopener noreferrer"
						className="text-[#006C5E] underline dark:text-[#4ADE80]"
					>
						{markdownLink[1]}
					</a>
				);
			if (isSafeUrl(part))
				return (
					<a
						key={childKey}
						href={part}
						target="_blank"
						rel="noopener noreferrer"
						className="break-all text-[#006C5E] underline dark:text-[#4ADE80]"
					>
						{part}
					</a>
				);
			if (/^@\w+$/.test(part))
				return (
					<Link
						key={childKey}
						href={`/profile/@${part.slice(1)}`}
						className="font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
					>
						{part}
					</Link>
				);
			return part;
		});

const MarkdownText = ({ text, itemKey }: { text: string; itemKey: string }) => {
	const lines = text.split("\n");
	const blocks: React.ReactNode[] = [];

	for (let index = 0; index < lines.length; ) {
		const line = lines[index];
		const unordered = /^[-*]\s+/.test(line);
		const ordered = /^\d+[.)]\s+/.test(line);
		if (unordered || ordered) {
			const items: string[] = [];
			while (
				index < lines.length &&
				(unordered
					? /^[-*]\s+/.test(lines[index])
					: /^\d+[.)]\s+/.test(lines[index]))
			) {
				items.push(
					lines[index].replace(unordered ? /^[-*]\s+/ : /^\d+[.)]\s+/, ""),
				);
				index += 1;
			}
			const List = unordered ? "ul" : "ol";
			blocks.push(
				<List
					key={`${itemKey}-list-${index}`}
					className={`my-4 space-y-1 pl-6 ${unordered ? "list-disc" : "list-decimal"}`}
				>
					{items.map((item, itemIndex) => (
						<li key={itemIndex}>
							{renderInline(item, `${itemKey}-list-${itemIndex}`)}
						</li>
					))}
				</List>,
			);
			continue;
		}
		if (!line.trim()) {
			index += 1;
			continue;
		}
		const paragraph: string[] = [];
		while (
			index < lines.length &&
			lines[index].trim() &&
			!/^[-*]\s+/.test(lines[index]) &&
			!/^\d+[.)]\s+/.test(lines[index])
		) {
			paragraph.push(lines[index]);
			index += 1;
		}
		blocks.push(
			<p key={`${itemKey}-paragraph-${index}`} className="mb-4">
				{renderInline(paragraph.join("\n"), `${itemKey}-paragraph-${index}`)}
			</p>,
		);
	}

	return <>{blocks}</>;
};

const parseContent = (text: string, attachments: any) => {
	const splitRegex =
		/((?:\[RECIPE:[^\]]+\])|(?:\[BLOG:[^\]]+\])|(?:!\[.*?\]\(.*?\)))/g;
	return text.split(splitRegex).map((part, index) => {
		if (part.startsWith("[RECIPE:")) {
			const id = part.replace("[RECIPE:", "").replace("]", "");
			const data = attachments?.recipes?.find(
				(recipe: any) => recipe.id === id,
			);
			return data ? <EmbedCard key={index} data={data} type="recipe" /> : null;
		}
		if (part.startsWith("[BLOG:")) {
			const id = part.replace("[BLOG:", "").replace("]", "");
			const data = attachments?.stories?.find((story: any) => story.id === id);
			return data ? <EmbedCard key={index} data={data} type="story" /> : null;
		}
		if (part.startsWith("![") && part.includes("](")) {
			const match = part.match(/!\[(.*?)\]\((.*?)\)/);
			if (!match || !isSafeUrl(match[2])) return null;
			return (
				<div
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
