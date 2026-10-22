"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaClock, FaLeaf, FaSearch, FaStar, FaUtensils } from "react-icons/fa";
import { BasicCard } from "@/components/BasicCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getAllRecipesAction } from "@/lib/actions/recipe.actions";
import { formatters } from "@/lib/formatters";
import imageLoader from "@/lib/loader";

const RECIPE_CATEGORIES = [
	"All",
	"Breakfast",
	"Snacks",
	"Rice",
	"Cakes",
	"Chicken",
	"Vegetarian",
	"Non-Vegetarian",
	"Lunch",
	"Sweets",
	"Drinks",
	"Egg",
	"Seafood",
	"Instant Pot",
	"Kids",
];
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
					tag: category,
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
					<div className="mr-2 shrink-0 text-gray-400 dark:text-gray-500">
						<FaSearch />
					</div>
					{RECIPE_CATEGORIES.map((category) => (
						<button
							type="button"
							key={category}
							onClick={() => setSelectedCategory(category)}
							className={`rounded-full border px-5 py-2 text-sm font-bold whitespace-nowrap transition-all ${
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
				{/* Promotional Banner */}
				<div className="group relative mb-16 cursor-pointer overflow-hidden rounded-[2.5rem] bg-[#006C5E] text-white shadow-2xl shadow-[#006C5E]/20 dark:border dark:border-white/10 dark:shadow-none">
					<div
						className="absolute inset-0 opacity-20"
						style={{
							backgroundImage:
								"radial-gradient(circle, white 1px, transparent 1px)",
							backgroundSize: "20px 20px",
						}}
					/>
					<div className="absolute top-0 right-0 h-full w-1/2 bg-linear-to-l from-black/40 to-transparent" />

					<div className="relative z-10 flex flex-col items-center justify-between gap-8 p-10 md:flex-row lg:p-16">
						<div className="max-w-xl">
							<span className="mb-4 inline-block rounded-full border border-white/10 bg-white/20 px-4 py-1 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
								Pro Member Exclusive
							</span>
							<h2 className="mb-4 text-3xl leading-tight font-black lg:text-5xl">
								Master the Art of <br /> Sourdough Bread.
							</h2>
							<p className="mb-8 text-lg leading-relaxed text-white/80">
								Unlock our comprehensive 5-part video course. Learn
								fermentation, shaping, and baking perfect loaves.
							</p>
							<button
								type="button"
								className="rounded-xl bg-white px-8 py-3 font-bold text-[#006C5E] shadow-lg transition-colors hover:bg-gray-100"
							>
								Start Learning
							</button>
						</div>
					</div>
				</div>

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
						<div className="no-scrollbar -mx-4 flex gap-6 overflow-x-auto px-4 pb-8 lg:mx-0 lg:px-0">
							{popularRecipes.map((recipe) => (
								<div key={recipe.id} className="min-w-[280px] md:min-w-[320px]">
									<BasicCard recipe={recipe} />
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
									className="h-80 animate-pulse break-inside-avoid rounded-3xl bg-gray-200 dark:bg-white/5"
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
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{recipes.map((recipe) => (
								<RecipeMasonryCard key={recipe.id} recipe={recipe} />
							))}
						</div>
					)}

					{/* Load More Spinner */}
					<div
						ref={observerTarget}
						className="mt-8 flex h-32 items-center justify-center"
					>
						{isLoadingMore && (
							<div className="flex items-center gap-2 font-bold text-[#006C5E] dark:text-[#4ADE80]">
								<span className="animate-spin text-2xl">C</span> Loading more...
							</div>
						)}
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

	return (
		<Link
			href={href}
			className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-[#006c5e]/40 dark:border-white/10 dark:bg-[#152a26] dark:hover:border-[#4ade80]/40"
		>
			<div className="relative aspect-[4/3] w-full bg-gray-100 dark:bg-white/5">
				<Image
					src={recipe.mainImage}
					alt={recipe.name}
					fill
					sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
					className="object-cover"
					loader={imageLoader}
				/>
			</div>

			<div className="flex flex-1 flex-col p-5">
				{recipe.ratingCount > 0 && recipe.ratings != null && (
					<div className="mb-3 flex">
						<span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-900 dark:bg-white/10 dark:text-white">
							<FaStar className="text-yellow-400" />{" "}
							{formatters.rating(recipe.ratings)}
						</span>
					</div>
				)}

				<h3 className="line-clamp-2 text-xl leading-tight font-black text-gray-900 dark:text-white">
					{recipe.name}
				</h3>

				<div className="mt-4">
					<div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-300">
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
						{recipe.diet && (
							<span className="flex items-center gap-1">
								<FaLeaf /> {recipe.diet}
							</span>
						)}
					</div>

					{recipe.author && (
						<div className="mt-4 flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-white/20">
							<div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-300 bg-gray-100 dark:border-white/50 dark:bg-white/10">
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
							<span className="text-sm font-medium text-gray-700 dark:text-white">
								by {recipe.author.name}
							</span>
						</div>
					)}
				</div>
			</div>
		</Link>
	);
};
