"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaStar, FaQuoteRight, FaCheckCircle } from "react-icons/fa";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";
import imageLoader from "@/lib/loader";

interface Review {
	id: string;
	text: string;
	date: string;
	user: {
		name: string;
		image: string;
		role: string;
	};
	rating: number;
}

const staticReviews: Review[] = [
	{
		id: "1",
		text: "The community here is unmatched. I posted my first Risotto and got genuine tips from professional chefs within hours. This isn't just an app; it's a culinary school.",
		date: "2024-11-24",
		user: {
			name: "Andrew Wilson",
			image: "https://api.dicebear.com/7.x/notionists/svg?seed=Andrew",
			role: "Home Cook",
		},
		rating: 5,
	},
	{
		id: "2",
		text: "Finally, a platform that respects the art of plating. The visual guides helped me turn a messy dinner into a Michelin-star presentation. My wife was blown away!",
		date: "2024-11-20",
		user: {
			name: "Sarah Chen",
			image: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah",
			role: "Food Blogger",
		},
		rating: 5,
	},
	{
		id: "3",
		text: "I've tried other recipe apps, but CookTale's 'Step-by-Step' mode is superior. The timers are actually helpful, and the ingredient scaling is a lifesaver.",
		date: "2024-11-18",
		user: {
			name: "Mike Johnson",
			image: "https://api.dicebear.com/7.x/notionists/svg?seed=Mike",
			role: "Pro Chef",
		},
		rating: 4,
	},
	{
		id: "4",
		text: "Shared my Grandmother's curry recipe and it went viral! The notification system is addictive. I love seeing people cook my family's heritage food.",
		date: "2024-11-15",
		user: {
			name: "Priya Patel",
			image: "https://api.dicebear.com/7.x/notionists/svg?seed=Priya",
			role: "Flavor Explorer",
		},
		rating: 5,
	},
	{
		id: "5",
		text: "The 'Pantry Search' feature saved me from ordering takeout. Found a delicious pasta recipe using just what I had left in the fridge. 10/10.",
		date: "2024-11-12",
		user: {
			name: "Carlos Ruiz",
			image: "https://api.dicebear.com/7.x/notionists/svg?seed=Carlos",
			role: "Student",
		},
		rating: 5,
	},
];

const Reviewsarea = () => {
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
	}, [checkScroll]);

	const handleScroll = useCallback((direction: "left" | "right") => {
		if (!scrollContainerRef.current) return;
		const scrollAmount = window.innerWidth < 768 ? 320 : 400;
		const sign = direction === "left" ? -1 : 1;
		scrollContainerRef.current.scrollBy({
			left: sign * scrollAmount,
			behavior: "smooth",
		});
	}, []);

	return (
		<section className="relative overflow-hidden bg-[#fafafa] py-10 transition-colors duration-500 lg:py-12 dark:bg-[#0d1f1c]">
			{/* --- BACKGROUND DECOR --- */}
			<Image
				src="https://res.cloudinary.com/dtlfdwhnm/image/upload/v1762243652/grid-png-43559_rd7kgx.png"
				width={400}
				height={400}
				alt=""
				loader={imageLoader}
				className="pointer-events-none absolute -top-20 -right-20 rotate-12 opacity-[0.03] dark:opacity-[0.02]"
			/>

			{/* Giant Typography */}
			<div className="pointer-events-none absolute bottom-0 left-0 -z-10 translate-y-1/3 opacity-[0.02] select-none">
				<span className="text-[20vw] leading-none font-black tracking-tighter text-gray-900 dark:text-white">
					LOVED
				</span>
			</div>

			<div className="relative z-10 w-full px-6 lg:px-24">
				{/* --- HEADER --- */}
				<div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-16">
					<div>
						<div className="mb-2 flex items-center gap-2">
							{[...Array(5)].map((_, i) => (
								<FaStar key={i} className="text-xl text-yellow-400" />
							))}
							<span className="ml-2 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
								4.9/5 Rating
							</span>
						</div>
						<h2 className="text-3xl leading-tight font-extrabold text-gray-900 lg:text-5xl dark:text-white">
							Taste the{" "}
							<span className="text-[#006C5E] dark:text-[#4ADE80]">Love.</span>
						</h2>
						<p className="mt-4 max-w-md font-medium text-gray-500 dark:text-gray-500">
							Don't just take our word for it. Join thousands of happy home
							chefs cooking better, every day.
						</p>
					</div>

					{/* Controls */}
					<div className="flex gap-3">
						<button
							aria-label="Scroll left"
							onClick={() => handleScroll("left")}
							disabled={!canScrollLeft}
							className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${
								canScrollLeft
									? "border-gray-200 bg-white text-gray-700 shadow-lg hover:border-[#006C5E] hover:bg-[#006C5E] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80] dark:hover:text-black"
									: "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 dark:border-white/5 dark:bg-transparent dark:text-gray-700"
							}`}
						>
							<IoChevronBack size={20} />
						</button>
						<button
							aria-label="Scroll right"
							onClick={() => handleScroll("right")}
							disabled={!canScrollRight}
							className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${
								canScrollRight
									? "border-gray-200 bg-white text-gray-700 shadow-lg hover:border-[#006C5E] hover:bg-[#006C5E] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-[#4ADE80] dark:hover:bg-[#4ADE80] dark:hover:text-black"
									: "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 dark:border-white/5 dark:bg-transparent dark:text-gray-700"
							}`}
						>
							<IoChevronForward size={20} />
						</button>
					</div>
				</div>

				{/* --- CAROUSEL --- */}
				<div
					ref={scrollContainerRef}
					className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 py-5 lg:-mx-24 lg:gap-8 lg:px-24"
				>
					{staticReviews.map((review) => (
						<div key={review.id} className="shrink-0 snap-center">
							<ReviewCard review={review} />
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Reviewsarea;

// --- CARD COMPONENT ---

const ReviewCard = ({ review }: { review: Review }) => {
	return (
		<div className="group relative flex h-full w-[320px] flex-col rounded-4xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl lg:w-[400px] dark:border-white/5 dark:bg-[#152a26] dark:shadow-none dark:hover:border-[#4ADE80]/30">
			{/* Decorative Quote Icon */}
			<FaQuoteRight className="absolute top-8 right-8 text-6xl text-gray-50 transition-colors duration-500 group-hover:text-[#006C5E]/10 dark:text-white/5 dark:group-hover:text-[#4ADE80]/10" />

			{/* Header: User Info */}
			<div className="relative z-10 mb-6 flex items-center gap-4">
				<div className="relative">
					<Image
						src={review.user.image}
						width={56}
						height={56}
						alt={review.user.name}
						className="rounded-full border-2 border-white bg-gray-100 object-cover shadow-md dark:border-[#0d1f1c] dark:bg-white/10"
						loader={imageLoader}
					/>
					{/* Verified Badge */}
					<div className="absolute -right-1 -bottom-1 rounded-full bg-white p-0.5 dark:bg-[#0d1f1c]">
						<FaCheckCircle className="text-sm text-[#006C5E] dark:text-[#4ADE80]" />
					</div>
				</div>
				<div>
					<h4 className="text-lg leading-none font-bold text-gray-900 dark:text-white">
						{review.user.name}
					</h4>
					<span className="mt-1 block text-xs font-bold tracking-wider text-[#006C5E] uppercase dark:text-[#4ADE80]">
						{review.user.role}
					</span>
				</div>
			</div>

			{/* Content */}
			<div className="relative z-10 mb-6 grow">
				<div className="mb-3 flex gap-1">
					{Array.from({ length: 5 }).map((_, i) => (
						<FaStar
							key={i}
							className={`text-sm ${
								i < review.rating
									? "text-yellow-400"
									: "text-gray-200 dark:text-gray-700"
							}`}
						/>
					))}
				</div>
				<p className="leading-relaxed font-medium text-gray-600 dark:text-gray-300">
					&quot;{review.text}&quot;
				</p>
			</div>

			{/* Footer: Date */}
			<div className="relative z-10 border-t border-gray-50 pt-4 dark:border-white/5">
				<p className="text-xs font-medium text-gray-500 dark:text-gray-500">
					Posted on{" "}
					{new Date(review.date).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					})}
				</p>
			</div>
		</div>
	);
};
