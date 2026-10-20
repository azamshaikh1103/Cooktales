"use client";

import {
	Bold,
	Code2,
	ChevronDown,
	GripVertical,
	ImageIcon,
	Italic,
	Link2,
	List,
	ListOrdered,
	Plus,
	Trash2,
	Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CloudinaryUploadResult } from "@/lib/hooks/useCloudinaryUpload";

export type StoryEditorBlock = {
	id: string;
	type:
		| "paragraph"
		| "headline"
		| "quote"
		| "image"
		| "video"
		| "link"
		| "codeblock"
		| "divider";
	value: string;
	media?: CloudinaryUploadResult;
};

type Props = {
	content: StoryEditorBlock[];
	onChange: (content: StoryEditorBlock[]) => void;
	onUpload: (
		file: File,
		type: "image" | "video",
	) => Promise<CloudinaryUploadResult | null>;
};

const blockOptions: Array<{ type: StoryEditorBlock["type"]; label: string }> = [
	{ type: "paragraph", label: "Text" },
	{ type: "headline", label: "Heading" },
	{ type: "quote", label: "Quote" },
	{ type: "image", label: "Image" },
	{ type: "video", label: "Video" },
	{ type: "link", label: "Link" },
	{ type: "codeblock", label: "Code" },
	{ type: "divider", label: "Divider" },
];

const escapeHtml = (value: string) =>
	value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const markdownToEditorHtml = (value: string) => {
	const escaped = escapeHtml(value)
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/_([^_]+)_/g, "<em>$1</em>")
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+"([^"]*)")?\)/g, (_match, label, url, description) => {
			const accessibleDescription = description ? ` title="${description}" aria-label="${description}"` : "";
			return `<a href="${url}"${accessibleDescription}>${label}</a>`;
		});
	const lines = escaped.split("\n");
	const isList = lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
	const isOrdered = lines.length > 0 && lines.every((line) => /^\d+[.)]\s+/.test(line));
	if (isList) return `<ul>${lines.map((line) => `<li>${line.replace(/^[-*]\s+/, "")}</li>`).join("")}</ul>`;
	if (isOrdered) return `<ol>${lines.map((line) => `<li>${line.replace(/^\d+[.)]\s+/, "")}</li>`).join("")}</ol>`;
	return escaped.replace(/\n/g, "<br>");
};

const editorHtmlToMarkdown = (html: string) => {
	const documentNode = new DOMParser().parseFromString(html, "text/html");
	const read = (node: Node): string => {
		if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
		if (!(node instanceof HTMLElement)) return "";
		const children = Array.from(node.childNodes).map(read).join("");
		switch (node.tagName) {
			case "STRONG": case "B": return `**${children}**`;
			case "EM": case "I": return `_${children}_`;
			case "CODE": return `\`${children}\``;
			case "A": {
				const href = (node as HTMLAnchorElement).href;
				const description = (node as HTMLAnchorElement).getAttribute("title");
				return href ? `[${children}](${href}${description ? ` "${description}"` : ""})` : children;
			}
			case "BR": return "\n";
			case "LI": return children;
			case "UL": return Array.from(node.children).map((item) => `- ${read(item)}`).join("\n");
			case "OL": return Array.from(node.children).map((item, index) => `${index + 1}. ${read(item)}`).join("\n");
			case "DIV": case "P": return `${children}\n`;
			default: return children;
		}
	};
	return Array.from(documentNode.body.childNodes).map(read).join("").replace(/\n{3,}/g, "\n\n").trim();
};

export function StoryBlockList({ content, onChange, onUpload }: Props) {
	const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
	const update = (id: string, patch: Partial<StoryEditorBlock>) =>
		onChange(
			content.map((block) =>
				block.id === id ? { ...block, ...patch } : block,
			),
		);
	const insert = (afterIndex: number, type: StoryEditorBlock["type"]) => {
		const next = [...content];
		next.splice(afterIndex + 1, 0, {
			id: crypto.randomUUID(),
			type,
			value: "",
		});
		onChange(next);
	};
	const remove = (id: string) => {
		const next = content.filter((block) => block.id !== id);
		onChange(
			next.length
				? next
				: [{ id: crypto.randomUUID(), type: "paragraph", value: "" }],
		);
	};
	const move = (fromId: string, toId: string) => {
		if (fromId === toId) return;
		const fromIndex = content.findIndex((block) => block.id === fromId);
		const toIndex = content.findIndex((block) => block.id === toId);
		if (fromIndex < 0 || toIndex < 0) return;
		const next = [...content];
		const [moved] = next.splice(fromIndex, 1);
		next.splice(toIndex, 0, moved);
		onChange(next);
	};

	return (
		<div className="space-y-5">
			{content.map((block, index) => (
				<StoryBlockRow
					key={block.id}
					block={block}
					onUpdate={(patch) => update(block.id, patch)}
					onInsert={(type) => insert(index, type)}
					onDragStart={() => setDraggedBlockId(block.id)}
					onDrop={() => {
						if (draggedBlockId) move(draggedBlockId, block.id);
						setDraggedBlockId(null);
					}}
					onRemove={() => remove(block.id)}
					onUpload={onUpload}
				/>
			))}
		</div>
	);
}

function RichTextEditor({
	value,
	onChange,
	placeholder,
	editorRef,
	onFormat,
	onAddLink,
	onSelectionChange,
}: {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	editorRef: React.RefObject<HTMLDivElement | null>;
	onFormat: (command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList") => void;
	onAddLink: () => void;
	onSelectionChange: () => void;
}) {
	const lastValue = useRef<string | null>(null);

	useEffect(() => {
		if (!editorRef.current || value === lastValue.current) return;
		editorRef.current.innerHTML = markdownToEditorHtml(value);
		lastValue.current = value;
	}, [editorRef, value]);

	return (
		<div
			ref={editorRef}
			contentEditable
			suppressContentEditableWarning
			role="textbox"
			aria-multiline="true"
			data-placeholder={placeholder}
			onInput={(event) => {
				const next = editorHtmlToMarkdown(event.currentTarget.innerHTML);
				lastValue.current = next;
				onChange(next);
			}}
			onPaste={(event) => {
				event.preventDefault();
				const text = event.clipboardData.getData("text/plain");
				document.execCommand("insertText", false, text);
				const next = editorHtmlToMarkdown(event.currentTarget.innerHTML);
				lastValue.current = next;
				onChange(next);
			}}
			onKeyDown={(event) => {
				if (!(event.metaKey || event.ctrlKey)) return;
				const key = event.key.toLowerCase();
				if (key === "b") { event.preventDefault(); onFormat("bold"); }
				if (key === "i") { event.preventDefault(); onFormat("italic"); }
				if (key === "k") { event.preventDefault(); onAddLink(); }
				if (event.shiftKey && key === "8") { event.preventDefault(); onFormat("insertUnorderedList"); }
				if (event.shiftKey && key === "7") { event.preventDefault(); onFormat("insertOrderedList"); }
			}}
			onKeyUp={onSelectionChange}
			onMouseUp={onSelectionChange}
			onFocus={onSelectionChange}
			className="min-h-32 w-full whitespace-pre-wrap break-words bg-transparent text-lg leading-relaxed text-gray-700 outline-none empty:before:pointer-events-none empty:before:text-gray-300 empty:before:content-[attr(data-placeholder)] [&_a]:font-medium [&_a]:text-[#006c5e] [&_a]:underline [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_em]:italic [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 dark:text-gray-200 dark:empty:before:text-gray-600 dark:[&_a]:text-[#4ade80] dark:[&_code]:bg-white/10"
		/>
	);
}

function StoryBlockRow({
	block,
	onUpdate,
	onInsert,
	onDragStart,
	onDrop,
	onRemove,
	onUpload,
}: {
	block: StoryEditorBlock;
	onUpdate: (patch: Partial<StoryEditorBlock>) => void;
	onInsert: (type: StoryEditorBlock["type"]) => void;
	onDragStart: () => void;
	onDrop: () => void;
	onRemove: () => void;
	onUpload: Props["onUpload"];
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const textRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
	const richTextRef = useRef<HTMLDivElement>(null);
	const savedRange = useRef<Range | null>(null);
	const [linkMode, setLinkMode] = useState(false);
	const [showBlockMenu, setShowBlockMenu] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkText, setLinkText] = useState("");
	const [linkDescription, setLinkDescription] = useState("");
	const mediaBlock = block.type === "image" || block.type === "video";
	const placeholders: Record<StoryEditorBlock["type"], string> = {
		paragraph: "Tell your story...",
		headline: "Heading",
		quote: "A memorable quote",
		image: "",
		video: "",
		link: "Paste a link",
		codeblock: "// Code",
		divider: "",
	};
	const handleFile = async (file?: File) => {
		if (!file || !mediaBlock) return;
		const result = await onUpload(
			file,
			block.type === "video" ? "video" : "image",
		);
		if (result) onUpdate({ value: result.publicUrl, media: result });
	};

	const saveRichText = () => {
		if (!richTextRef.current) return;
		onUpdate({ value: editorHtmlToMarkdown(richTextRef.current.innerHTML) });
	};
	const formatRichText = (command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList") => {
		restoreSelection();
		richTextRef.current?.focus();
		document.execCommand(command);
		saveRichText();
	};
	const saveSelection = () => {
		const selection = window.getSelection();
		if (selection?.rangeCount) savedRange.current = selection.getRangeAt(0).cloneRange();
	};
	const restoreSelection = () => {
		if (!savedRange.current) return;
		const selection = window.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(savedRange.current);
	};
	const formatInlineCode = () => {
		const selection = window.getSelection();
		const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
		if (!range || range.collapsed) return;
		const code = document.createElement("code");
		code.appendChild(range.extractContents());
		range.insertNode(code);
		selection?.removeAllRanges();
		const nextRange = document.createRange();
		nextRange.selectNodeContents(code);
		selection?.addRange(nextRange);
		saveRichText();
	};
	const openLinkEditor = () => {
		saveSelection();
		setLinkText(window.getSelection()?.toString() || "");
		setLinkMode(true);
	};
	const applyLink = () => {
		const url = linkUrl.trim();
		const text = linkText.trim();
		if (!/^https?:\/\//i.test(url) || !text) return;
		richTextRef.current?.focus();
		restoreSelection();
		const range = savedRange.current;
		if (!range) return;
		range.deleteContents();
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.textContent = text;
		if (linkDescription.trim()) {
			anchor.title = linkDescription.trim();
			anchor.setAttribute("aria-label", linkDescription.trim());
		}
		range.insertNode(anchor);
		const selection = window.getSelection();
		selection?.removeAllRanges();
		const nextRange = document.createRange();
		nextRange.setStartAfter(anchor);
		nextRange.collapse(true);
		selection?.addRange(nextRange);
		saveRichText();
		setLinkUrl("");
		setLinkText("");
		setLinkDescription("");
		setLinkMode(false);
	};
	const canFormat = block.type === "paragraph";
	const inputClass = `w-full resize-none bg-transparent outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600 ${block.type === "quote" ? "border-l-4 border-[#006c5e] pl-5 text-2xl italic dark:border-[#4ade80]" : block.type === "codeblock" ? "rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-300" : "text-lg leading-relaxed text-gray-700"}`;

	return (
		<section onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="group relative rounded-2xl border border-transparent px-4 py-4 transition-colors hover:border-[#006c5e]/15 hover:bg-[#f4faf8] dark:hover:border-[#4ade80]/15 dark:hover:bg-white/[0.03] sm:px-6">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-1">
					<button type="button" draggable onDragStart={onDragStart} aria-label="Drag to reorder block" title="Drag to reorder" className="cursor-grab rounded p-2 text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-[#006c5e] group-hover:opacity-100 focus:opacity-100 active:cursor-grabbing dark:hover:bg-white/10"><GripVertical size={16} /></button>
					{canFormat && (
						<div className="flex flex-wrap items-center gap-1">
							<button type="button" title="Bold (Ctrl/Cmd+B)" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichText("bold")} className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><Bold size={15} /></button>
							<button type="button" title="Italic (Ctrl/Cmd+I)" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichText("italic")} className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><Italic size={15} /></button>
							<button type="button" title="Inline code" onMouseDown={(event) => event.preventDefault()} onClick={formatInlineCode} className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><Code2 size={15} /></button>
							<button type="button" title="Add link (Ctrl/Cmd+K)" onMouseDown={(event) => event.preventDefault()} onClick={openLinkEditor} className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><Link2 size={15} /></button>
							<button type="button" title="Bullet list (Ctrl/Cmd+Shift+8)" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichText("insertUnorderedList")} className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><List size={15} /></button>
							<button type="button" title="Numbered list (Ctrl/Cmd+Shift+7)" onMouseDown={(event) => event.preventDefault()} onClick={() => formatRichText("insertOrderedList")} className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"><ListOrdered size={15} /></button>
						</div>
					)}
				</div>
				<button
					type="button"
					aria-label="Delete block"
					onClick={onRemove}
					className="cursor-pointer rounded-full p-2 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100 dark:hover:bg-red-500/10"
				>
					<Trash2 size={15} />
				</button>
			</div>
			{block.type === "divider" ? (
				<button
					type="button"
					aria-label="Remove divider"
					onClick={onRemove}
					className="my-8 block h-px w-full cursor-pointer bg-gray-200 dark:bg-white/15"
				/>
			) : mediaBlock ? (
				<div className="overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50 dark:border-white/15 dark:bg-white/5">
					{block.value ? (
						<div className="relative">
							{block.type === "image" ? (
								// biome-ignore lint/performance/noImgElement: The editor must immediately preview a user-selected remote upload.
								<img
									src={block.value}
									alt="Story media"
									className="h-auto w-full"
								/>
							) : (
								// biome-ignore lint/a11y/useMediaCaption: Captions are not available until an author provides a caption track.
								<video
									src={block.value}
									controls
									className="aspect-video w-full"
								/>
							)}
							<button
								type="button"
								onClick={() => inputRef.current?.click()}
								className="absolute right-3 top-3 cursor-pointer rounded-md bg-white/90 px-3 py-1.5 text-sm text-gray-700 dark:bg-black/70 dark:text-white"
							>
								Replace
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							className="flex min-h-52 w-full cursor-pointer flex-col items-center justify-center gap-2 text-gray-500 hover:text-[#006c5e] dark:hover:text-[#4ade80]"
						>
							{block.type === "image" ? (
								<ImageIcon size={30} />
							) : (
								<Video size={30} />
							)}
							<span>Upload {block.type}</span>
						</button>
					)}
					<input
						ref={inputRef}
						className="hidden"
						type="file"
						accept={block.type === "image" ? "image/*" : "video/*"}
						onChange={(event) => void handleFile(event.target.files?.[0])}
					/>
				</div>
			) : block.type === "headline" ? (
				<input
					ref={textRef as React.RefObject<HTMLInputElement>}
					value={block.value}
					maxLength={160}
					onChange={(event) => onUpdate({ value: event.target.value })}
					placeholder={placeholders.headline}
					className="w-full bg-transparent text-3xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-600"
				/>
			) : block.type === "link" ? (
				<input
					value={block.value}
					maxLength={2048}
					onChange={(event) => onUpdate({ value: event.target.value })}
					placeholder={placeholders.link}
					className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-white/5 dark:text-white"
				/>
			) : block.type === "paragraph" ? (
				<RichTextEditor value={block.value} onChange={(value) => onUpdate({ value })} placeholder={placeholders.paragraph} editorRef={richTextRef} onFormat={formatRichText} onAddLink={openLinkEditor} onSelectionChange={saveSelection} />
			) : (
				<textarea
					ref={textRef as React.RefObject<HTMLTextAreaElement>}
					value={block.value}
					maxLength={block.type === "codeblock" ? 8000 : 4000}
					onChange={(event) => onUpdate({ value: event.target.value })}
					placeholder={placeholders[block.type]}
					rows={block.type === "codeblock" ? 5 : 2}
					className={inputClass}
				/>
			)}
			{canFormat && linkMode && (
						<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
							<div role="dialog" aria-modal="true" aria-label="Add link" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-[#17312b]">
								<div className="mb-4"><h3 className="text-base font-semibold text-gray-900 dark:text-white">Add a link</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-300">Use a clear label so readers know where the link goes.</p></div>
								<label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-200">What to show<input autoFocus value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="Read the full guide" className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#006c5e] dark:border-white/15 dark:bg-white/5 dark:text-white" /></label>
								<label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-200">Link address<input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://example.com" className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#006c5e] dark:border-white/15 dark:bg-white/5 dark:text-white" /></label>
								<label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Link description <span className="font-normal text-gray-400">optional</span><input value={linkDescription} onChange={(event) => setLinkDescription(event.target.value)} placeholder="Opens the CookTale guide" className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#006c5e] dark:border-white/15 dark:bg-white/5 dark:text-white" /></label>
								<p className="mt-2 text-xs text-gray-500 dark:text-gray-300">This is the text-reader version of alt text. Image blocks will get their own alt text field separately.</p>
								<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setLinkMode(false)} className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">Cancel</button><button type="button" onClick={applyLink} className="cursor-pointer rounded-lg bg-[#006c5e] px-3 py-2 text-sm font-medium text-white dark:bg-[#4ade80] dark:text-[#092019]">Add link</button></div>
							</div>
						</div>
			)}
			<div className="relative mt-5 border-t border-gray-100 pt-4 dark:border-white/10">
				<button type="button" onClick={() => setShowBlockMenu((open) => !open)} aria-expanded={showBlockMenu} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#006c5e]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#006c5e] shadow-sm transition hover:border-[#006c5e] hover:bg-[#eaf6f2] dark:border-[#4ade80]/25 dark:bg-[#17312b] dark:text-[#86efac] dark:hover:bg-[#204239]"><Plus size={14} /> Add block below <ChevronDown size={14} /></button>
				{showBlockMenu && <div className="absolute bottom-11 left-0 z-20 grid w-52 overflow-hidden rounded-xl border border-[#006c5e]/15 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#17312b]">{blockOptions.map((option) => <button type="button" key={option.type} onClick={() => { onInsert(option.type); setShowBlockMenu(false); }} className="cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-[#eaf6f2] hover:text-[#006c5e] dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-[#86efac]">{option.label}</button>)}</div>}
			</div>
		</section>
	);
}
