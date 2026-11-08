"use client";

import {
	Bold,
	ChefHat,
	Code,
	Heading2,
	ImagePlus,
	Italic,
	Link2,
	List,
	ListOrdered,
	Quote,
	SquareCode,
	Strikethrough,
} from "lucide-react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import {
	htmlToMarkdown,
	inlineMarkdownToHtml,
	isSafeUrl,
	markdownToHtml,
	normalizePastedText,
} from "@/lib/community/discussionMarkdown";

type ToolState = {
	bold: boolean;
	italic: boolean;
	strike: boolean;
	ul: boolean;
	ol: boolean;
	heading: boolean;
	quote: boolean;
	code: boolean;
	codeBlock: boolean;
};

const NO_TOOLS: ToolState = {
	bold: false,
	italic: false,
	strike: false,
	ul: false,
	ol: false,
	heading: false,
	quote: false,
	code: false,
	codeBlock: false,
};

const closestToSelection = (root: HTMLElement, selector: string) => {
	const node = window.getSelection()?.anchorNode;
	const element = node instanceof Element ? node : node?.parentElement;
	const found = element?.closest(selector);
	return found && root.contains(found) ? found : null;
};

const selectionIsInside = (root: HTMLElement) => {
	const selection = window.getSelection();
	return Boolean(selection?.rangeCount && root.contains(selection.anchorNode));
};

type ToolButtonProps = {
	label: string;
	onClick: () => void;
	active?: boolean;
	children: ReactNode;
};

function ToolButton({ label, onClick, active, children }: ToolButtonProps) {
	return (
		<button
			type="button"
			// Keep the text selection in the editor when the button is pressed.
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			aria-label={label}
			title={label}
			aria-pressed={active}
			className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#006C5E] dark:focus-visible:outline-[#4ADE80] ${
				active
					? "bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]"
					: "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
			}`}
		>
			{children}
		</button>
	);
}

type DiscussionEditorProps = {
	value: string;
	onChange: (value: string) => void;
	onAttachImage: () => void;
	onAttachContent: () => void;
	onBlur?: () => void;
	maxLength?: number;
	placeholder?: string;
};

export function DiscussionEditor({
	value,
	onChange,
	onAttachImage,
	onAttachContent,
	onBlur,
	maxLength = 12000,
	placeholder = "Share your question, tip, or food story...",
}: DiscussionEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const lastValue = useRef<string | null>(null);
	const [isEmpty, setIsEmpty] = useState(true);
	const [tools, setTools] = useState<ToolState>(NO_TOOLS);

	const measureEmpty = useCallback(() => {
		const editor = editorRef.current;
		setIsEmpty(
			!editor ||
				(!(editor.textContent ?? "").trim() && !editor.querySelector("pre")),
		);
	}, []);

	// Apply content that arrives from outside (initial value, reset).
	useEffect(() => {
		const editor = editorRef.current;
		if (!editor || value === lastValue.current) return;
		editor.innerHTML = markdownToHtml(value);
		lastValue.current = value;
		measureEmpty();
	}, [value, measureEmpty]);

	// Make Enter create <p> (not <div>) so content stays clean.
	useEffect(() => {
		document.execCommand("defaultParagraphSeparator", false, "p");
	}, []);

	// Keep the toolbar buttons in step with the caret.
	useEffect(() => {
		const update = () => {
			const editor = editorRef.current;
			if (!editor || !selectionIsInside(editor)) return;
			setTools({
				bold: document.queryCommandState("bold"),
				italic: document.queryCommandState("italic"),
				strike: document.queryCommandState("strikeThrough"),
				ul: document.queryCommandState("insertUnorderedList"),
				ol: document.queryCommandState("insertOrderedList"),
				heading: Boolean(closestToSelection(editor, "h1, h2, h3")),
				quote: Boolean(closestToSelection(editor, "blockquote")),
				code: Boolean(closestToSelection(editor, "code:not(pre code)")),
				codeBlock: Boolean(closestToSelection(editor, "pre")),
			});
		};
		document.addEventListener("selectionchange", update);
		return () => document.removeEventListener("selectionchange", update);
	}, []);

	const sync = () => {
		const editor = editorRef.current;
		if (!editor) return;
		// Clearing everything must also clear the block (heading, list, code) the caret was in.
		if (!(editor.textContent ?? "").trim() && editor.innerHTML !== "") {
			editor.innerHTML = "";
		}
		const next = htmlToMarkdown(editor.innerHTML);
		lastValue.current = next;
		onChange(next);
		measureEmpty();
	};

	const run = (command: string, argument?: string) => {
		editorRef.current?.focus();
		document.execCommand(command, false, argument);
		sync();
	};

	const toggleBlock = (tag: "H2" | "BLOCKQUOTE" | "PRE", selector: string) => {
		const editor = editorRef.current;
		if (!editor) return;
		editor.focus();
		const inside = closestToSelection(editor, selector);
		document.execCommand("formatBlock", false, inside ? "P" : tag);
		sync();
	};

	const toggleCode = () => {
		const editor = editorRef.current;
		if (!editor) return;
		editor.focus();
		const selected = window.getSelection()?.toString() ?? "";
		if (closestToSelection(editor, "pre")) return toggleBlock("PRE", "pre");
		if (closestToSelection(editor, "code")) {
			document.execCommand("insertText", false, selected);
			return sync();
		}
		if (selected && !selected.includes("\n")) {
			const safe = selected.replace(/&/g, "&amp;").replace(/</g, "&lt;");
			document.execCommand("insertHTML", false, `<code>${safe}</code>`);
			return sync();
		}
		toggleBlock("PRE", "pre");
	};

	const addLink = () => {
		const editor = editorRef.current;
		if (!editor) return;
		const selection = window.getSelection();
		const range =
			selection?.rangeCount && selectionIsInside(editor)
				? selection.getRangeAt(0).cloneRange()
				: null;
		const selected = selection?.toString().trim();
		const url = window
			.prompt("Link address (starts with https://)", "https://")
			?.trim();
		editor.focus();
		if (range) {
			selection?.removeAllRanges();
			selection?.addRange(range);
		}
		if (!url || url === "https://") return;
		if (!isSafeUrl(url)) {
			toast.error("Links need to start with http:// or https://");
			return;
		}
		if (selected) {
			document.execCommand("createLink", false, url);
		} else {
			const safe = url
				.replace(/&/g, "&amp;")
				.replace(/"/g, "&quot;")
				.replace(/</g, "&lt;");
			document.execCommand(
				"insertHTML",
				false,
				`<a href="${safe}">${safe}</a>`,
			);
		}
		sync();
	};

	const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
		const editor = editorRef.current;
		if (!editor) return;
		const html = event.clipboardData.getData("text/html");
		const text = event.clipboardData.getData("text/plain");

		if (!html && !text) {
			if (event.clipboardData.files.length) {
				event.preventDefault();
				toast.info("Use the image button to add photos.");
			}
			return;
		}
		event.preventDefault();

		// Inside a code block everything is plain text.
		if (closestToSelection(editor, "pre")) {
			document.execCommand("insertText", false, text);
			return sync();
		}

		// A lone link pasted over selected text turns the selection into a link.
		const trimmed = text.trim();
		if (
			window.getSelection()?.toString().trim() &&
			/^https?:\/\/\S+$/.test(trimmed) &&
			isSafeUrl(trimmed)
		) {
			document.execCommand("createLink", false, trimmed);
			return sync();
		}

		// Rich clipboard (web pages, Docs, Word, chat apps) keeps its structure;
		// plain text is read as markdown so "## Title" and "**bold**" become formatting.
		let markdown = "";
		if (html) {
			try {
				markdown = htmlToMarkdown(html);
			} catch {
				markdown = "";
			}
		}
		if (!markdown.trim()) markdown = normalizePastedText(text);
		markdown = markdown.trim();
		if (!markdown) return;

		document.execCommand(
			"insertHTML",
			false,
			markdown.includes("\n")
				? markdownToHtml(markdown)
				: inlineMarkdownToHtml(markdown),
		);
		sync();
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		const editor = editorRef.current;
		if (!editor) return;
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			addLink();
			return;
		}
		// Enter inside a code block adds a line, not a new block.
		if (
			event.key === "Enter" &&
			!event.shiftKey &&
			closestToSelection(editor, "pre")
		) {
			event.preventDefault();
			document.execCommand("insertText", false, "\n");
			sync();
		}
	};

	const length = value.length;
	const showCount = length > maxLength * 0.8;

	return (
		<div className="overflow-hidden rounded-2xl border border-gray-300 bg-white transition-colors focus-within:border-[#006C5E] focus-within:ring-2 focus-within:ring-[#006C5E]/15 dark:border-white/15 dark:bg-white/[0.03] dark:focus-within:border-[#4ADE80] dark:focus-within:ring-[#4ADE80]/15">
			<div className="relative">
				{isEmpty && (
					<div className="pointer-events-none absolute top-3 left-4 text-[15px] leading-7 text-gray-400 dark:text-gray-500">
						{placeholder}
					</div>
				)}
				{/* biome-ignore lint/a11y/useSemanticElements: rich-text editing needs a contentEditable element, not <textarea> */}
				{/* biome-ignore lint/a11y/useFocusableInteractive: contentEditable is natively focusable */}
				<div
					ref={editorRef}
					contentEditable
					suppressContentEditableWarning
					role="textbox"
					aria-label="Discussion details"
					aria-multiline="true"
					onInput={sync}
					onBlur={onBlur}
					onPaste={handlePaste}
					onKeyDown={handleKeyDown}
					className="min-h-64 w-full px-4 py-3 text-[15px] leading-7 break-words text-gray-900 outline-none dark:text-gray-100 [&_a]:text-[#006C5E] [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:rounded-xl [&_blockquote]:bg-gray-100 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:text-gray-700 dark:[&_blockquote]:bg-white/5 dark:[&_blockquote]:text-gray-300 [&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] dark:[&_code]:bg-white/10 [&_em]:italic [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-bold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6 [&_p]:mb-3 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-gray-900 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre]:text-gray-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_s]:line-through [&_strong]:font-bold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 dark:[&_a]:text-[#4ADE80]"
				/>
			</div>
			<div className="flex items-center gap-1 border-t border-gray-200 px-2 py-1.5 dark:border-white/10">
				<div
					role="toolbar"
					aria-label="Formatting"
					className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
				>
					<ToolButton label="Add image" onClick={onAttachImage}>
						<ImagePlus size={18} />
					</ToolButton>
					<ToolButton
						label="Attach a recipe or story"
						onClick={onAttachContent}
					>
						<ChefHat size={18} />
					</ToolButton>
					<span className="mx-1.5 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/10" />
					<ToolButton
						label="Bold"
						active={tools.bold}
						onClick={() => run("bold")}
					>
						<Bold size={18} />
					</ToolButton>
					<ToolButton
						label="Italic"
						active={tools.italic}
						onClick={() => run("italic")}
					>
						<Italic size={18} />
					</ToolButton>
					<ToolButton
						label="Strikethrough"
						active={tools.strike}
						onClick={() => run("strikeThrough")}
					>
						<Strikethrough size={18} />
					</ToolButton>
					<ToolButton
						label="Heading"
						active={tools.heading}
						onClick={() => toggleBlock("H2", "h1, h2, h3")}
					>
						<Heading2 size={18} />
					</ToolButton>
					<ToolButton label="Link (Ctrl+K)" onClick={addLink}>
						<Link2 size={18} />
					</ToolButton>
					<span className="mx-1.5 h-5 w-px shrink-0 bg-gray-200 dark:bg-white/10" />
					<ToolButton
						label="Bulleted list"
						active={tools.ul}
						onClick={() => run("insertUnorderedList")}
					>
						<List size={18} />
					</ToolButton>
					<ToolButton
						label="Numbered list"
						active={tools.ol}
						onClick={() => run("insertOrderedList")}
					>
						<ListOrdered size={18} />
					</ToolButton>
					<ToolButton
						label="Quote"
						active={tools.quote}
						onClick={() => toggleBlock("BLOCKQUOTE", "blockquote")}
					>
						<Quote size={18} />
					</ToolButton>
					<ToolButton
						label="Inline code"
						active={tools.code}
						onClick={toggleCode}
					>
						<Code size={18} />
					</ToolButton>
					<ToolButton
						label="Code block"
						active={tools.codeBlock}
						onClick={() => toggleBlock("PRE", "pre")}
					>
						<SquareCode size={18} />
					</ToolButton>
				</div>
				{showCount && (
					<span
						className={`shrink-0 px-2 text-xs tabular-nums ${
							length > maxLength
								? "font-semibold text-red-600 dark:text-red-400"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{length.toLocaleString()}/{maxLength.toLocaleString()}
					</span>
				)}
			</div>
		</div>
	);
}
