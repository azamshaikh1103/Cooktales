"use client";

import { useEffect, useRef } from "react";
import {
	FaBold,
	FaImage,
	FaItalic,
	FaLink,
	FaListOl,
	FaListUl,
} from "react-icons/fa";

const escapeHtml = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isSafeUrl = (value: string) => /^https?:\/\//i.test(value);

const inlineHtml = (value: string) =>
	escapeHtml(value)
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/_([^_]+)_/g, "<em>$1</em>")
		.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
		.replace(/(?<!["(])(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');

const markdownToEditorHtml = (value: string) => {
	const lines = value.split("\n");
	const html: string[] = [];

	for (let index = 0; index < lines.length; ) {
		const line = lines[index];
		if (/^[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
				items.push(
					`<li>${inlineHtml(lines[index].replace(/^[-*]\s+/, ""))}</li>`,
				);
				index += 1;
			}
			html.push(`<ul>${items.join("")}</ul>`);
			continue;
		}
		if (/^\d+[.)]\s+/.test(line)) {
			const items: string[] = [];
			while (index < lines.length && /^\d+[.)]\s+/.test(lines[index])) {
				items.push(
					`<li>${inlineHtml(lines[index].replace(/^\d+[.)]\s+/, ""))}</li>`,
				);
				index += 1;
			}
			html.push(`<ol>${items.join("")}</ol>`);
			continue;
		}
		html.push(line ? `<p>${inlineHtml(line)}</p>` : "<p><br></p>");
		index += 1;
	}

	return html.join("");
};

const editorHtmlToMarkdown = (html: string) => {
	const documentNode = new DOMParser().parseFromString(html, "text/html");
	const read = (node: Node): string => {
		if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
		if (!(node instanceof HTMLElement)) return "";
		const children = Array.from(node.childNodes).map(read).join("");
		switch (node.tagName) {
			case "STRONG":
			case "B":
				return `**${children}**`;
			case "EM":
			case "I":
				return `_${children}_`;
			case "A": {
				const href = (node as HTMLAnchorElement).href;
				return isSafeUrl(href) ? `[${children}](${href})` : children;
			}
			case "BR":
				return "\n";
			case "UL":
				return Array.from(node.children)
					.map((item) => `- ${read(item)}`)
					.join("\n");
			case "OL":
				return Array.from(node.children)
					.map((item, index) => `${index + 1}. ${read(item)}`)
					.join("\n");
			case "P":
			case "DIV":
				return `${children}\n`;
			default:
				return children;
		}
	};

	return Array.from(documentNode.body.childNodes)
		.map(read)
		.join("")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
};

export const normalizePastedText = (value: string) =>
	value
		.replace(/\r\n?/g, "\n")
		.replace(/^[\t ]*[•‣⁃]\s*/gm, "- ")
		.replace(/^[\t ]*[–—]\s*/gm, "- ");

type DiscussionEditorProps = {
	value: string;
	onChange: (value: string) => void;
	onAttachImage: () => void;
	onAttachContent: () => void;
};

export function DiscussionEditor({
	value,
	onChange,
	onAttachImage,
	onAttachContent,
}: DiscussionEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const lastValue = useRef<string | null>(null);

	useEffect(() => {
		if (!editorRef.current || value === lastValue.current) return;
		editorRef.current.innerHTML = markdownToEditorHtml(value);
		lastValue.current = value;
	}, [value]);

	const update = () => {
		if (!editorRef.current) return;
		const next = editorHtmlToMarkdown(editorRef.current.innerHTML);
		lastValue.current = next;
		onChange(next);
	};

	const format = (
		command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList",
	) => {
		editorRef.current?.focus();
		document.execCommand(command);
		update();
	};

	const addLink = () => {
		const selected = window.getSelection()?.toString().trim();
		const url = window.prompt("Paste a full https:// link");
		if (!url || !isSafeUrl(url)) return;
		editorRef.current?.focus();
		if (selected) document.execCommand("createLink", false, url);
		else document.execCommand("insertText", false, url);
		update();
	};

	return (
		<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors focus-within:border-[#006C5E] focus-within:ring-2 focus-within:ring-[#006C5E]/10 dark:border-white/10 dark:bg-[#112220] dark:focus-within:border-[#4ADE80] dark:focus-within:ring-[#4ADE80]/10">
			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				role="textbox"
				aria-label="Discussion details"
				aria-multiline="true"
				data-placeholder="Share your question, tip, or food story..."
				onInput={update}
				onPaste={(event) => {
					event.preventDefault();
					document.execCommand(
						"insertText",
						false,
						normalizePastedText(event.clipboardData.getData("text/plain")),
					);
					requestAnimationFrame(() => {
						const next = editorHtmlToMarkdown(
							editorRef.current?.innerHTML || "",
						);
						if (editorRef.current)
							editorRef.current.innerHTML = markdownToEditorHtml(next);
						lastValue.current = next;
						onChange(next);
					});
				}}
				className="min-h-60 w-full px-4 py-3 text-sm leading-6 text-gray-800 outline-none empty:before:pointer-events-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)] [&_a]:text-[#006C5E] [&_a]:underline [&_em]:italic [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-bold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 dark:text-gray-100 dark:empty:before:text-gray-500 dark:[&_a]:text-[#4ADE80]"
			/>
			<div className="flex flex-wrap items-center gap-1 border-t border-gray-100 bg-gray-50 px-3 py-2 dark:border-white/10 dark:bg-white/5">
				<button
					type="button"
					onClick={onAttachImage}
					aria-label="Add image"
					title="Add image"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaImage />
				</button>
				<button
					type="button"
					onClick={onAttachContent}
					aria-label="Attach recipe or story"
					title="Attach recipe or story"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaLink />
				</button>
				<span className="mx-1 h-5 border-l border-gray-200 dark:border-white/10" />
				<button
					type="button"
					onClick={() => format("bold")}
					aria-label="Bold"
					title="Bold"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaBold />
				</button>
				<button
					type="button"
					onClick={() => format("italic")}
					aria-label="Italic"
					title="Italic"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaItalic />
				</button>
				<button
					type="button"
					onClick={() => format("insertUnorderedList")}
					aria-label="Bulleted list"
					title="Bulleted list"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaListUl />
				</button>
				<button
					type="button"
					onClick={() => format("insertOrderedList")}
					aria-label="Numbered list"
					title="Numbered list"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaListOl />
				</button>
				<button
					type="button"
					onClick={addLink}
					aria-label="Add link"
					title="Add link"
					className="rounded-lg p-2 text-gray-500 hover:bg-white hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				>
					<FaLink />
				</button>
				<span className="ml-auto hidden text-xs text-gray-500 sm:block dark:text-gray-400">
					Paste text, lists, and links with formatting.
				</span>
			</div>
		</div>
	);
}
