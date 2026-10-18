"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
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
import { communityClient } from "@/lib/api/communityClient";
import { type SearchResult, searchClient } from "@/lib/api/searchClient";
import { useCloudinaryUpload } from "@/lib/hooks/useCloudinaryUpload";
import imageLoader from "@/lib/loader";

// --- TYPES ---
const CATEGORIES = [
	{ id: "help", label: "Cooking Help", icon: "🆘" },
	{ id: "showcase", label: "Showcase", icon: "📸" },
	{ id: "technique", label: "Technique", icon: "🔪" },
	{ id: "equipment", label: "Equipment", icon: "🍳" },
	{ id: "ingredients", label: "Ingredients", icon: "🥕" },
];

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
	const [category, setCategory] = useState(CATEGORIES[0].id);
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
		} catch (err) {
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
		} catch (error: any) {
			toast.error(error.message || "Failed to post discussion.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />

			{/* --- HEADER --- */}
			<div className="relative top-20 z-30 border-b border-gray-200 bg-[#fafafa]/90 px-6 py-4 backdrop-blur-md dark:border-white/5 dark:bg-[#0d1f1c]/90">
				<div className="container mx-auto flex max-w-4xl items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={() => router.back()}
							className="rounded-full p-2 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
						>
							<FaArrowLeft className="text-gray-500 dark:text-gray-400" />
						</button>
						<span className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-400">
							Start a Discussion
						</span>
					</div>
					<button
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="flex items-center gap-2 rounded-xl bg-[#006C5E] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#005a4e] disabled:opacity-50 dark:bg-[#4ADE80] dark:text-black dark:hover:bg-[#3ccb74]"
					>
						{isSubmitting ? (
							<BiLoaderAlt className="animate-spin" />
						) : (
							<FaPaperPlane />
						)}{" "}
						Post
					</button>
				</div>
			</div>

			<main className="container mx-auto max-w-4xl px-6 py-24">
				<div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
					{/* LEFT: EDITOR */}
					<div className="space-y-8 lg:col-span-8">
						{/* 1. Category Picker */}
						<div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
							{CATEGORIES.map((cat) => (
								<button
									key={cat.id}
									onClick={() => setCategory(cat.id)}
									className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold whitespace-nowrap transition-all ${
										category === cat.id
											? "border-[#006C5E] bg-[#006C5E] text-white dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-black"
											: "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
									}`}
								>
									<span>{cat.icon}</span> {cat.label}
								</button>
							))}
						</div>

						{/* 2. Inputs */}
						<div className="space-y-4">
							<input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="What's on your mind?"
								className="w-full bg-transparent p-0 text-3xl font-semibold outline-none placeholder:text-gray-300 focus:ring-0 lg:text-4xl dark:placeholder:text-gray-700"
								autoFocus
							/>
							<textarea
								value={body}
								onChange={(e) => {
									setBody(e.target.value);
									e.target.style.height = "auto";
									e.target.style.height = e.target.scrollHeight + "px";
								}}
								placeholder="Share your details, questions, or story..."
								className="min-h-[200px] w-full resize-none bg-transparent p-0 text-lg leading-relaxed text-gray-600 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-gray-300 dark:placeholder:text-gray-700"
							/>
						</div>

						{/* 3. Attachments Preview */}
						{attachments.length > 0 && (
							<div className="grid grid-cols-2 gap-4">
								{attachments.map((item, i) => (
									<div
										key={i}
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
											onClick={() => removeAttachment(i)}
											className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500"
										>
											<FaTimes size={12} />
										</button>
									</div>
								))}
							</div>
						)}

						{/* 4. Toolbar */}
						<div className="flex items-center gap-2 border-t border-gray-200 pt-4 dark:border-white/10">
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
								onClick={() => setShowLinker(true)}
								className="rounded-xl bg-gray-100 p-3 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10"
							>
								<FaLink className="text-lg" />
							</button>

							<span className="ml-auto hidden text-xs text-gray-400 sm:block">
								Markdown Supported
							</span>
						</div>
					</div>

					{/* RIGHT: GUIDELINES SIDEBAR */}
					<div className="hidden lg:col-span-4 lg:block">
						<div className="sticky top-32 rounded-4xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-500/20 dark:bg-blue-900/10">
							<h3 className="mb-4 font-bold text-blue-800 dark:text-blue-300">
								Posting Guidelines
							</h3>
							<ul className="space-y-3 text-sm text-blue-900/70 dark:text-blue-200/70">
								<li>• Be kind and respectful to other chefs.</li>
								<li>
									• If asking for help, provide details (recipe used, oven
									temp).
								</li>
								<li>• No self-promotion or spam links.</li>
								<li>• Keep it food related! 🍕</li>
							</ul>
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
const LinkerModal = ({ onClose, onSelect }: any) => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<any[]>([]);
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
			setResults(
				response.suggestions.filter(
					(item) => item.type === "recipe" || item.type === "story",
				),
			);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="w-full max-w-lg overflow-hidden rounded-4xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-white/5">
					<FaSearch className="text-gray-400" />
					<input
						value={query}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Search for a recipe or story..."
						className="flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
						autoFocus
					/>
					<button onClick={onClose}>
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
								<div
									key={item.id}
									onClick={() => onSelect(item, item.type)}
									className="flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
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
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
