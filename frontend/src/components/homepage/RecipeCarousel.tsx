"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import { RecipeCard, RecipeCardSkeleton } from "../BasicCard";
import Link from "next/link";

interface RecipeCarouselProps {
	title: string;
	subtitle?: string;
	recipes: any[];
	id?: string;
}

const RecipeCarousel = ({
	title,
	subtitle = "Unleash your love with foods",
	recipes,
	id,
}: RecipeCarouselProps) => {
	const carouselId =
		id || `carousel-${title.replace(/\s+/g, "-").toLowerCase()}`;
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [canScrollLeft, setCanScrollLeft] = useState(false);
	const [canScrollRight, setCanScrollRight] = useState(true);

	const checkScroll = useCallback(() => {
		if (!scrollContainerRef.current) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
		setCanScrollLeft(scrollLeft > 5);
		setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
	}, []);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;
		checkScroll();
		container.addEventListener("scroll", checkScroll, { passive: true });
		window.addEventListener("resize", checkScroll);
		return () => {
			container.removeEventListener("scroll", checkScroll);
			window.removeEventListener("resize", checkScroll);
		};
	}, [checkScroll, recipes]);

	const handleScroll = useCallback((direction: "left" | "right") => {
		if (!scrollContainerRef.current) return;
		const scrollAmount = window.innerWidth < 768 ? 320 : 600;
		const sign = direction === "left" ? -1 : 1;
		scrollContainerRef.current.scrollBy({
			left: sign * scrollAmount,
			behavior: "smooth",
		});
	}, []);

	const renderContent = () => {
		if (!recipes) {
			return (
				<div className="flex gap-6 overflow-hidden px-6 py-4 lg:pl-24">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="shrink-0">
							<RecipeCardSkeleton />
						</div>
					))}
				</div>
			);
		}

		if (recipes.length === 0) {
			return (
				<div className="px-6 py-10 text-gray-500 italic lg:pl-24 dark:text-gray-600">
					No recipes found right now.
				</div>
			);
		}

		return (
			<div
				id={carouselId}
				ref={scrollContainerRef}
				className="no-scrollbar flex gap-5 overflow-x-auto px-6 py-4 md:py-5 lg:gap-8 lg:px-24 lg:pl-24"
				style={{ scrollbarWidth: "none" }}
			>
				{recipes.map((recipe: any) => (
					<div key={recipe.id} className="h-full shrink-0 snap-start">
						<RecipeCard recipe={recipe} />
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="group/carousel relative w-full bg-transparent py-4 transition-colors duration-500 lg:py-6">
			{/* --- HEADER LAYER (Title + Controls) --- */}
			<div className="relative z-10 mb-2 flex flex-col justify-between gap-4 px-6 md:flex-row md:items-end lg:px-24">
				{/* Title Block */}
				<div>
					<h2 className="text-2xl font-extrabold tracking-tight text-gray-900 lg:text-4xl dark:text-white">
						{title}
					</h2>
					<h2 className="mt-1 max-w-md text-sm font-medium text-gray-500 lg:text-base dark:text-gray-500">
						{subtitle}
					</h2>
				</div>

				{/* Controls Block (Desktop: Arrows + View All) */}
				<div className="hidden items-center gap-4 md:flex">
					{/* Navigation Arrows */}
					<div className="flex gap-2">
						<button
							onClick={() => handleScroll("left")}
							disabled={!canScrollLeft}
							aria-label="Scroll left"
							className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
								canScrollLeft
									? "border-gray-200 bg-white text-gray-700 hover:border-[#006C5E] hover:bg-[#006C5E] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80] dark:hover:text-black"
									: "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 dark:border-white/5 dark:bg-transparent dark:text-gray-700"
							}`}
						>
							<IoChevronBack size={20} />
						</button>
						<button
							onClick={() => handleScroll("right")}
							disabled={!canScrollRight}
							aria-label="Scroll right"
							className={`flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200 ${
								canScrollRight
									? "border-gray-200 bg-white text-gray-700 hover:border-[#006C5E] hover:bg-[#006C5E] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80] dark:hover:text-black"
									: "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 dark:border-white/5 dark:bg-transparent dark:text-gray-700"
							}`}
						>
							<IoChevronForward size={20} />
						</button>
					</div>

					{/* Divider */}
					<div className="h-6 w-px bg-gray-200 dark:bg-white/10"></div>

					{/* View All Button */}
					<Link
						href="/recipe"
						className="text-sm font-bold text-gray-600 transition-colors hover:text-[#006C5E] dark:text-gray-500 dark:hover:text-[#4ADE80]"
					>
						View All
					</Link>
				</div>
			</div>

			{/* --- CAROUSEL LAYER --- */}
			{renderContent()}

			{/* --- MOBILE FOOTER CONTROLS --- */}
			<div className="mt-2 flex items-center justify-between px-6 md:hidden">
				<Link
					href="/recipe"
					className="text-xs font-bold tracking-wide text-[#006C5E] uppercase dark:text-[#4ADE80]"
				>
					Explore All
				</Link>
				<div className="flex gap-3">
					<button
						aria-label="Scroll left"
						onClick={() => handleScroll("left")}
						disabled={!canScrollLeft}
						className={`rounded-full border p-2 transition-colors ${
							canScrollLeft
								? "border-gray-300 bg-white text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
								: "border-gray-100 bg-gray-50 text-gray-300 dark:border-white/5 dark:bg-transparent dark:text-gray-700"
						}`}
					>
						<IoChevronBack />
					</button>
					<button
						aria-label="Scroll right"
						onClick={() => handleScroll("right")}
						disabled={!canScrollRight}
						className={`rounded-full border p-2 transition-colors ${
							canScrollRight
								? "border-gray-300 bg-white text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
								: "border-gray-100 bg-gray-50 text-gray-300 dark:border-white/5 dark:bg-transparent dark:text-gray-700"
						}`}
					>
						<IoChevronForward />
					</button>
				</div>
			</div>
		</div>
	);
};

export default RecipeCarousel;
