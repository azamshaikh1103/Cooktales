"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
	{
		kicker: "CookTale recipes",
		title: "Recipes worth making again.",
		detail:
			"Clear ingredients, practical steps, and cooking ideas from people who cook at home.",
	},
	{
		kicker: "Cook with confidence",
		title: "Good food starts with clear steps.",
		detail:
			"Use timings, servings, reviews, and Cook Mode when you are in the kitchen.",
	},
	{
		kicker: "Share your kitchen",
		title: "Keep the recipes that worked.",
		detail:
			"Save a dish for later, write a review, or share a recipe or Story with the community.",
	},
];

export default function Heroarea() {
	const [active, setActive] = useState(0);
	const slide = slides[active];
	const previous = () =>
		setActive((current) => (current - 1 + slides.length) % slides.length);
	const next = () => setActive((current) => (current + 1) % slides.length);

	useEffect(() => {
		const timer = window.setInterval(next, 6000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<section className="bg-[#f7faf8] px-6 pt-24 pb-10 dark:bg-[#081b18] lg:px-24 lg:pt-24 lg:pb-12">
			<div className="grid min-h-[35rem] overflow-hidden rounded-4xl border border-[#006c5e]/20 bg-[#edf5f0] dark:border-white/10 dark:bg-[#0c211d] lg:grid-cols-2">
				<div className="relative order-first min-h-72 lg:order-last lg:min-h-full">
					<Image
						src="/Pizza_yalehb_png.webp"
						alt="Fresh pizza from CookTale"
						fill
						priority
						sizes="(max-width: 1024px) 100vw, 50vw"
						className="object-cover"
					/>
				</div>

				<div className="flex flex-col justify-between px-8 py-10 lg:px-14 lg:py-14">
					<div className="max-w-xl">
						<p className="text-sm font-semibold text-[#006c5e] dark:text-[#4ade80]">
							{slide.kicker}
						</p>
						<h1 className="mt-4 text-4xl font-semibold leading-tight text-[#10231f] dark:text-white md:text-5xl">
							{slide.title}
						</h1>
						<p className="mt-5 text-base leading-7 text-[#465852] dark:text-white/70 md:text-lg">
							{slide.detail}
						</p>
						<Link
							href="/recipe"
							className="mt-7 inline-flex cursor-pointer rounded-md bg-[#006c5e] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#00554a] dark:bg-[#4ade80] dark:text-[#08201b] dark:hover:bg-[#35cc69]"
						>
							Explore recipes
						</Link>
					</div>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={previous}
							aria-label="Previous slide"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#006c5e]/30 text-[#006c5e] transition-colors hover:bg-[#006c5e]/10 dark:border-white/25 dark:text-white dark:hover:border-white dark:hover:bg-white/10"
						>
							<ChevronLeft size={19} />
						</button>
						<div
							className="flex gap-1.5"
							aria-label={`Slide ${active + 1} of ${slides.length}`}
						>
							{slides.map((item, index) => (
								<span
									key={item.title}
									className={`h-1.5 rounded-full ${
										index === active
											? "w-6 bg-[#006c5e] dark:bg-[#4ade80]"
											: "w-1.5 bg-[#006c5e]/25 dark:bg-white/30"
									}`}
								/>
							))}
						</div>
						<button
							type="button"
							onClick={next}
							aria-label="Next slide"
							className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#006c5e]/30 text-[#006c5e] transition-colors hover:bg-[#006c5e]/10 dark:border-white/25 dark:text-white dark:hover:border-white dark:hover:bg-white/10"
						>
							<ChevronRight size={19} />
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
