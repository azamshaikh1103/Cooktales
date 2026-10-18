"use client";

import {
	Bold,
	Code2,
	ImageIcon,
	Italic,
	Link2,
	List,
	ListOrdered,
	Trash2,
	Video,
} from "lucide-react";
import { useRef, useState } from "react";
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

export function StoryBlockList({ content, onChange, onUpload }: Props) {
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

	return (
		<div className="space-y-8">
			{content.map((block, index) => (
				<StoryBlockRow
					key={block.id}
					block={block}
					onUpdate={(patch) => update(block.id, patch)}
					onInsert={(type) => insert(index, type)}
					onRemove={() => remove(block.id)}
					onUpload={onUpload}
				/>
			))}
		</div>
	);
}

function StoryBlockRow({
	block,
	onUpdate,
	onInsert,
	onRemove,
	onUpload,
}: {
	block: StoryEditorBlock;
	onUpdate: (patch: Partial<StoryEditorBlock>) => void;
	onInsert: (type: StoryEditorBlock["type"]) => void;
	onRemove: () => void;
	onUpload: Props["onUpload"];
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const textRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
	const [linkMode, setLinkMode] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
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

	const updateWithSelection = (
		before: string,
		after = before,
		fallback = "text",
	) => {
		const input = textRef.current;
		if (!input) return;
		const start = input.selectionStart || 0;
		const end = input.selectionEnd || start;
		const selected = block.value.slice(start, end) || fallback;
		const next = `${block.value.slice(0, start)}${before}${selected}${after}${block.value.slice(end)}`;
		onUpdate({ value: next });
		requestAnimationFrame(() => {
			input.focus();
			const cursor = start + before.length + selected.length + after.length;
			input.setSelectionRange(cursor, cursor);
		});
	};
	const applyLink = () => {
		const url = linkUrl.trim();
		if (!/^https?:\/\//i.test(url)) return;
		const input = textRef.current;
		if (!input) return;
		const start = input.selectionStart || 0;
		const end = input.selectionEnd || start;
		const selected = block.value.slice(start, end) || "Link text";
		const next = `${block.value.slice(0, start)}[${selected}](${url})${block.value.slice(end)}`;
		onUpdate({ value: next });
		setLinkUrl("");
		setLinkMode(false);
	};
	const canFormat = ["paragraph", "headline", "quote"].includes(block.type);
	const inputClass = `w-full resize-none bg-transparent outline-none placeholder:text-gray-300 dark:text-gray-200 dark:placeholder:text-gray-600 ${block.type === "quote" ? "border-l-4 border-[#006c5e] pl-5 text-2xl italic dark:border-[#4ade80]" : block.type === "codeblock" ? "rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-300" : "text-lg leading-relaxed text-gray-700"}`;

	return (
		<section className="group relative">
			<div className="absolute -left-12 top-1 hidden items-center gap-1 group-hover:flex">
				<select
					aria-label="Add content block"
					defaultValue=""
					onChange={(event) => {
						if (event.target.value)
							onInsert(event.target.value as StoryEditorBlock["type"]);
						event.currentTarget.value = "";
					}}
					className="h-8 max-w-8 cursor-pointer rounded-full border border-gray-200 bg-white px-1 text-xs text-gray-500 outline-none dark:border-white/15 dark:bg-[#17312b] dark:text-gray-300"
				>
					<option value="">+</option>
					{blockOptions.map((option) => (
						<option value={option.type} key={option.type}>
							{option.label}
						</option>
					))}
				</select>
				<button
					type="button"
					aria-label="Delete block"
					onClick={onRemove}
					className="cursor-pointer rounded-full p-1 text-gray-400 hover:text-red-500"
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
			{canFormat && (
				<div className="mt-3 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-3 dark:border-white/10">
					<button
						type="button"
						title="Bold"
						onClick={() => updateWithSelection("**")}
						className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
					>
						<Bold size={15} />
					</button>
					<button
						type="button"
						title="Italic"
						onClick={() => updateWithSelection("_")}
						className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
					>
						<Italic size={15} />
					</button>
					<button
						type="button"
						title="Inline code"
						onClick={() => updateWithSelection("`")}
						className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
					>
						<Code2 size={15} />
					</button>
					<button
						type="button"
						title="Add link"
						onClick={() => setLinkMode((value) => !value)}
						className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
					>
						<Link2 size={15} />
					</button>
					{block.type === "paragraph" && (
						<>
							<button
								type="button"
								title="Bullet list"
								onClick={() => updateWithSelection("- ", "", "List item")}
								className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
							>
								<List size={15} />
							</button>
							<button
								type="button"
								title="Numbered list"
								onClick={() => updateWithSelection("1. ", "", "List item")}
								className="cursor-pointer rounded p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
							>
								<ListOrdered size={15} />
							</button>
						</>
					)}
					{linkMode && (
						<div className="flex basis-full items-center gap-2 pt-2">
							<input
								value={linkUrl}
								onChange={(event) => setLinkUrl(event.target.value)}
								placeholder="https://example.com"
								className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#006c5e] dark:border-white/15 dark:bg-white/5 dark:text-white"
							/>
							<button
								type="button"
								onClick={applyLink}
								className="cursor-pointer rounded bg-[#006c5e] px-3 py-2 text-sm font-medium text-white dark:bg-[#4ade80] dark:text-[#092019]"
							>
								Add link
							</button>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
