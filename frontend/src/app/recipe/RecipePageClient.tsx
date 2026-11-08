"use client";

import Image from "next/image";
import VerifiedBadge from "@/components/VerifiedBadge";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { FaClock, FaStar, FaUtensils } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { RecipeCard } from "@/components/BasicCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import CookingLoader from "@/components/ui/CookingLoader";
import { getAllRecipesAction } from "@/lib/actions/recipe.actions";
import { recipeClient } from "@/lib/api/recipeClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatters } from "@/lib/formatters";
import imageLoader from "@/lib/loader";
import { markInstallEngagement } from "@/lib/pwa/installPrompt";
import { track } from "@/lib/analytics/track";
import { RECIPE_CATEGORIES } from "@/lib/recipeCategories";
import { setTab } from "@/lib/Slices/tabSlice";

const RECIPE_CATEGORY_FILTERS = ["All", ...RECIPE_CATEGORIES] as const;
const RECIPE_SKELETONS = [
	"recipe-1",
	"recipe-2",
	"recipe-3",
	"recipe-4",
	"recipe-5",
	"recipe-6",
];

export interface Recipe {
	id: string;
	slug: string;
	name: string;
	mainImage: string;
	ratings: number | null;
	ratingCount: number;
	totalTimeReq: number | null;
	yield: number | null;
	diet: string | null;
	cuisine: string;
	views: number;
	createdAt: string;
	author: {
		isVerifiedBadge?: boolean;
		id: string;
		name: string;
		image: string | null;
		username: string | null;
	};
}

interface RecipePageClientProps {
	initialRecipes: Recipe[];
	initialPopular: Recipe[];
}

export default function RecipePageClient({
	initialRecipes,
	initialPopular,
}: RecipePageClientProps) {
	const [selectedCategory, setSelectedCategory] = useState<string>("All");
	const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
	const [popularRecipes] = useState<Recipe[]>(initialPopular); // No need to fetch again

	const [isLoading, setIsLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	const observerTarget = useRef<HTMLDivElement | null>(null);
	const isFirstRender = useRef(true); // 🛑 Prevents double fetch on mount

	// --- FETCH LOGIC (Only for filtering/pagination) ---
	const fetchRecipes = useCallback(
		async (pageNum: number, category: string, isLoadMore: boolean) => {
			if (isLoadMore) setIsLoadingMore(true);
			else setIsLoading(true);

			try {
				const response = await getAllRecipesAction({
					page: pageNum,
					limit: 12,
					recipeCategory: category,
					sortBy: "latest",
				});

				if (!response.success || !response.data) {
					throw new Error(response.error);
				}

				const newRecipes = response.data as Recipe[];

				setRecipes((prev) =>
					isLoadMore ? [...prev, ...newRecipes] : newRecipes,
				);
				setHasMore(response.hasMore || false);
			} catch (error) {
				console.error("Fetch error:", error);
			} finally {
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		},
		[],
	);

	// --- EFFECT: Handle Category Change ---
	useEffect(() => {
		// 🛑 STOP! Don't fetch if it's the very first render (we have props)
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		setPage(1);
		fetchRecipes(1, selectedCategory, false);
	}, [selectedCategory, fetchRecipes]);

	// --- EFFECT: Infinite Scroll ---
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (
					entries[0].isIntersecting &&
					hasMore &&
					!isLoading &&
					!isLoadingMore
				) {
					const nextPage = page + 1;
					setPage(nextPage);
					track("load_more", { list_name: "recipes", page_number: nextPage });
					fetchRecipes(nextPage, selectedCategory, true);
				}
			},
			{ threshold: 0.5 },
		);

		if (observerTarget.current) observer.observe(observerTarget.current);
		return () => observer.disconnect();
	}, [hasMore, isLoading, isLoadingMore, page, selectedCategory, fetchRecipes]);

	return (
		<div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />

			<div className="mt-16 border-b border-gray-200 bg-[#fafafa] px-4 py-2 transition-colors lg:px-24 dark:border-white/10 dark:bg-[#0d1f1c]">
				<div className="no-scrollbar flex items-center gap-3 overflow-x-auto">
					{RECIPE_CATEGORY_FILTERS.map((category) => (
						<button
							type="button"
							key={category}
							onClick={() => {
								setSelectedCategory(category);
								track("filter_category", { category, list_name: "recipes" });
							}}
							className={`cursor-pointer rounded-full border px-5 py-2 text-sm font-bold whitespace-nowrap transition-all ${
								selectedCategory === category
									? "border-[#006C5E] bg-[#006C5E] text-white shadow-lg shadow-[#006C5E]/20 dark:border-[#4ADE80] dark:bg-[#4ADE80] dark:text-black dark:shadow-[#4ADE80]/20"
									: "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
							}`}
						>
							{category}
						</button>
					))}
				</div>
			</div>

			<main className="container mx-auto px-4 pt-8 pb-12 sm:pt-10 lg:px-24 lg:py-12">
				{/* Popular Section */}
				{selectedCategory === "All" && popularRecipes.length > 0 && (
					<section className="animate-fade-in-up mb-20">
						<div className="mb-8 flex items-end justify-between">
							<div>
								<h2 className="text-3xl font-black text-gray-900 dark:text-white">
									Trending Now
								</h2>
								<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Community favorites this week.
								</p>
							</div>
						</div>
						<div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:gap-6 md:px-0">
							{popularRecipes.map((recipe) => (
								<div key={recipe.id} className="snap-start">
									<RecipeCard recipe={recipe} />
								</div>
							))}
						</div>
					</section>
				)}

				{/* Masonry Grid */}
				<section className="animate-fade-in-up">
					<div className="mb-10">
						<h2 className="text-3xl font-black text-gray-900 dark:text-white">
							{selectedCategory === "All"
								? "Explore Recipes"
								: `${selectedCategory} Recipes`}
						</h2>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							{recipes.length} delicious ideas found.
						</p>
					</div>

					{isLoading && recipes.length === 0 ? (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{RECIPE_SKELETONS.map((key) => (
								<div
									key={key}
									className="h-80 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/5"
								/>
							))}
						</div>
					) : recipes.length === 0 ? (
						<div className="py-32 text-center text-gray-500 dark:text-gray-600">
							<div className="mb-4 text-7xl opacity-30 grayscale">🍳</div>
							<p className="text-xl font-bold">No recipes found.</p>
							<p className="text-sm">Try selecting a different category.</p>
						</div>
					) : (
						<div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
							{recipes.map((recipe) => (
								<div key={recipe.id} className="mb-5 break-inside-avoid">
									<RecipeMasonryCard recipe={recipe} />
								</div>
							))}
						</div>
					)}

					{/* Load More Spinner */}
					<div
						ref={observerTarget}
						className="mt-8 flex h-32 items-center justify-center"
					>
						{isLoadingMore && <CookingLoader />}
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}

// --- SUB COMPONENT ---
const RecipeMasonryCard = ({ recipe }: { recipe: Recipe }) => {
	const href = `/recipe/${recipe.slug}`;
	const { status, user } = useAuth();
	const dispatch = useDispatch();
	const [bookmarked, setBookmarked] = useState<boolean | null>(null);
	const [saving, setSaving] = useState(false);
	const cardRef = useRef<HTMLDivElement>(null);
	const requestVersion = useRef(0);

	useEffect(() => {
		setBookmarked(null);
		const version = ++requestVersion.current;
		const card = cardRef.current;
		if (status !== "authenticated" || !user?.id || !card) return;
		let active = true;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				void recipeClient
					.viewerState(recipe.id)
					.then((state) => {
						if (active && requestVersion.current === version)
							setBookmarked(state.bookmarked);
					})
					.catch(() => {});
			},
			{ rootMargin: "200px" },
		);
		observer.observe(card);
		return () => {
			active = false;
			observer.disconnect();
		};
	}, [status, user?.id, recipe.id]);

	const toggleBookmark = async () => {
		if (status === "unauthenticated") {
			dispatch(setTab("login"));
			return;
		}
		if (status !== "authenticated" || saving) return;
		requestVersion.current += 1;
		setSaving(true);
		try {
			const current =
				bookmarked ?? (await recipeClient.viewerState(recipe.id)).bookmarked;
			if (bookmarked === null && current) {
				setBookmarked(true);
				toast.success("Already saved to your library");
				return;
			}
			const result = current
				? await recipeClient.unbookmark(recipe.id)
				: await recipeClient.bookmark(recipe.id);
			setBookmarked(result.bookmarked);
			if (result.bookmarked) {
				markInstallEngagement();
				track("save_recipe", { recipe_id: recipe.id, cuisine: recipe.cuisine, creator_id: recipe.author?.id });
			} else {
				track("unsave_recipe", { recipe_id: recipe.id });
			}
			toast.success(
				result.bookmarked ? "Saved to library" : "Removed from library",
			);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not update bookmark",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			ref={cardRef}
			className="group relative w-full overflow-hidden rounded-2xl bg-[#152a26]"
		>
			<Link
				href={href}
				className="relative block w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#006c5e] dark:focus-visible:ring-[#4ade80]"
			>
				{recipe.mainImage && (
					<>
						{/* shortcut: use native image dimensions until recipe media stores width and height. */}
						{/* biome-ignore lint/performance/noImgElement: Native dimensions preserve each source image ratio for masonry. */}
						<img
							src={imageLoader({ src: recipe.mainImage, width: 960 })}
							alt={recipe.name}
							loading="lazy"
							className="block h-auto w-full"
						/>
					</>
				)}

				<div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071713]/95 via-[#071713]/80 to-transparent px-4 pt-16 pb-4 text-white">
					<h3 className="text-lg leading-snug font-bold drop-shadow-sm">
						{recipe.name}
					</h3>
					<div className="mt-1 hidden flex-wrap gap-x-3 gap-y-1 text-sm font-semibold [@media(hover:none)]:flex">
						{recipe.totalTimeReq && <span>{recipe.totalTimeReq} min</span>}
						{recipe.yield && <span>{recipe.yield} servings</span>}
						{recipe.diet && <span>{recipe.diet}</span>}
					</div>
				</div>

				<div className="pointer-events-none absolute inset-0 bg-[#071713]/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
				<div className="pointer-events-none absolute inset-x-0 top-0 flex -translate-y-2 items-start justify-between p-4 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
					<div className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold tracking-[0.1em] uppercase backdrop-blur-sm">
						{recipe.cuisine || "Recipe"}
					</div>
				</div>
				<div className="pointer-events-none absolute inset-x-0 top-14 -translate-y-2 px-4 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
					<div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-semibold">
						{recipe.totalTimeReq && (
							<span className="flex items-center gap-1">
								<FaClock /> {recipe.totalTimeReq}m
							</span>
						)}
						{recipe.yield && (
							<span className="flex items-center gap-1">
								<FaUtensils /> {recipe.yield}
							</span>
						)}
						{recipe.diet && <span>{recipe.diet}</span>}
						{recipe.ratingCount > 0 && recipe.ratings != null && (
							<span className="flex items-center gap-1">
								<FaStar className="text-yellow-300" />
								{formatters.rating(recipe.ratings)}
							</span>
						)}
					</div>
					{recipe.author && (
						<div className="flex items-center gap-2.5">
							<div className="relative h-7 w-7 overflow-hidden rounded-full border border-white/70 bg-white/20">
								{recipe.author.image && (
									<Image
										src={recipe.author.image}
										fill
										alt=""
										className="object-cover"
										loader={imageLoader}
									/>
								)}
							</div>
							<span className="text-sm font-medium">{recipe.author.name} <VerifiedBadge verified={recipe.author.isVerifiedBadge} /></span>
						</div>
					)}
				</div>
			</Link>
			<button
				type="button"
				onClick={toggleBookmark}
				disabled={saving || status === "loading"}
				aria-label={
					bookmarked
						? `Remove ${recipe.name} from bookmarks`
						: `Save ${recipe.name} to bookmarks`
				}
				aria-pressed={bookmarked ?? undefined}
				className="absolute right-4 top-4 cursor-pointer rounded-full bg-white/95 p-2 text-[#0d1f1c] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait"
			>
				{bookmarked ? <BsBookmarkFill /> : <BsBookmark />}
			</button>
		</div>
	);
};
