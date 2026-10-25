"use client";

import {
	ArchiveRestore,
	Eye,
	FilePenLine,
	LoaderCircle,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type RecipeResponse, recipeClient } from "@/lib/api/recipeClient";
import { type Story, storyClient } from "@/lib/api/storyClient";
import CreateButton from "./CreateButton";

type Recipe = RecipeResponse["recipe"];
type ContentItem = Recipe | Story;
type ContentType = "RECIPES" | "STORIES";
type Filter = "ALL" | "DRAFT" | "PUBLISHED" | "ARCHIVED" | "DELETED";

const contentTypes: Array<{ value: ContentType; label: string }> = [
	{ value: "RECIPES", label: "Recipes" },
	{ value: "STORIES", label: "Stories" },
];
const filters: Filter[] = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"];

function isRecipe(item: ContentItem): item is Recipe {
	return "name" in item;
}

export default function ContentPage() {
	const [items, setItems] = useState<ContentItem[]>([]);
	const [contentType, setContentType] = useState<ContentType>("RECIPES");
	const [filter, setFilter] = useState<Filter>("ALL");
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	const loadContent = useCallback(async () => {
		setLoading(true);
		try {
			const status = filter === "ALL" ? undefined : filter;
			if (contentType === "RECIPES") {
				const result = await recipeClient.listMine(status, 1, 50);
				setItems(result.recipes);
			} else {
				const result = await storyClient.listMine(status, 1, 50);
				setItems(result.stories);
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not load your content.",
			);
		} finally {
			setLoading(false);
		}
	}, [contentType, filter]);

	useEffect(() => {
		void loadContent();
	}, [loadContent]);

	const remove = async (item: ContentItem) => {
		const label = isRecipe(item) ? "recipe" : "story";
		if (
			!window.confirm(
				`Move “${isRecipe(item) ? item.name : item.title}” to deleted ${label}s?`,
			)
		)
			return;
		setBusyId(item.id);
		try {
			if (isRecipe(item)) await recipeClient.delete(item.id);
			else await storyClient.delete(item.id);
			setItems((current) =>
				current.filter((currentItem) => currentItem.id !== item.id),
			);
			toast.success(
				`${label.charAt(0).toUpperCase() + label.slice(1)} moved to deleted ${label}s.`,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Could not delete the ${label}.`,
			);
		} finally {
			setBusyId(null);
		}
	};

	const restore = async (item: ContentItem) => {
		const label = isRecipe(item) ? "recipe" : "story";
		setBusyId(item.id);
		try {
			if (isRecipe(item)) await recipeClient.restore(item.id);
			else await storyClient.restore(item.id);
			setItems((current) =>
				current.filter((currentItem) => currentItem.id !== item.id),
			);
			toast.success(
				`${label.charAt(0).toUpperCase() + label.slice(1)} restored.`,
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: `Could not restore the ${label}.`,
			);
		} finally {
			setBusyId(null);
		}
	};

	const itemLabel = contentType === "RECIPES" ? "recipes" : "stories";

	return (
		<div>
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 className="mb-2 text-3xl font-semibold text-[#101827] dark:text-white">
						Content
					</h2>
					<p className="text-gray-500 dark:text-gray-400">
						Manage your recipes, stories, and drafts.
					</p>
				</div>
				<CreateButton />
			</div>

			<div className="mb-5 flex flex-wrap items-center justify-between gap-4">
				<div
					className="inline-flex rounded-full border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#0d1f1c]"
					role="tablist"
					aria-label="Content type"
				>
					{contentTypes.map((item) => (
						<button
							key={item.value}
							type="button"
							role="tab"
							aria-selected={contentType === item.value}
							onClick={() => setContentType(item.value)}
							className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${contentType === item.value ? "bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-black" : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"}`}
						>
							{item.label}
						</button>
					))}
				</div>

				<fieldset className="flex flex-wrap gap-2">
					<legend className="sr-only">Content status filter</legend>
					{filters.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => setFilter(item)}
							className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold ${filter === item ? "border-[#006C5E] bg-[#006C5E] text-white dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-black" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-[#0d1f1c] dark:text-gray-300"}`}
						>
							{item === "ALL"
								? "All"
								: item.charAt(0) + item.slice(1).toLowerCase()}
						</button>
					))}
				</fieldset>
			</div>

			<div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
				{loading ? (
					<div className="flex min-h-64 items-center justify-center text-gray-500">
						<LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading{" "}
						{itemLabel}
					</div>
				) : items.length === 0 ? (
					<div className="min-h-64 px-6 py-16 text-center">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							No {itemLabel} here
						</h2>
						<p className="mt-2 text-sm text-gray-500">
							Create a {contentType === "RECIPES" ? "recipe" : "story"} or
							choose another status.
						</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100 dark:divide-white/5">
						{items.map((item) => {
							const recipe = isRecipe(item);
							const title = recipe ? item.name : item.title;
							const image = recipe ? item.mainImage : item.coverImage;
							const editHref = recipe
								? `/edit-recipe/${item.id}`
								: `/new-story?draft=${item.id}`;
							const viewHref =
								item.status === "PUBLISHED" && item.slug
									? recipe
										? `/recipe/${item.slug}`
										: `/stories/${item.slug}`
									: null;

							return (
								<div
									key={item.id}
									className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5"
								>
									<div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
										{image ? (
											<Image
												src={image}
												fill
												alt=""
												className="object-cover"
												sizes="80px"
											/>
										) : null}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h2 className="truncate font-semibold text-gray-900 dark:text-white">
												{title}
											</h2>
											<span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400">
												{item.status}
											</span>
										</div>
										<p className="mt-1 text-xs text-gray-500">
											Updated{" "}
											{item.updatedAt
												? new Date(item.updatedAt).toLocaleDateString()
												: "recently"}
										</p>
									</div>
									<div className="ml-auto flex items-center gap-1">
										{viewHref ? (
											<Link
												href={viewHref}
												className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
												title={`View ${recipe ? "recipe" : "story"}`}
											>
												<Eye className="h-4 w-4" />
											</Link>
										) : null}
										{item.status !== "DELETED" ? (
											<>
												<Link
													href={editHref}
													className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
													title={`Edit ${recipe ? "recipe" : "story"}`}
												>
													<FilePenLine className="h-4 w-4" />
												</Link>
												<button
													type="button"
													onClick={() => void remove(item)}
													disabled={busyId === item.id}
													className="cursor-pointer rounded-md p-2 text-red-600 hover:bg-red-50 disabled:cursor-wait dark:hover:bg-red-950/30"
													title={`Delete ${recipe ? "recipe" : "story"}`}
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</>
										) : (
											<button
												type="button"
												onClick={() => void restore(item)}
												disabled={busyId === item.id}
												className="cursor-pointer rounded-md p-2 text-[#006C5E] hover:bg-emerald-50 disabled:cursor-wait dark:text-[#4ADE80] dark:hover:bg-emerald-950/30"
												title={`Restore ${recipe ? "recipe" : "story"}`}
											>
												<ArchiveRestore className="h-4 w-4" />
											</button>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
