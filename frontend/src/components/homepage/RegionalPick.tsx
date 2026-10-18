"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FaStar, FaClock, FaUtensils, FaLeaf } from "react-icons/fa";
import { formatters } from "@/lib/formatters";
import imageLoader from "@/lib/loader";
import { getAllRecipesAction } from "@/lib/actions/recipe.actions";

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

// Helper for type safety
interface Recipe {
	id: string;
	slug: string;
	name: string;
	totalTimeReq: number | null;
	yield: number | null;
	diet: string | null;
	ratings: number | null;
	mainImage: string;
	author?: { name: string; image: string | null };
}

const RegionalPick = () => {
	const [recipes, setRecipes] = useState<Recipe[]>([]);
	const [selectedCuisine, setSelectedCuisine] = useState("All");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchRecipes = async () => {
			setLoading(true);

			try {
				// ✅ CALL SERVER ACTION
				const response = await getAllRecipesAction({
					limit: 8,
					tag:
						selectedCuisine === "All"
							? undefined
							: selectedCuisine.toLowerCase(),
					sortBy: "popular",
				});

				if (response.success && response.data) {
					// Cast the data to match our UI interface if needed
					// (Your server action returns a slightly richer object, which is fine)
					setRecipes(response.data as any);
				} else {
					setRecipes([]);
				}
			} catch (error) {
				console.error("Fetch failed:", error);
				setRecipes([]);
			} finally {
				setLoading(false);
			}
		};

		fetchRecipes();
	}, [selectedCuisine]);

	// ... (Rest of your JSX remains exactly the same as your snippet)
	return (
		<div className="relative w-full transition-colors duration-500">
			{/* ... Backgrounds ... */}

			{/* ... Header ... */}

			<div className="flex min-h-[360px] flex-col gap-6 py-6 pr-2 pl-3 lg:flex-row lg:gap-10 lg:py-8 lg:pr-16 lg:pl-32">
				{/* Sidebar */}
				<div className="no-scrollbar z-10 max-h-[500px] w-full overflow-y-auto rounded-3xl border border-gray-100 bg-white py-2 shadow-xl transition-colors lg:w-1/4 lg:py-5 dark:border-white/5 dark:bg-[#152a26]">
					{/* ... Cuisine buttons ... */}
					<div
						className={`mx-1 mb-1 cursor-pointer rounded-2xl px-3 py-2 font-sans text-sm font-bold transition-all duration-200 lg:mx-5 lg:px-6 lg:text-lg ${
							selectedCuisine === "All"
								? "bg-[#006C5E] text-white shadow-md"
								: "text-gray-600 hover:bg-[#F1F7F6] dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-white"
						}`}
						onClick={() => setSelectedCuisine("All")}
					>
						All Cuisines
					</div>
					{cuisines.map((cuisine) => (
						<div
							key={cuisine}
							className={`mx-1 mb-1 cursor-pointer rounded-2xl px-3 py-2 font-sans text-sm font-medium transition-all duration-200 lg:mx-5 lg:px-6 lg:text-lg ${
								selectedCuisine === cuisine
									? "bg-[#006C5E] text-white shadow-md"
									: "text-gray-600 hover:bg-[#F1F7F6] dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-white"
							}`}
							onClick={() => setSelectedCuisine(cuisine)}
						>
							{cuisine}
						</div>
					))}
				</div>

				{/* Recipe List */}
				<div className="no-scrollbar z-10 max-h-[500px] w-full overflow-auto rounded-3xl border border-[#e0e0e0] bg-white/50 p-4 backdrop-blur-sm transition-colors lg:w-3/4 dark:border-white/5 dark:bg-white/5">
					{loading ? (
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
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
					) : recipes.length === 0 ? (
						<div className="col-span-full flex h-full flex-col items-center justify-center text-sm text-gray-500 opacity-60 dark:text-gray-500">
							<span className="mb-2 text-4xl opacity-50 grayscale">🍽️</span>
							No recipes found for {selectedCuisine}.
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
							{recipes.map((recipe) => (
								<RegionalCard key={recipe.id} recipe={recipe} />
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

// --- SUB COMPONENTS ---

const RegionalCard = ({ recipe }: { recipe: Recipe }) => {
	return (
		<Link
			href={`/recipe/${recipe.slug}`}
			className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white p-2 transition-all duration-300 hover:scale-[1.01] hover:border-gray-100 hover:bg-white hover:shadow-lg lg:p-3 dark:border-white/5 dark:bg-white/5 dark:hover:border-[#4ADE80]/30 dark:hover:bg-[#1a2c29]"
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
						className="object-cover transition-transform duration-500 group-hover:scale-110"
					/>
				)}
			</div>

			{/* Content */}
			<div className="flex h-full w-full min-w-0 flex-col justify-between py-0.5">
				<div>
					<h3 className="mb-1 truncate text-xs font-bold text-[#5A5A5A] transition-colors group-hover:text-[#006C5E] lg:text-lg dark:text-gray-200 dark:group-hover:text-[#4ADE80]">
						{recipe.name}
					</h3>

					<div className="space-y-0.5 font-sans text-[10px] text-[#7E7E7E] lg:space-y-1 lg:text-sm dark:text-gray-500">
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
						<span className="max-w-[100px] truncate font-sans text-xs text-gray-500 dark:text-gray-500">
							{recipe.author?.name}
						</span>
					</div>

					{recipe.ratings && recipe.ratings > 0 && (
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
