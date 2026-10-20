"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { BiChevronDown, BiPlus, BiTrash } from "react-icons/bi";
import { FaClock, FaFire, FaUserFriends } from "react-icons/fa";
import imageLoader from "@/lib/loader";
import type { NewRecipe } from "@/lib/Slices/NewRecipeData";

// ... (Interfaces remain same) ...
interface HeaderImageUploadProps {
	currentImage?: string | null;
	onImageSelect: (file: File, base64: string) => void;
	readAsDataUrl?: boolean;
}
interface BasicInfoEditorProps {
	name: string;
	about: string | null;
	onChange: <K extends keyof NewRecipe>(field: K, value: NewRecipe[K]) => void;
	onGuide?: (key: string) => void;
}
interface GalleryUploadProps {
	images: string[];
	onAdd: (files: FileList) => void;
}
interface MetaDetailsEditorProps {
	totalTimeReq: number | null;
	yield: number | null;
	calories: number | null;
	difficulty: NewRecipe["difficulty"];
	cuisine: string;
	diet: NewRecipe["diet"];
	onChange: <K extends keyof NewRecipe>(field: K, value: NewRecipe[K]) => void;
	onGuide?: (key: string) => void;
}
interface IngredientsEditorProps {
	title: string;
	placeholder: string;
	items: NewRecipe["ingredients"] | NewRecipe["equipments"];
	onChange: (items: NewRecipe["ingredients"] | NewRecipe["equipments"]) => void;
}
interface StepsEditorProps {
	steps: NewRecipe["steps"];
	onChange: (steps: NewRecipe["steps"]) => void;
}
interface TagEditorProps {
	tags: string[];
	onChange: (tags: string[]) => void;
	onGuide?: (key: string) => void;
}
interface FAQEditorProps {
	faqs: NewRecipe["faqs"];
	onChange: (faqs: NewRecipe["faqs"]) => void;
}

// ============ COMPONENTS ============

export const HeaderImageUpload = ({
	currentImage,
	onImageSelect,
	readAsDataUrl = true,
}: HeaderImageUploadProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			if (!readAsDataUrl) {
				onImageSelect(file, URL.createObjectURL(file));
				return;
			}
			const reader = new FileReader();
			reader.onloadend = () => onImageSelect(file, reader.result as string);
			reader.readAsDataURL(file);
		}
	};

	return (
		<div
			onClick={() => inputRef.current?.click()}
			className="group relative flex h-[400px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-gray-100 transition-all hover:border-[#006C5E] hover:bg-[#006C5E]/5 dark:border-white/10 dark:bg-white/5 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80]/5"
		>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFile}
			/>

			{currentImage ? (
				<>
					<Image
						src={currentImage}
						fill
						alt="Cover"
						className="object-cover transition-opacity group-hover:opacity-90"
						loader={imageLoader}
					/>
					<div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
						<span className="rounded-full bg-white/90 px-6 py-3 font-bold text-gray-900 shadow-xl backdrop-blur">
							Change Cover
						</span>
					</div>
				</>
			) : (
				<div className="text-center text-gray-500 transition-colors group-hover:text-[#006C5E] dark:text-gray-500 dark:group-hover:text-[#4ADE80]">
					<BiImageAdd className="mx-auto mb-3 text-6xl opacity-50" />
					<h1 className="text-xl font-bold">Drop your cover image</h1>
					<p className="mt-1 text-sm opacity-60">or click to browse</p>
				</div>
			)}
		</div>
	);
};

export const BasicInfoEditor = ({
	name,
	about,
	onChange,
	onGuide,
}: BasicInfoEditorProps) => (
	<div className="space-y-4">
		<div onMouseEnter={() => onGuide?.("title")}>
			<input
				value={name}
				maxLength={90}
				onFocus={() => onGuide?.("title")}
				onChange={(e) => onChange("name", e.target.value)}
				placeholder="Recipe Title"
				className="w-full bg-transparent p-0 text-3xl font-semibold text-gray-900 outline-none placeholder:text-gray-300 focus:ring-0 lg:text-4xl dark:text-white dark:placeholder:text-gray-700"
			/>
			<p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
				{name.length}/90
			</p>
		</div>
		<div onMouseEnter={() => onGuide?.("about")}>
			<textarea
				value={about || ""}
				maxLength={1200}
				onFocus={() => onGuide?.("about")}
				onChange={(e) => {
					onChange("about", e.target.value);
					e.target.style.height = "auto";
					e.target.style.height = e.target.scrollHeight + "px";
				}}
				placeholder="Tell the story behind this dish..."
				className="min-h-[80px] w-full resize-none bg-transparent p-0 text-lg leading-relaxed text-gray-600 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-gray-300 dark:placeholder:text-gray-700"
			/>
			<p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
				{about?.length || 0}/1200
			</p>
		</div>
	</div>
);

export const GalleryUpload = ({ images, onAdd }: GalleryUploadProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			{images.map((img, i) => (
				<div
					key={i}
					className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10"
				>
					<Image
						src={img}
						fill
						alt=""
						className="object-cover"
						loader={imageLoader}
					/>
				</div>
			))}
			<button
				type="button"
				onClick={() => inputRef.current?.click()}
				className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 transition-all hover:border-[#006C5E] hover:bg-[#006C5E]/5 hover:text-[#006C5E] dark:border-white/10 dark:text-gray-500 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80]/5 dark:hover:text-[#4ADE80]"
			>
				<BiPlus className="mb-1 text-3xl" />
				<span className="text-xs font-bold tracking-wider uppercase">
					Add Photo
				</span>
			</button>
			<input
				ref={inputRef}
				type="file"
				multiple
				accept="image/*"
				className="hidden"
				onChange={(e) => e.target.files && onAdd(e.target.files)}
			/>
		</div>
	);
};

export const MetaDetailsEditor = ({
	totalTimeReq,
	yield: yield_,
	calories,
	difficulty,
	diet,
	cuisine,
	onChange,
	onGuide,
}: MetaDetailsEditorProps) => (
	<div className="grid grid-cols-2 gap-4 rounded-4xl border border-gray-100 bg-white p-6 shadow-sm lg:grid-cols-3 dark:border-white/5 dark:bg-[#152a26]">
		<MetaItem
			label="Time (min)"
			icon={<FaClock />}
			value={totalTimeReq}
			guideKey="time"
			onGuide={onGuide}
			onChange={(val: string) =>
				onChange("totalTimeReq", val ? parseInt(val) : null)
			}
			type="number"
		/>
		<MetaItem
			label="Yield"
			icon={<FaUserFriends />}
			value={yield_}
			guideKey="yield"
			onGuide={onGuide}
			onChange={(val: string) => onChange("yield", val ? parseInt(val) : null)}
			type="number"
		/>
		<MetaItem
			label="Calories"
			icon={<FaFire />}
			value={calories}
			guideKey="calories"
			onGuide={onGuide}
			onChange={(val: string) =>
				onChange("calories", val ? parseInt(val) : null)
			}
			type="number"
		/>

		<CustomSelect
			label="Difficulty"
			value={difficulty}
			guideKey="difficulty"
			onGuide={onGuide}
			onChange={(val: string) =>
				onChange("difficulty", val as NewRecipe["difficulty"])
			}
			options={[
				{ value: "", label: "Select" },
				{ value: "Easy", label: "Easy" },
				{ value: "Medium", label: "Medium" },
				{ value: "Hard", label: "Hard" },
				{ value: "Expert", label: "Expert" },
			]}
		/>
		<CustomSelect
			label="Cuisine"
			value={cuisine}
			guideKey="cuisine"
			onGuide={onGuide}
			onChange={(val: string) => onChange("cuisine", val)}
			options={[
				{ value: "", label: "Select" },
				{ value: "Indian", label: "Indian" },
				{ value: "Chinese", label: "Chinese" },
				{ value: "Italian", label: "Italian" },
				{ value: "Mexican", label: "Mexican" },
				{ value: "Thai", label: "Thai" },
				{ value: "Japanese", label: "Japanese" },
				{ value: "French", label: "French" },
				{ value: "Spanish", label: "Spanish" },
				{ value: "Korean", label: "Korean" },
				{ value: "Vietnamese", label: "Vietnamese" },
				{ value: "British", label: "British" },
				{ value: "American", label: "American" },
				{ value: "Other", label: "Other" },
			]}
		/>
		<CustomSelect
			label="Diet"
			value={diet}
			guideKey="diet"
			onGuide={onGuide}
			onChange={(val: string) => onChange("diet", val as NewRecipe["diet"])}
			options={[
				{ value: "", label: "Select" },
				{ value: "Omnivore", label: "Omnivore" },
				{ value: "Vegetarian", label: "Vegetarian" },
				{ value: "Vegan", label: "Vegan" },
				{ value: "Pescatarian", label: "Pescatarian" },
				{ value: "Carnivore", label: "Carnivore" },
			]}
		/>
	</div>
);

// Helper for Meta
const MetaItem = ({
	label,
	icon,
	value,
	onChange,
	type,
	guideKey,
	onGuide,
}: any) => (
	<div
		onMouseEnter={() => onGuide?.(guideKey)}
		className="rounded-xl bg-gray-50 p-3 dark:bg-white/5"
	>
		<label className="mb-1 block text-xs font-bold text-gray-500 uppercase dark:text-gray-500">
			{label}
		</label>
		<div className="flex items-center gap-2">
			<span className="text-gray-300 dark:text-gray-600">{icon}</span>
			<input
				type={type}
				value={value || ""}
				onFocus={() => onGuide?.(guideKey)}
				onChange={(e) => onChange(e.target.value)}
				className="w-full bg-transparent font-bold text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-700"
			/>
		</div>
	</div>
);

const CustomSelect = ({
	label,
	value,
	onChange,
	options,
	guideKey,
	onGuide,
}: {
	label: string;
	value: string | null;
	onChange: (value: string) => void;
	options: { value: string; label: string }[];
	guideKey: string;
	onGuide?: (key: string) => void;
}) => {
	const [open, setOpen] = useState(false);
	const selected =
		options.find((option) => option.value === (value || "")) || options[0];

	return (
		<div
			onMouseEnter={() => onGuide?.(guideKey)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
			}}
			className="relative rounded-xl bg-gray-50 p-3 dark:bg-white/5"
		>
			<label className="mb-1 block text-xs font-bold text-gray-500 uppercase dark:text-gray-500">
				{label}
			</label>
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				onFocus={() => onGuide?.(guideKey)}
				className="flex w-full cursor-pointer items-center justify-between gap-2 text-left font-bold text-gray-900 outline-none dark:text-white"
			>
				<span>{selected?.label || "Select"}</span>
				<BiChevronDown
					className={`text-xl text-gray-400 transition-transform ${
						open ? "rotate-180" : ""
					}`}
				/>
			</button>
			{open && (
				<div className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 max-h-64 overflow-auto rounded-2xl border border-gray-100 bg-white p-1 dark:border-white/10 dark:bg-[#0d1f1c]">
					{options.map((option) => (
						<button
							key={option.value || "empty"}
							type="button"
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => {
								onChange(option.value);
								setOpen(false);
							}}
							className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${
								(value || "") === option.value
									? "bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]"
									: "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

// ... existing imports
import { BiLink, BiImageAdd, BiTime } from "react-icons/bi";
import { FaTimes } from "react-icons/fa";
import { useGCSUpload } from "@/lib/hooks/useGCSUpload";
import { steps } from "framer-motion";
import { toast } from "sonner";

// ============ INGREDIENTS / EQUIPMENT EDITOR (With Links) ============
export const IngredientsEditor = ({
	title,
	items,
	onChange,
	placeholder,
}: IngredientsEditorProps) => {
	const update = (idx: number, field: string, val: any) => {
		const newArr = items.map((item, i) =>
			i === idx ? { ...item, [field]: val } : item,
		);
		onChange(newArr);
	};

	const add = () =>
		onChange([
			...items,
			{ name: "", detail: null, image: null, link: null, regionalName: null },
		]);

	const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

	return (
		<div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#152a26]">
			<div className="mb-6 flex items-center justify-between">
				<h3 className="text-xl font-bold text-gray-900 dark:text-white">
					{title}
				</h3>
				<button
					aria-label="Add Item"
					type="button"
					onClick={add}
					className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-[#006C5E] hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-[#4ADE80] dark:hover:text-black"
				>
					<BiPlus />
				</button>
			</div>

			<ul className="space-y-4">
				{items.map((item, i) => (
					<li key={i} className="group flex flex-col gap-2">
						{/* Row 1: Input & Actions */}
						<div className="flex items-center gap-3">
							<div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#006C5E]/40 dark:bg-[#4ADE80]/40" />
							<input
								value={item.name}
								onChange={(e) => update(i, "name", e.target.value)}
								placeholder={placeholder}
								className="flex-1 border-b border-gray-100 bg-transparent py-2 font-medium text-gray-700 transition-colors outline-none focus:border-[#006C5E] dark:border-white/10 dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:border-[#4ADE80]"
							/>

							{/* Link Button */}
							<button
								type="button"
								onClick={() => update(i, "link", item.link ? null : "")}
								className={`cursor-pointer text-lg transition-colors ${
									item.link
										? "text-[#006C5E] dark:text-[#4ADE80]"
										: "text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
								}`}
								title="Add Affiliate Link"
							>
								<BiLink />
							</button>

							<button
								type="button"
								onClick={() => remove(i)}
								className="cursor-pointer text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 dark:text-gray-600"
							>
								<BiTrash />
							</button>
						</div>

						{/* Row 2: Affiliate Link Input (Conditional) */}
						{item.link !== null && (
							<div className="animate-fade-in-up ml-5 flex items-center gap-2">
								<BiLink className="text-xs text-gray-400" />
								<input
									value={item.link}
									onChange={(e) => update(i, "link", e.target.value)}
									placeholder="Paste affiliate or product link here..."
									className="w-full rounded-lg bg-gray-50 px-3 py-1.5 text-xs text-[#006C5E] outline-none dark:bg-black/20 dark:text-[#4ADE80] dark:placeholder:text-gray-600"
								/>
							</div>
						)}
					</li>
				))}

				{items.length === 0 && (
					<li
						onClick={add}
						className="cursor-pointer text-sm text-gray-500 italic hover:text-[#006C5E] dark:text-gray-600 dark:hover:text-[#4ADE80]"
					>
						Click + to add {title.toLowerCase()}
					</li>
				)}
			</ul>
		</div>
	);
};

// ============ STEPS EDITOR (With Image & Time) ============
export const StepsEditor = ({ steps, onChange }: StepsEditorProps) => {
	const { uploadFile } = useGCSUpload();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

	const update = (
		idx: number,
		field: keyof NewRecipe["steps"][0],
		val: any,
	) => {
		const newArr = steps.map((step, i) =>
			i === idx ? { ...step, [field]: val } : step,
		);
		onChange(newArr);
	};

	const add = () =>
		onChange([
			...steps,
			{
				name: "",
				detail: null,
				timeReq: null,
				videoUrl: null,
				image: null,
				link: null,
			},
		]);

	const remove = (idx: number) => onChange(steps.filter((_, i) => i !== idx));

	// Handle Image Selection & Upload
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (activeStepIndex === null || !e.target.files?.[0]) return;

		const file = e.target.files[0];
		const idx = activeStepIndex;

		// 1. Show Base64 Preview immediately (Optimistic UI)
		const reader = new FileReader();
		reader.onloadend = () => {
			update(idx, "image", reader.result as string);
		};
		reader.readAsDataURL(file);

		// 2. Start Cloud Upload
		setUploadingIndex(idx);
		const loadingId = toast.loading(`Uploading image for Step ${idx + 1}...`);

		try {
			const res = await uploadFile(file);

			if (res?.publicUrl) {
				// 3. Replace Base64 with Real Cloud URL
				update(idx, "image", res.publicUrl);
				toast.success("Step image uploaded!", { id: loadingId });
			} else {
				throw new Error("Upload returned no URL");
			}
		} catch (error) {
			console.error(error);
			toast.error("Failed to upload step image", { id: loadingId });

			update(idx, "image", null);
		} finally {
			setUploadingIndex(null);
			e.target.value = ""; // Reset input
		}
	};

	const triggerUpload = (index: number) => {
		setActiveStepIndex(index);
		fileInputRef.current?.click();
	};

	return (
		<div className="space-y-8">
			<div className="flex items-end justify-between">
				<h3 className="text-2xl font-bold text-gray-900 dark:text-white">
					Cooking Steps
				</h3>
				<button
					type="button"
					onClick={add}
					className="flex cursor-pointer items-center gap-1 text-sm font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
				>
					<BiPlus /> Add Step
				</button>
			</div>

			{/* Hidden Global Input */}
			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept="image/*"
				onChange={handleImageUpload}
			/>

			{steps.map((step, i) => (
				<div
					key={i}
					className="group relative rounded-4xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#006C5E]/30 lg:p-8 dark:border-white/5 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/30"
				>
					<div className="absolute top-8 left-0 h-12 w-1.5 rounded-r-full bg-[#006C5E] dark:bg-[#4ADE80]" />

					{/* Header */}
					<div className="mb-4 flex justify-between">
						<span className="text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
							Step {i + 1}
						</span>
						<button
							type="button"
							onClick={() => remove(i)}
							className="cursor-pointer text-gray-300 hover:text-red-500 dark:text-gray-600"
						>
							<BiTrash />
						</button>
					</div>

					{/* Inputs */}
					<input
						value={step.name}
						onChange={(e) => update(i, "name", e.target.value)}
						placeholder="e.g. Sauté the Garlic"
						className="mb-3 w-full bg-transparent p-0 text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-white dark:placeholder:text-gray-600"
					/>
					<textarea
						value={step.detail || ""}
						onChange={(e) => {
							update(i, "detail", e.target.value);
							e.target.style.height = "auto";
							e.target.style.height = e.target.scrollHeight + "px";
						}}
						placeholder="Explain exactly what to do..."
						className="min-h-[60px] w-full resize-none bg-transparent p-0 leading-relaxed text-gray-600 outline-none placeholder:text-gray-300 focus:ring-0 dark:text-gray-300 dark:placeholder:text-gray-600"
					/>

					{/* Step Image Preview */}
					{step.image && (
						<div className="group/image relative mt-4 h-[400px] w-auto overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10">
							<Image
								src={step.image}
								fill
								alt="Step"
								className={`object-cover transition-opacity ${uploadingIndex === i ? "opacity-50" : "opacity-100"}`}
								loader={imageLoader}
							/>

							{/* Loading Indicator */}
							{uploadingIndex === i && (
								<div className="absolute inset-0 flex items-center justify-center">
									<div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
								</div>
							)}

							<button
								onClick={() => update(i, "image", null)}
								className="absolute top-2 right-2 cursor-pointer rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-colors group-hover/image:opacity-100 hover:bg-red-500"
							>
								<FaTimes size={12} />
							</button>
						</div>
					)}

					{/* Toolbar */}
					<div className="mt-4 flex items-center gap-3 border-t border-gray-50 pt-4 dark:border-white/5">
						{/* Image Trigger */}
						<button
							type="button"
							onClick={() => triggerUpload(i)}
							disabled={uploadingIndex === i}
							className="flex cursor-pointer items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#006C5E] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
						>
							<BiImageAdd className="text-lg" />
							{uploadingIndex === i
								? "Uploading..."
								: step.image
									? "Change Image"
									: "Add Photo"}
						</button>

						{/* Time Input */}
						<div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-white/5">
							<BiTime className="text-gray-400 dark:text-gray-500" />
							<input
								type="number"
								placeholder="0"
								value={step.timeReq || ""}
								onChange={(e) => update(i, "timeReq", parseInt(e.target.value))}
								className="w-8 bg-transparent text-xs font-bold text-gray-700 outline-none dark:text-gray-300"
							/>
							<span className="text-xs text-gray-400">min</span>
						</div>
					</div>
				</div>
			))}

			{steps.length === 0 && (
				<div
					onClick={add}
					className="group cursor-pointer rounded-4xl border-2 border-dashed border-gray-200 p-12 text-center transition-all hover:border-[#006C5E] hover:bg-[#006C5E]/5 dark:border-white/10 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80]/5"
				>
					<span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm transition-transform group-hover:scale-110 dark:bg-white/10">
						<BiPlus />
					</span>
					<p className="font-bold text-gray-500 group-hover:text-[#006C5E] dark:text-gray-500 dark:group-hover:text-[#4ADE80]">
						Start adding steps
					</p>
				</div>
			)}
		</div>
	);
};

export const TagEditor = ({ tags, onChange, onGuide }: TagEditorProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && e.currentTarget.value.trim()) {
			e.preventDefault();
			const newTag = e.currentTarget.value.trim();
			if (!tags.includes(newTag)) onChange([...tags, newTag]);
			e.currentTarget.value = "";
		}
	};
	const remove = (idx: number) => onChange(tags.filter((_, i) => i !== idx));

	return (
		<div onMouseEnter={() => onGuide?.("tags")}>
			<h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
				Tags
			</h3>
			<div className="mb-3 flex flex-wrap gap-2">
				{tags.map((tag, i) => (
					<span
						key={i}
						className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1 text-sm font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300"
					>
						#{tag}{" "}
						<button
							aria-label="Remove Tag"
							type="button"
							onClick={() => remove(i)}
							className="cursor-pointer hover:text-red-500"
						>
							<FaTimes size={10} />
						</button>
					</span>
				))}
			</div>
			<input
				ref={inputRef}
				onFocus={() => onGuide?.("tags")}
				onKeyDown={handleKeyDown}
				placeholder="Type tag & hit Enter..."
				className="w-full rounded-xl bg-gray-50 px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#006C5E]/20 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:ring-[#4ADE80]/20"
			/>
		</div>
	);
};

export const FAQEditor = ({ faqs, onChange }: FAQEditorProps) => {
	const update = (idx: number, field: "question" | "answer", val: string) => {
		const newArr = faqs.map((faq, i) =>
			i === idx ? { ...faq, [field]: val } : faq,
		);
		onChange(newArr);
	};
	const add = () => onChange([...faqs, { question: "", answer: "" }]);
	const remove = (idx: number) => onChange(faqs.filter((_, i) => i !== idx));

	return (
		<div className="rounded-4xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#152a26]">
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h3 className="text-xl font-bold text-gray-900 dark:text-white">
						FAQs (Optional)
					</h3>
					<p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
						Answer common questions about this recipe
					</p>
				</div>
				<button
					aria-label="Add FAQ"
					type="button"
					onClick={add}
					className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-[#006C5E] hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-[#4ADE80] dark:hover:text-black"
				>
					<BiPlus />
				</button>
			</div>
			<div className="space-y-6">
				{faqs.map((faq, i) => (
					<div
						key={i}
						className="group relative rounded-xl border border-gray-100 bg-gray-50 p-6 dark:border-white/5 dark:bg-white/5"
					>
						<button
							aria-label="Remove FAQ"
							type="button"
							onClick={() => remove(i)}
							className="absolute top-4 right-4 cursor-pointer text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500 dark:text-gray-600"
						>
							<BiTrash />
						</button>
						<div className="mb-4">
							<label className="mb-2 block text-xs font-bold text-gray-500 uppercase dark:text-gray-500">
								Question {i + 1}
							</label>
							<input
								value={faq.question}
								maxLength={180}
								onChange={(e) => update(i, "question", e.target.value)}
								placeholder="e.g. Can I make this ahead of time?"
								className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 font-bold text-gray-900 outline-none placeholder:text-gray-300 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/20 dark:border-white/10 dark:bg-[#0d1f1c] dark:text-white dark:placeholder:text-gray-700 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/20"
							/>
						</div>
						<div>
							<label className="mb-2 block text-xs font-bold text-gray-500 uppercase dark:text-gray-500">
								Answer
							</label>
							<textarea
								value={faq.answer}
								maxLength={1000}
								onChange={(e) => {
									update(i, "answer", e.target.value);
									e.target.style.height = "auto";
									e.target.style.height = e.target.scrollHeight + "px";
								}}
								placeholder="Provide a helpful answer..."
								className="min-h-[100px] w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none placeholder:text-gray-300 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/20 dark:border-white/10 dark:bg-[#0d1f1c] dark:text-gray-300 dark:placeholder:text-gray-700 dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/20"
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
