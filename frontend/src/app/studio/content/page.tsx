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
import CreateButton from "./CreateButton";

type Recipe = RecipeResponse["recipe"];
type Filter = "ALL" | Recipe["status"];

const filters: Filter[] = ["ALL", "DRAFT", "PUBLISHED", "ARCHIVED", "DELETED"];

export default function ContentPage() {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [filter, setFilter] = useState<Filter>("ALL");
	const [loading, setLoading] = useState(true);
	const [busyId, setBusyId] = useState<string | null>(null);

	const loadRecipes = useCallback(async () => {
		setLoading(true);
		try {
			const result = await recipeClient.listMine(
				filter === "ALL" ? undefined : filter,
				1,
				50,
			);
			setRecipes(result.recipes);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not load your recipes.",
			);
		} finally {
			setLoading(false);
		}
	}, [filter]);

	useEffect(() => {
		void loadRecipes();
	}, [loadRecipes]);

	const remove = async (recipe: Recipe) => {
		if (!window.confirm(`Move “${recipe.name}” to deleted recipes?`)) return;
		setBusyId(recipe.id);
		try {
			await recipeClient.delete(recipe.id);
			setRecipes((current) => current.filter((item) => item.id !== recipe.id));
			toast.success("Recipe moved to deleted recipes.");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not delete the recipe.",
			);
		} finally {
			setBusyId(null);
		}
	};

	const restore = async (recipe: Recipe) => {
		setBusyId(recipe.id);
		try {
			await recipeClient.restore(recipe.id);
			setRecipes((current) => current.filter((item) => item.id !== recipe.id));
			toast.success("Recipe restored.");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not restore the recipe.",
			);
		} finally {
			setBusyId(null);
		}
	};

	return (
		<div className="mx-auto max-w-6xl p-6 lg:p-12">
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="mb-2 text-3xl font-semibold text-gray-900 lg:text-4xl dark:text-white">
						Content
					</h1>
					<p className="text-gray-500 dark:text-gray-400">
						Manage your recipes and drafts.
					</p>
				</div>
				<CreateButton />
			</div>

			<fieldset className="mb-5 flex flex-wrap gap-2">
				<legend className="sr-only">Recipe status filter</legend>
				{filters.map((item) => (
					<button
						key={item}
						type="button"
						onClick={() => setFilter(item)}
						className={`cursor-pointer rounded-md border px-3 py-2 text-xs font-semibold ${
							filter === item
								? "border-[#006C5E] bg-[#006C5E] text-white dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-black"
								: "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-[#0d1f1c] dark:text-gray-300"
						}`}
					>
						{item === "ALL"
							? "All"
							: item.charAt(0) + item.slice(1).toLowerCase()}
					</button>
				))}
			</fieldset>

			<div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
				{loading ? (
					<div className="flex min-h-64 items-center justify-center text-gray-500">
						<LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Loading
						recipes
					</div>
				) : recipes.length === 0 ? (
					<div className="min-h-64 px-6 py-16 text-center">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							No recipes here
						</h2>
						<p className="mt-2 text-sm text-gray-500">
							Create a recipe or choose another status.
						</p>
					</div>
				) : (
					<div className="divide-y divide-gray-100 dark:divide-white/5">
						{recipes.map((recipe) => (
							<div
								key={recipe.id}
								className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:p-5"
							>
								<div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-white/5">
									{recipe.mainImage ? (
										<Image
											src={recipe.mainImage}
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
											{recipe.name}
										</h2>
										<span className="rounded border border-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-500 dark:border-white/10 dark:text-gray-400">
											{recipe.status}
										</span>
									</div>
									<p className="mt-1 text-xs text-gray-500">
										Updated{" "}
										{recipe.updatedAt
											? new Date(recipe.updatedAt).toLocaleDateString()
											: "recently"}
									</p>
								</div>
								<div className="ml-auto flex items-center gap-1">
									{recipe.status === "PUBLISHED" && recipe.slug ? (
										<Link
											href={`/recipe/${recipe.slug}`}
											className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
											title="View recipe"
										>
											<Eye className="h-4 w-4" />
										</Link>
									) : null}
									{recipe.status !== "DELETED" ? (
										<>
											<Link
												href={`/edit-recipe/${recipe.id}`}
												className="cursor-pointer rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
												title="Edit recipe"
											>
												<FilePenLine className="h-4 w-4" />
											</Link>
											<button
												type="button"
												onClick={() => void remove(recipe)}
												disabled={busyId === recipe.id}
												className="cursor-pointer rounded-md p-2 text-red-600 hover:bg-red-50 disabled:cursor-wait dark:hover:bg-red-950/30"
												title="Delete recipe"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</>
									) : (
										<button
											type="button"
											onClick={() => void restore(recipe)}
											disabled={busyId === recipe.id}
											className="cursor-pointer rounded-md p-2 text-[#006C5E] hover:bg-emerald-50 disabled:cursor-wait dark:text-[#4ADE80] dark:hover:bg-emerald-950/30"
											title="Restore recipe"
										>
											<ArchiveRestore className="h-4 w-4" />
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
