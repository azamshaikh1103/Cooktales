"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import {
	FaArrowLeft,
	FaBookOpen,
	FaImage,
	FaLink,
	FaPaperPlane,
	FaSearch,
	FaTimes,
	FaUtensils,
} from "react-icons/fa";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { communityClient } from "@/lib/api/communityClient";
import { type SearchResult, searchClient } from "@/lib/api/searchClient";
import { DISCUSSION_CATEGORIES } from "@/lib/community/discussionCategories";
import { useCloudinaryUpload } from "@/lib/hooks/useCloudinaryUpload";
import imageLoader from "@/lib/loader";

// --- TYPES ---
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

	// State
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [category, setCategory] = useState<string>(DISCUSSION_CATEGORIES[0]);
	const [attachments, setAttachments] = useState<AttachedItem[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Search Modal State (For linking recipes)
	const [showLinker, setShowLinker] = useState(false);

	// Handlers
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

	const handleSubmit = async () => {
		if (!title.trim() || !body.trim())
			return toast.error("Please add a title and description.");

		setIsSubmitting(true);
		try {
			const { discussion } = await communityClient.createDiscussion({
				title,
				content: body,
				category,
				attachments,
			});

			toast.success("Discussion posted! 🎉");
			router.push(`/community/discussion/${discussion.slug}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to post discussion.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />

			{/* --- HEADER --- */}
			<div className="relative top-20 z-30 border-b border-gray-200 bg-[#fafafa]/90 px-6 py-4 backdrop-blur-md dark:border-white/10 dark:bg-[#0d1f1c]/90">
				<div className="container mx-auto flex max-w-3xl items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => router.back()}
							className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
						>
							<FaArrowLeft className="text-gray-500 dark:text-gray-400" />
						</button>
						<span className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400">
							Start a Discussion
						</span>
					</div>
					<PrimaryActionButton
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="px-5 py-2.5"
					>
						{isSubmitting ? (
							<BiLoaderAlt className="animate-spin" />
						) : (
							<FaPaperPlane />
						)}{" "}
						Post
					</PrimaryActionButton>
				</div>
			</div>

			<main className="container mx-auto max-w-3xl px-6 py-28">
				<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 dark:border-white/10 dark:bg-[#152a26]">
					<div className="mb-7">
						<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
							Start a discussion
						</h1>
						<p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
							Ask a clear cooking question, share something you made, or start a
							useful food conversation.
						</p>
					</div>
					<div className="space-y-6">
						<div>
							<p className="mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
								Choose a topic
							</p>
							<div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
								{DISCUSSION_CATEGORIES.map((cat) => (
									<button
										key={cat}
										type="button"
										onClick={() => setCategory(cat)}
										aria-pressed={category === cat}
										className={`flex cursor-pointer items-center rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
											category === cat
												? "border-[#006C5E] bg-[#006C5E] text-white dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-black"
												: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
										}`}
									>
										{cat}
									</button>
								))}
							</div>
						</div>

						<div className="space-y-4">
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="What's on your mind?"
								className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xl font-semibold text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/10"
							/>
							<textarea
								value={body}
								onChange={(e) => {
									setBody(e.target.value);
									e.target.style.height = "auto";
									e.target.style.height = `${e.target.scrollHeight}px`;
								}}
								placeholder="Share your details, questions, or story..."
								className="min-h-[220px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-base leading-7 text-gray-700 outline-none placeholder:text-gray-400 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/10 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/10"
							/>
						</div>

						{/* 3. Attachments Preview */}
						{attachments.length > 0 && (
							<div className="grid grid-cols-2 gap-4">
								{attachments.map((item, i) => (
									<div
										key={`${item.type}-${item.id}`}
										className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"
									>
										{item.type === "image" ? (
											<div className="relative aspect-video">
												<Image
													src={item.id}
													fill
													alt="Attachment"
													className="object-cover"
													loader={imageLoader}
												/>
											</div>
										) : (
											<div className="flex items-center gap-4 p-4">
												<div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/10">
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
													<p className="text-xs font-bold text-[#006C5E] uppercase dark:text-[#4ADE80]">
														{item.type}
													</p>
													<p className="truncate font-bold">{item.title}</p>
												</div>
											</div>
										)}
										<button
											type="button"
											onClick={() => removeAttachment(i)}
											className="absolute top-2 right-2 cursor-pointer rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500"
										>
											<FaTimes size={12} />
										</button>
									</div>
								))}
							</div>
						)}

						<div className="flex items-center gap-2 border-t border-gray-200 pt-5 dark:border-white/10">
							<input
								type="file"
								id="img-upload"
								className="hidden"
								accept="image/*"
								onChange={handleImageUpload}
							/>
							<label
								htmlFor="img-upload"
								className="cursor-pointer rounded-xl bg-gray-100 p-3 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
							>
								<FaImage className="text-lg" />
							</label>

							<button
								type="button"
								onClick={() => setShowLinker(true)}
								className="cursor-pointer rounded-xl bg-gray-100 p-3 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
							>
								<FaLink className="text-lg" />
							</button>

							<span className="ml-auto hidden text-xs text-gray-400 sm:block">
								Markdown Supported
							</span>
						</div>
					</div>
				</div>
			</main>

			{/* --- LINKER MODAL (Search Recipe/Blog) --- */}
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
