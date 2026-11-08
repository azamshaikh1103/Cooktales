/**
 * Shared markdown engine for user-written rich text.
 *
 * One small markdown subset is stored in the database:
 *   full  : # / ## / ### headings, > quotes, ``` fenced code, - and 1. lists,
 *           **bold**, _italic_, ~~strike~~, `code`, [label](https://link) and bare links
 *   light : paragraphs, - and 1. lists, **bold**, _italic_ and links only
 *           (recipe steps and chef's tips: anything else stays plain text)
 *
 * The editor (HTML <-> markdown) and every renderer use the parser here, so what people write,
 * paste and read can never drift apart. Old plain-text values are valid markdown: line breaks
 * are kept and nothing is lost.
 */

export type RichTextVariant = "full" | "light";

export const isSafeUrl = (value: string) => /^https?:\/\//i.test(value);

export const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

export type InlineToken =
	| { type: "text"; value: string }
	| { type: "code"; value: string }
	| { type: "strong" | "em" | "del"; children: InlineToken[] }
	| { type: "link"; href: string; label: string }
	| { type: "url"; href: string }
	| { type: "mention"; value: string };

// Capture groups keep the same positions in both variants; disabled ones can never match.
const NEVER = "((?!)x)";

const buildInlinePattern = (variant: RichTextVariant) => {
	const full = variant === "full";
	return new RegExp(
		[
			full ? "(`[^`\\n]+`)" : NEVER,
			"(\\*\\*[^*\\n]+\\*\\*)",
			full ? "(~~[^~\\n]+~~)" : NEVER,
			"((?<![\\w*])_[^_\\n]+_(?!\\w))",
			"(\\[[^\\]\\n]+\\]\\(https?:\\/\\/[^\\s)]+\\))",
			"(https?:\\/\\/[^\\s<]+)",
			full ? "((?<![\\w@/.])@\\w+)" : NEVER,
		].join("|"),
		"g",
	);
};

const INLINE_PATTERNS: Record<RichTextVariant, RegExp> = {
	full: buildInlinePattern("full"),
	light: buildInlinePattern("light"),
};

const TRAILING_URL_PUNCTUATION = /[.,;:!?)\]]+$/;

export function tokenizeInline(
	value: string,
	variant: RichTextVariant = "full",
): InlineToken[] {
	const tokens: InlineToken[] = [];
	let last = 0;

	const pushText = (text: string) => {
		if (text) tokens.push({ type: "text", value: text });
	};

	for (const match of value.matchAll(INLINE_PATTERNS[variant])) {
		const start = match.index ?? 0;
		const raw = match[0];
		pushText(value.slice(last, start));
		last = start + raw.length;

		if (match[1]) {
			tokens.push({ type: "code", value: raw.slice(1, -1) });
		} else if (match[2]) {
			tokens.push({
				type: "strong",
				children: tokenizeInline(raw.slice(2, -2), variant),
			});
		} else if (match[3]) {
			tokens.push({
				type: "del",
				children: tokenizeInline(raw.slice(2, -2), variant),
			});
		} else if (match[4]) {
			tokens.push({
				type: "em",
				children: tokenizeInline(raw.slice(1, -1), variant),
			});
		} else if (match[5]) {
			const link = raw.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
			if (link && isSafeUrl(link[2])) {
				tokens.push({ type: "link", label: link[1], href: link[2] });
			} else {
				pushText(raw);
			}
		} else if (match[6]) {
			const trailing = raw.match(TRAILING_URL_PUNCTUATION)?.[0] ?? "";
			const href = trailing ? raw.slice(0, -trailing.length) : raw;
			if (isSafeUrl(href) && href.length > 8) {
				tokens.push({ type: "url", href });
				pushText(trailing);
			} else {
				pushText(raw);
			}
		} else if (match[7]) {
			tokens.push({ type: "mention", value: raw });
		}
	}

	pushText(value.slice(last));
	return tokens;
}

const tokensToHtml = (tokens: InlineToken[]): string =>
	tokens
		.map((token) => {
			switch (token.type) {
				case "text":
				case "mention":
					return escapeHtml(token.value);
				case "code":
					return `<code>${escapeHtml(token.value)}</code>`;
				case "strong":
					return `<strong>${tokensToHtml(token.children)}</strong>`;
				case "em":
					return `<em>${tokensToHtml(token.children)}</em>`;
				case "del":
					return `<s>${tokensToHtml(token.children)}</s>`;
				case "link":
					return `<a href="${escapeHtml(token.href)}">${escapeHtml(token.label)}</a>`;
				case "url":
					return `<a href="${escapeHtml(token.href)}">${escapeHtml(token.href)}</a>`;
				default:
					return "";
			}
		})
		.join("");

const tokensToText = (tokens: InlineToken[]): string =>
	tokens
		.map((token) => {
			switch (token.type) {
				case "link":
					return token.label;
				case "url":
					return token.href;
				case "strong":
				case "em":
				case "del":
					return tokensToText(token.children);
				default:
					return token.value;
			}
		})
		.join("");

/** Inline markdown -> safe editor HTML (everything is escaped first). */
export const inlineMarkdownToHtml = (
	value: string,
	variant: RichTextVariant = "full",
) => tokensToHtml(tokenizeInline(value, variant));

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

export type Block =
	| { type: "heading"; level: 1 | 2 | 3; text: string }
	| { type: "quote"; lines: string[] }
	| { type: "code"; text: string }
	| { type: "list"; ordered: boolean; items: string[] }
	| { type: "paragraph"; lines: string[] };

const FENCE = /^\s*```/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

const startsBlock = (line: string, full: boolean) =>
	(full && (FENCE.test(line) || HEADING.test(line) || QUOTE.test(line))) ||
	BULLET.test(line) ||
	NUMBERED.test(line);

export function parseBlocks(
	markdown: string,
	variant: RichTextVariant = "full",
): Block[] {
	const full = variant === "full";
	const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
	const blocks: Block[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];

		if (!line.trim()) {
			index += 1;
			continue;
		}

		if (full && FENCE.test(line)) {
			const code: string[] = [];
			index += 1;
			while (index < lines.length && !FENCE.test(lines[index])) {
				code.push(lines[index]);
				index += 1;
			}
			index += 1; // closing fence
			blocks.push({ type: "code", text: code.join("\n") });
			continue;
		}

		const heading = full ? line.match(HEADING) : null;
		if (heading) {
			blocks.push({
				type: "heading",
				level: Math.min(heading[1].length, 3) as 1 | 2 | 3,
				text: heading[2].trim(),
			});
			index += 1;
			continue;
		}

		if (full && QUOTE.test(line)) {
			const quote: string[] = [];
			while (index < lines.length) {
				const match = lines[index].match(QUOTE);
				if (!match) break;
				quote.push(match[1]);
				index += 1;
			}
			blocks.push({ type: "quote", lines: quote });
			continue;
		}

		const bullet = BULLET.test(line);
		const numbered = !bullet && NUMBERED.test(line);
		if (bullet || numbered) {
			const pattern = bullet ? BULLET : NUMBERED;
			const items: string[] = [];
			while (index < lines.length) {
				const match = lines[index].match(pattern);
				if (!match) break;
				items.push(match[1].trim());
				index += 1;
			}
			blocks.push({ type: "list", ordered: numbered, items });
			continue;
		}

		const paragraph: string[] = [];
		while (
			index < lines.length &&
			lines[index].trim() &&
			!startsBlock(lines[index], full)
		) {
			paragraph.push(lines[index].trimEnd());
			index += 1;
		}
		blocks.push({ type: "paragraph", lines: paragraph });
	}

	return blocks;
}

/** Markdown -> safe editor HTML (the only HTML ever put into an editor). */
export function markdownToHtml(
	markdown: string,
	variant: RichTextVariant = "full",
): string {
	const inline = (value: string) => inlineMarkdownToHtml(value, variant);
	return parseBlocks(markdown, variant)
		.map((block) => {
			switch (block.type) {
				case "heading":
					return `<h${block.level}>${inline(block.text)}</h${block.level}>`;
				case "quote":
					return `<blockquote>${block.lines.map(inline).join("<br>")}</blockquote>`;
				case "code":
					return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
				case "list": {
					const tag = block.ordered ? "ol" : "ul";
					return `<${tag}>${block.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`;
				}
				case "paragraph":
					return `<p>${block.lines.map(inline).join("<br>")}</p>`;
				default:
					return "";
			}
		})
		.join("");
}

/** Plain text for search engines, previews and anywhere markup would leak through. */
export function markdownToPlainText(
	markdown: string,
	variant: RichTextVariant = "light",
): string {
	const text = (value: string) => tokensToText(tokenizeInline(value, variant));
	const parts: string[] = [];
	for (const block of parseBlocks(markdown, variant)) {
		switch (block.type) {
			case "heading":
				parts.push(text(block.text));
				break;
			case "code":
				parts.push(block.text);
				break;
			case "list":
				for (const item of block.items) {
					const plain = text(item);
					parts.push(/[\w)]$/.test(plain) ? `${plain}.` : plain);
				}
				break;
			default:
				parts.push(text(block.lines.join(" ")));
		}
	}
	return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Clean up text pasted from Word, PDFs and chat apps before it is read as markdown. */
export const normalizePastedText = (value: string) =>
	value
		.replace(/\r\n?/g, "\n")
		.replace(/ /g, " ")
		.replace(/[​-‍﻿]/g, "")
		.replace(/^[\t ]*[•‣⁃◦▪●·]\s*/gm, "- ")
		.replace(/^[\t ]*[–—]\s+/gm, "- ");

// ---------------------------------------------------------------------------
// HTML -> markdown (editor content and pasted clipboard HTML)
// ---------------------------------------------------------------------------

const STRIP =
	"script,style,meta,link,head,title,noscript,svg,iframe,img,picture,video,audio,canvas,button,input,textarea,select,form,object,embed";

type Context = { light: boolean };

const hasStyle = (element: Element, pattern: RegExp) =>
	pattern.test((element.getAttribute("style") || "").toLowerCase());

const isBold = (element: Element) => {
	const tag = element.tagName;
	if (tag === "STRONG" || tag === "B") {
		return !hasStyle(element, /font-weight:\s*(normal|400|300|200|100)/);
	}
	return hasStyle(element, /font-weight:\s*(bold|[6-9]00)/);
};
const isItalic = (element: Element) =>
	element.tagName === "EM" ||
	element.tagName === "I" ||
	hasStyle(element, /font-style:\s*italic/);
const isStrike = (element: Element) =>
	["S", "DEL", "STRIKE"].includes(element.tagName) ||
	hasStyle(element, /text-decoration[^;]*line-through/);

/** Moves outer whitespace outside the markers so `**bold **` never breaks. */
const wrap = (marker: string, inner: string) => {
	const match = inner.match(/^(\s*)([\s\S]*?)(\s*)$/);
	if (!match || !match[2]) return inner;
	return `${match[1]}${marker}${match[2]}${marker}${match[3]}`;
};

const BLOCK_TAGS = new Set([
	"P",
	"DIV",
	"SECTION",
	"ARTICLE",
	"MAIN",
	"HEADER",
	"FOOTER",
	"ASIDE",
	"NAV",
	"H1",
	"H2",
	"H3",
	"H4",
	"H5",
	"H6",
	"UL",
	"OL",
	"LI",
	"BLOCKQUOTE",
	"PRE",
	"TABLE",
	"TR",
	"FIGURE",
	"FIGCAPTION",
	"DETAILS",
	"SUMMARY",
	"DL",
	"DT",
	"DD",
	"HR",
	"TBODY",
	"THEAD",
	"TFOOT",
]);

function convertChildren(element: Node, ctx: Context, inPre = false): string {
	return Array.from(element.childNodes)
		.map((child) => convertNode(child, ctx, inPre))
		.join("");
}

function listItems(list: Element, ctx: Context, out: string[]) {
	for (const child of Array.from(list.children)) {
		if (child.tagName !== "LI") continue;
		const own = Array.from(child.childNodes)
			.filter(
				(node) =>
					!(
						node instanceof Element &&
						(node.tagName === "UL" || node.tagName === "OL")
					),
			)
			.map((node) => convertNode(node, ctx))
			.join("")
			.replace(/\s*\n+\s*/g, " ")
			.replace(/\s+/g, " ")
			.trim();
		if (own) out.push(own);
		for (const nested of Array.from(child.children)) {
			if (nested.tagName === "UL" || nested.tagName === "OL") {
				listItems(nested, ctx, out);
			}
		}
	}
}

function convertNode(node: Node, ctx: Context, inPre = false): string {
	if (node.nodeType === Node.TEXT_NODE) {
		const text = node.textContent || "";
		return inPre ? text : text.replace(/ /g, " ").replace(/[\t\n\r ]+/g, " ");
	}
	if (!(node instanceof Element)) return "";
	if (node.matches(STRIP)) return "";

	const { light } = ctx;
	const tag = node.tagName;
	const block = (content: string) => {
		const trimmed = content.replace(/^[ \t]+|[ \t]+$/gm, "").trim();
		return trimmed ? `\n\n${trimmed}\n\n` : "";
	};

	if (tag === "BR") return "\n";
	if (tag === "UL" || tag === "OL") {
		const items: string[] = [];
		listItems(node, ctx, items);
		if (!items.length) return "";
		const lines = items.map((item, i) =>
			tag === "OL" ? `${i + 1}. ${item}` : `- ${item}`,
		);
		return `\n\n${lines.join("\n")}\n\n`;
	}
	if (tag === "PRE") {
		const code = (node.textContent || "").replace(/\n+$/, "");
		if (!code.trim()) return "";
		return light ? block(code) : `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
	}
	if (!light && /^H[1-6]$/.test(tag)) {
		const level = tag === "H1" ? "#" : tag === "H2" ? "##" : "###";
		const text = convertChildren(node, ctx)
			.replace(/\*\*|~~/g, "")
			.replace(/\s+/g, " ")
			.trim();
		return text ? `\n\n${level} ${text}\n\n` : "";
	}
	if (!light && tag === "BLOCKQUOTE") {
		const inner = convertChildren(node, ctx)
			.replace(/\n{3,}/g, "\n\n")
			.trim();
		if (!inner) return "";
		return `\n\n${inner
			.split("\n")
			.map((line) => `> ${line}`.trimEnd())
			.join("\n")}\n\n`;
	}
	if (tag === "TR") {
		const cells = Array.from(node.children)
			.map((cell) => convertChildren(cell, ctx).replace(/\s+/g, " ").trim())
			.filter(Boolean);
		return cells.length ? `\n${cells.join(" | ")}\n` : "";
	}
	if (tag === "HR") return "";
	if (!light && ["CODE", "KBD", "TT", "SAMP"].includes(tag)) {
		if (inPre) return node.textContent || "";
		const code = (node.textContent || "").replace(/\s+/g, " ").trim();
		return code ? `\`${code.replace(/`/g, "'")}\`` : "";
	}
	if (tag === "A") {
		const label = convertChildren(node, ctx).replace(/\s+/g, " ").trim();
		const href =
			(node as HTMLAnchorElement).href || node.getAttribute("href") || "";
		if (!label) return "";
		if (!isSafeUrl(href)) return label;
		const sameAsLabel = label.replace(/\/$/, "") === href.replace(/\/$/, "");
		return sameAsLabel ? label : `[${label.replace(/[[\]]/g, "")}](${href})`;
	}

	let content = convertChildren(node, ctx, inPre);
	if (isBold(node)) content = wrap("**", content);
	if (isItalic(node)) content = wrap("_", content);
	if (!light && isStrike(node)) content = wrap("~~", content);

	if (BLOCK_TAGS.has(tag)) return block(content);
	return content;
}

/** Looks like an editor-style monospace dump (VS Code, terminals): paste as code. */
const looksLikeCodeDump = (body: HTMLElement) => {
	const first = body.firstElementChild;
	return Boolean(
		first &&
			hasStyle(
				first,
				/font-family:[^;]*(monospace|consolas|menlo|courier|mono)/,
			),
	);
};

export function htmlToMarkdown(
	html: string,
	variant: RichTextVariant = "full",
): string {
	const ctx: Context = { light: variant === "light" };
	const doc = new DOMParser().parseFromString(html, "text/html");
	doc.querySelectorAll(STRIP).forEach((element) => {
		element.remove();
	});

	if (looksLikeCodeDump(doc.body)) {
		const root = doc.body.firstElementChild as Element;
		for (const lineBreak of Array.from(root.querySelectorAll("br"))) {
			lineBreak.replaceWith("\n");
		}
		const rows = Array.from(root.children).filter((child) =>
			/^(DIV|P)$/.test(child.tagName),
		);
		const code = (
			rows.length > 1
				? rows.map((row) => row.textContent || "").join("\n")
				: root.textContent || ""
		)
			.replace(/ /g, " ")
			.replace(/\n+$/, "");
		if (!code.trim()) return "";
		return ctx.light ? code : `\`\`\`\n${code}\n\`\`\``;
	}

	return (
		convertChildren(doc.body, ctx)
			.replace(/[ \t]+\n/g, "\n")
			.replace(/\n{3,}/g, "\n\n")
			// Word and Docs paste list items as glyph-prefixed paragraphs: turn them into real lists.
			.replace(/^[ \t]*[•‣⁃◦▪●·]\s*/gm, "- ")
			.replace(/^(- .*)\n\n(?=- )/gm, "$1\n")
			.trim()
	);
}
