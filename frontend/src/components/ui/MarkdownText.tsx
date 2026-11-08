import Link from "next/link";
import {
	type InlineToken,
	parseBlocks,
	type RichTextVariant,
	tokenizeInline,
} from "@/lib/richText/markdown";

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

const HEADING_CLASS = {
	1: "mt-8 mb-3 text-2xl font-black text-gray-900 dark:text-white",
	2: "mt-6 mb-2 text-xl font-bold text-gray-900 dark:text-white",
	3: "mt-5 mb-2 text-lg font-bold text-gray-900 dark:text-white",
} as const;

type MarkdownTextProps = {
	text: string;
	/** `light` = bold, italic, links and lists only (recipe steps and tips). */
	variant?: RichTextVariant;
	/** `tight` keeps spacing small for short copy inside cards. */
	spacing?: "comfortable" | "tight";
	keyPrefix?: string;
};

/**
 * Renders the shared markdown subset as React elements. Nothing is ever injected as HTML, and old
 * plain text renders exactly as before: line breaks are kept.
 */
export function MarkdownText({
	text,
	variant = "full",
	spacing = "comfortable",
	keyPrefix = "md",
}: MarkdownTextProps) {
	const tight = spacing === "tight";
	const inline = (value: string, key: string) =>
		renderTokens(tokenizeInline(value, variant), key);

	return (
		<>
			{parseBlocks(text, variant).map((block, blockPosition) => {
				const blockKey = `${keyPrefix}-${block.type}-${blockPosition}`;
				switch (block.type) {
					case "heading": {
						const Heading = `h${block.level + 1}` as "h2" | "h3" | "h4";
						return (
							<Heading key={blockKey} className={HEADING_CLASS[block.level]}>
								{inline(block.text, blockKey)}
							</Heading>
						);
					}
					case "quote":
						return (
							<blockquote
								key={blockKey}
								className="my-4 rounded-xl bg-gray-100 px-4 py-3 text-gray-700 dark:bg-white/5 dark:text-gray-300"
							>
								{inline(block.lines.join("\n"), blockKey)}
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
								className={`space-y-1 pl-6 ${tight ? "my-2 first:mt-0 last:mb-0" : "my-4"} ${block.ordered ? "list-decimal" : "list-disc"}`}
							>
								{block.items.map((item, itemPosition) => {
									const listKey = `${blockKey}-${itemPosition}`;
									return <li key={listKey}>{inline(item, listKey)}</li>;
								})}
							</List>
						);
					}
					case "paragraph":
						return (
							<p
								key={blockKey}
								className={`whitespace-pre-line ${tight ? "mb-2 last:mb-0" : "mb-4"}`}
							>
								{inline(block.lines.join("\n"), blockKey)}
							</p>
						);
					default:
						return null;
				}
			})}
		</>
	);
}
