"use client";

import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FaBookOpen, FaSearch, FaTimes, FaUtensils } from "react-icons/fa";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { communityClient } from "@/lib/api/communityClient";
import { type SearchResult, searchClient } from "@/lib/api/searchClient";
import { DISCUSSION_CATEGORIES } from "@/lib/community/discussionCategories";
import { useCloudinaryUpload } from "@/lib/hooks/useCloudinaryUpload";
import imageLoader from "@/lib/loader";
import { DiscussionEditor } from "./DiscussionEditor";
import { TopicSelect } from "./TopicSelect";

// Limits mirror the API (CreateDiscussionDto).
const TITLE_MIN = 5;
const TITLE_MAX = 140;
const BODY_MIN = 20;
const BODY_MAX = 12000;

interface AttachedItem {
	type: "image" | "recipe" | "story";
	id: string; // URL for image, ID for recipe/blog
	publicId?: string;
	title?: string; // For recipes/blogs
	image?: string; // Preview image
}

export default function CreateDiscussion() {
	const router = useRouter();
	const { uploadFile } = useCloudinaryUpload();

	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [category, setCategory] = useState<string>(DISCUSSION_CATEGORIES[0]);
	const [attachments, setAttachments] = useState<AttachedItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [touched, setTouched] = useState({ title: false, body: false });
	const [showLinker, setShowLinker] = useState(false);

	const titleLength = title.trim().length;
	const bodyLength = body.trim().length;
	const titleError =
		touched.title && titleLength < TITLE_MIN
			? `Titles need at least ${TITLE_MIN} characters.`
			: null;
	const bodyError =
		bodyLength > BODY_MAX
			? "That is over the 12,000 character limit."
			: touched.body && bodyLength < BODY_MIN
				? `Add a little more detail (at least ${BODY_MIN} characters).`
				: null;
	const canPost =
		titleLength >= TITLE_MIN &&
		titleLength <= TITLE_MAX &&
		bodyLength >= BODY_MIN &&
		bodyLength <= BODY_MAX &&
		!isSubmitting;

	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const toastId = toast.loading("Uploading image...");
		try {
			const res = await uploadFile({ file, context: "TEMP" });
			if (res) {
				setAttachments((prev) => [
					...prev,
					{
						type: "image",
						id: res.publicUrl,
						publicId: res.publicId,
						image: res.publicUrl,
					},
				]);
				toast.success("Image attached", { id: toastId });
			}
		} catch {
			toast.error("Upload failed", { id: toastId });
		} finally {
			e.target.value = "";
		}
	};

	const handleAttachContent = (
		item: SearchResult,
		type: "recipe" | "story",
	) => {
		setAttachments((prev) => [
			...prev,
			{
				type,
				id: item.id,
				title: item.title,
				image: item.image || undefined,
			},
		]);
		setShowLinker(false);
	};

	const removeAttachment = (index: number) => {
		setAttachments((prev) => prev.filter((_, i) => i !== index));
	};

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setTouched({ title: true, body: true });
		if (!canPost) return;

		setIsSubmitting(true);
		try {
			const { discussion } = await communityClient.createDiscussion({
				title: title.trim(),
				content: body,
				category,
				attachments: attachments.map(({ type, id, publicId }) => ({
					type,
					id,
					...(publicId ? { publicId } : {}),
				})),
			});

			toast.success("Discussion posted");
			router.push(`/community/discussion/${discussion.slug}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to post discussion.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const fieldLabel =
		"mb-2 block text-sm font-semibold text-gray-900 dark:text-white";

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />

			<main className="mx-auto w-full max-w-3xl px-4 pt-28 pb-24 sm:px-6">
				<h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
					Create a discussion
				</h1>

				<form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
					<TopicSelect
						value={category}
						options={DISCUSSION_CATEGORIES}
						onChange={setCategory}
					/>

					<div>
						<label htmlFor="discussion-title" className={fieldLabel}>
							Title<span className="text-red-500 dark:text-red-400">*</span>
						</label>
						<div className="relative">
							<input
								id="discussion-title"
								value={title}
								maxLength={TITLE_MAX}
								onChange={(e) => setTitle(e.target.value)}
								onBlur={() => setTouched((t) => ({ ...t, title: true }))}
								onKeyDown={(event) => {
									if (event.key !== "Enter") return;
									event.preventDefault();
									document
										.querySelector<HTMLElement>(
											'[aria-label="Discussion details"]',
										)
										?.focus();
								}}
								aria-invalid={Boolean(titleError)}
								aria-describedby={
									titleError ? "discussion-title-error" : undefined
								}
								placeholder="Add a clear title"
								className="w-full rounded-2xl border border-gray-300 bg-white py-3.5 pr-20 pl-4 text-lg font-semibold text-gray-900 outline-none transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/15 aria-[invalid=true]:border-red-500 dark:border-white/15 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/15"
							/>
							<span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-gray-500 tabular-nums dark:text-gray-400">
								{title.length}/{TITLE_MAX}
							</span>
						</div>
						{titleError && (
							<p
								id="discussion-title-error"
								className="mt-2 text-sm text-red-600 dark:text-red-400"
							>
								{titleError}
							</p>
						)}
					</div>

					<div>
						<span className={fieldLabel}>Details</span>
						<DiscussionEditor
							value={body}
							onChange={setBody}
							// Leaving the editor marks it as visited so errors do not flash while typing.
							onBlur={() => setTouched((t) => ({ ...t, body: true }))}
							maxLength={BODY_MAX}
							onAttachImage={() =>
								document.getElementById("img-upload")?.click()
							}
							onAttachContent={() => setShowLinker(true)}
						/>
						{bodyError && (
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">
								{bodyError}
							</p>
						)}
					</div>

					{attachments.length > 0 && (
						<ul className="flex flex-wrap gap-3" aria-label="Attachments">
							{attachments.map((item, i) => (
								<li
									key={`${item.type}-${item.id}`}
									className="flex max-w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2 pr-3 dark:border-white/10 dark:bg-white/[0.03]"
								>
									<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
										{item.image && (
											<Image
												src={item.image}
												fill
												alt=""
												className="object-cover"
												loader={imageLoader}
											/>
										)}
									</div>
									<div className="min-w-0">
										<p className="text-xs font-semibold text-[#006C5E] capitalize dark:text-[#4ADE80]">
											{item.type}
										</p>
										<p className="max-w-48 truncate text-sm font-semibold">
											{item.title || "Photo"}
										</p>
									</div>
									<button
										type="button"
										onClick={() => removeAttachment(i)}
										aria-label={`Remove ${item.type}`}
										className="ml-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
									>
										<FaTimes size={12} />
									</button>
								</li>
							))}
						</ul>
					)}

					<input
						type="file"
						id="img-upload"
						className="hidden"
						accept="image/*"
						onChange={handleImageUpload}
					/>

					<div className="flex items-center justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={() => router.back()}
							className="cursor-pointer rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10 dark:focus-visible:outline-[#4ADE80]"
						>
							Cancel
						</button>
						<PrimaryActionButton type="submit" disabled={!canPost}>
							{isSubmitting && <Loader2 size={16} className="animate-spin" />}
							Post
						</PrimaryActionButton>
					</div>
				</form>
			</main>

			{showLinker && (
				<LinkerModal
					onClose={() => setShowLinker(false)}
					onSelect={handleAttachContent}
				/>
			)}
		</div>
	);
}

// --- LINKER MODAL COMPONENT ---
interface LinkerModalProps {
	onClose: () => void;
	onSelect: (item: AttachedSearchResult, type: "recipe" | "story") => void;
}

type AttachedSearchResult = SearchResult & { type: "recipe" | "story" };

const isAttachableResult = (item: SearchResult): item is AttachedSearchResult =>
	item.type === "recipe" || item.type === "story";

const LinkerModal = ({ onClose, onSelect }: LinkerModalProps) => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<AttachedSearchResult[]>([]);
	const [loading, setLoading] = useState(false);

	const handleSearch = async (val: string) => {
		setQuery(val);
		if (val.length < 2) return;

		setLoading(true);
		try {
			const response = await searchClient.suggestions({
				q: val,
				type: "all",
				limit: 10,
			});
			setResults(response.suggestions.filter(isAttachableResult));
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Attach a recipe or story"
				className="w-full max-w-lg overflow-hidden rounded-4xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
			>
				<div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-white/5">
					<FaSearch className="text-gray-400" />
					<input
						value={query}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Search for a recipe or story..."
						className="flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
					/>
					<button type="button" onClick={onClose}>
						<FaTimes className="text-gray-400 hover:text-gray-900 dark:hover:text-white" />
					</button>
				</div>

				<div className="max-h-[300px] overflow-y-auto p-2">
					{loading ? (
						<div className="p-4 text-center text-sm text-gray-400">
							Searching...
						</div>
					) : results.length === 0 && query.length > 2 ? (
						<div className="p-4 text-center text-sm text-gray-400">
							No results found.
						</div>
					) : (
						<div className="space-y-1">
							{results.map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => onSelect(item, item.type)}
									className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
								>
									<div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-200 dark:bg-white/10">
										{item.image && (
											<Image
												src={item.image}
												fill
												alt=""
												className="object-cover"
												loader={imageLoader}
											/>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-bold text-gray-900 dark:text-white">
											{item.title}
										</p>
										<p className="flex items-center gap-1 text-xs text-gray-500 capitalize dark:text-gray-400">
											{item.type === "recipe" ? <FaUtensils /> : <FaBookOpen />}{" "}
											{item.type}
										</p>
									</div>
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
