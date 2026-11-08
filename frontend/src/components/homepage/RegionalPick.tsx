"use client";

import Image from "next/image";
import VerifiedBadge from "@/components/VerifiedBadge";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaClock, FaLeaf, FaStar, FaUtensils } from "react-icons/fa";
import { getAllRecipesAction } from "@/lib/actions/recipe.actions";
import { formatters } from "@/lib/formatters";
import imageLoader from "@/lib/loader";

const cuisines = [
	"American",
	"Asian",
	"British",
	"Chinese",
	"French",
	"Greek",
	"Indian",
	"Italian",
	"Japanese",
	"Korean",
	"Mexican",
	"Middle Eastern",
	"Nordic",
	"Spanish",
	"Thai",
	"Turkish",
	"Vietnamese",
];
const REGIONAL_SKELETONS = ["one", "two", "three", "four", "five", "six"];

// Helper for type safety
interface Recipe {
	id: string;
	slug: string;
	name: string;
	totalTimeReq: number | null;
	yield: number | null;
	diet: string | null;
	ratings: number | null;
	ratingCount?: number | null;
	mainImage: string;
	author?: { name: string; image: string | null; isVerifiedBadge?: boolean };
}

const RegionalPick = () => {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [selectedCuisine, setSelectedCuisine] = useState("All");
	const [loading, setLoading] = useState(true);
	const [request, setRequest] = useState({ page: 1 });
	const [hasMore, setHasMore] = useState(false);
	const [fetchError, setFetchError] = useState(false);
	const loadingRef = useRef(true);
	const listRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;
		const { page } = request;
		const fetchRecipes = async () => {
			setLoading(true);
			setFetchError(false);

			try {
				const response = await getAllRecipesAction({
					page,
					limit: 9,
					cuisine: selectedCuisine === "All" ? undefined : selectedCuisine,
					sortBy: "popular",
				});

				if (!active) return;
				if (response.success && response.data) {
					const next = response.data as Recipe[];
					setRecipes((previous) => {
						if (page === 1) return next;
						const existing = new Set(previous.map((recipe) => recipe.id));
						return [
							...previous,
							...next.filter((recipe) => !existing.has(recipe.id)),
						];
					});
					setHasMore(Boolean(response.hasMore));
				} else {
					if (page === 1) setRecipes([]);
					setFetchError(true);
				}
			} catch (error) {
				console.error("Fetch failed:", error);
				if (active && page === 1) setRecipes([]);
				if (active) setFetchError(true);
			} finally {
				if (active) {
					loadingRef.current = false;
					setLoading(false);
				}
			}
		};

		fetchRecipes();
		return () => {
			active = false;
		};
	}, [selectedCuisine, request]);

	const loadMore = () => {
		if (!hasMore || loadingRef.current || fetchError) return;
		loadingRef.current = true;
		setRequest((previous) => ({ page: previous.page + 1 }));
	};

	const retryFetch = () => {
		loadingRef.current = true;
		setLoading(true);
		setRequest((previous) => ({ ...previous }));
	};

	return (
		<section
			aria-labelledby="cuisine-picks-heading"
			className="w-full bg-transparent py-4 lg:py-6"
		>
			<div className="mb-2 px-6 lg:px-24">
				<h2
					id="cuisine-picks-heading"
					className="text-2xl font-extrabold tracking-tight text-gray-900 lg:text-4xl dark:text-white"
				>
					Cuisine picks
				</h2>
				<p className="mt-1 max-w-md text-sm font-medium text-gray-600 lg:text-base dark:text-gray-300">
					Explore recipes by cuisine.
				</p>
			</div>

			<div className="no-scrollbar mb-5 flex gap-3 overflow-x-auto px-6 py-4 lg:px-24">
				{["All", ...cuisines].map((cuisine) => (
					<button
						type="button"
						key={cuisine}
						aria-pressed={selectedCuisine === cuisine}
						className={`shrink-0 cursor-pointer rounded-full border px-5 py-2 text-sm font-bold whitespace-nowrap transition-colors ${
							selectedCuisine === cuisine
								? "border-[#006C5E] bg-[#006C5E] text-white dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-[#0d1f1c]"
								: "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
						}`}
						onClick={() => {
							if (cuisine === selectedCuisine) return;
							loadingRef.current = true;
							setLoading(true);
							setRecipes([]);
							setHasMore(false);
							setRequest({ page: 1 });
							setSelectedCuisine(cuisine);
							if (listRef.current) listRef.current.scrollTop = 0;
						}}
					>
						{cuisine === "All" ? "All cuisines" : cuisine}
					</button>
				))}
			</div>

			<div className="mx-6 rounded-2xl border border-gray-200 bg-white p-4 lg:mx-24 dark:border-white/10 dark:bg-[#152a26] sm:p-5">
				{loading && recipes.length === 0 ? (
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{REGIONAL_SKELETONS.map((key) => (
							<div
								key={key}
								className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-2 dark:border-white/5 dark:bg-white/5"
							>
								<div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-gray-200 lg:h-36 lg:w-36 dark:bg-white/10" />
								<div className="flex w-full flex-col gap-2 pt-1">
									<div className="h-4 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
									<div className="h-3 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
									<div className="mt-auto h-3 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
								</div>
							</div>
						))}
					</div>
				) : fetchError && recipes.length === 0 ? (
					<div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-300">
						<span>Could not load recipes.</span>
						<button
							type="button"
							onClick={retryFetch}
							className="font-semibold text-[#006C5E] dark:text-[#4ADE80]"
						>
							Try again
						</button>
					</div>
				) : recipes.length === 0 ? (
					<div className="flex min-h-64 flex-col items-center justify-center text-sm text-gray-500 dark:text-gray-400">
						<span className="mb-2 text-4xl opacity-50 grayscale">🍽️</span>
						No recipes found for {selectedCuisine}.
					</div>
				) : (
					<section
						ref={listRef}
						className="max-h-[752px] overflow-y-auto lg:max-h-[542px]"
						aria-label="Cuisine recipes"
						onScroll={(event) => {
							const list = event.currentTarget;
							if (list.scrollTop + list.clientHeight >= list.scrollHeight - 80)
								loadMore();
						}}
					>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{recipes.map((recipe) => (
								<RegionalCard key={recipe.id} recipe={recipe} />
							))}
						</div>
						{(hasMore || fetchError) && (
							<button
								type="button"
								onClick={fetchError ? retryFetch : loadMore}
								disabled={loading}
								className="mt-4 w-full rounded-xl p-3 text-sm font-semibold text-[#006C5E] dark:text-[#4ADE80]"
							>
								{loading
									? "Loading recipes…"
									: fetchError
										? "Could not load more. Try again"
										: "Load more recipes"}
							</button>
						)}
					</section>
				)}
			</div>
		</section>
	);
};

// --- SUB COMPONENTS ---

const RegionalCard = ({ recipe }: { recipe: Recipe }) => {
	return (
		<Link
			href={`/recipe/${recipe.slug}`}
			className="flex h-[112px] w-full cursor-pointer items-center gap-3 rounded-2xl border border-transparent bg-white p-2 transition-colors hover:border-gray-100 lg:h-[170px] lg:p-3 dark:border-white/5 dark:bg-white/5 dark:hover:border-[#4ADE80]/30"
		>
			{/* Image */}
			<div className="relative h-16 w-16 min-w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 lg:h-36 lg:w-36 dark:bg-white/10">
				{recipe.mainImage && (
					<Image
						src={recipe.mainImage}
						alt={recipe.name}
						fill
						sizes="(max-width: 768px) 64px, 144px"
						loader={imageLoader}
						className="object-cover"
					/>
				)}
			</div>

			{/* Content */}
			<div className="flex h-full w-full min-w-0 flex-col justify-between py-0.5">
				<div>
					<h3 className="mb-1 truncate text-sm font-bold text-gray-700 lg:text-lg dark:text-gray-200">
						{recipe.name}
					</h3>

					<div className="space-y-0.5 font-sans text-sm text-gray-700 lg:space-y-1 dark:text-gray-300">
						<p className="flex items-center gap-1">
							<FaClock className="text-[#006C5E] dark:text-[#4ADE80]" />
							<span className="font-medium">{recipe.totalTimeReq} mins</span>
						</p>
						<p className="flex items-center gap-1">
							<FaUtensils className="text-[#006C5E] dark:text-[#4ADE80]" />
							<span className="font-medium">{recipe.yield} servings</span>
						</p>
						<p className="flex items-center gap-1">
							<FaLeaf className="text-[#006C5E] dark:text-[#4ADE80]" />
							<span className="max-w-[100px] truncate font-medium">
								{recipe.diet}
							</span>
						</p>
					</div>
				</div>

				{/* Footer (Desktop Only) */}
				<div className="mt-2 hidden w-full items-center justify-between border-t border-dashed border-gray-100 pt-2 lg:flex dark:border-white/10">
					<div className="flex items-center gap-2">
						{recipe.author?.image ? (
							<Image
								src={recipe.author.image}
								width={24}
								height={24}
								className="rounded-full object-cover"
								alt=""
								loader={imageLoader}
							/>
						) : (
							<div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-white/10" />
						)}
						<span className="max-w-[100px] truncate font-sans text-sm text-gray-600 dark:text-gray-300">
							{recipe.author?.name}
						</span>
						<VerifiedBadge verified={recipe.author?.isVerifiedBadge} />
					</div>

					{(recipe.ratingCount ?? 0) > 0 && recipe.ratings != null && (
						<div className="flex items-center gap-1 rounded-full bg-[#006C5E]/10 px-2 py-1 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
							<FaStar className="text-[10px]" />
							<span className="text-xs font-bold">
								{formatters.rating(recipe.ratings)}
							</span>
						</div>
					)}
				</div>
			</div>
		</Link>
	);
};

export default RegionalPick;
