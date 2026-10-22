"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { PrimaryActionLink } from "@/components/ui/PrimaryActionLink";

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
	const [direction, setDirection] = useState(1);
	const reduceMotion = useReducedMotion();
	const slide = slides[active];
	const changeSlide = (nextDirection: 1 | -1) => {
		setDirection(nextDirection);
		setActive(
			(current) => (current + nextDirection + slides.length) % slides.length,
		);
	};
	const previous = () => changeSlide(-1);
	const next = () => changeSlide(1);

	useEffect(() => {
		const timer = window.setInterval(next, 6000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<section className="bg-[#f7faf8] px-6 pt-24 pb-10 dark:bg-[#0d1f1c] lg:px-24 lg:pt-24 lg:pb-12">
			<div className="grid overflow-hidden rounded-3xl border border-[#006c5e]/20 bg-white dark:border-white/10 dark:bg-[#152a26] lg:min-h-[35rem] lg:grid-cols-[46%_54%]">
				<div className="relative order-first aspect-[54/46] bg-[#e2eee7] p-4 dark:bg-[#152a26] lg:order-last lg:aspect-auto lg:min-h-full lg:p-6">
					<div className="relative h-full overflow-hidden rounded-2xl">
						<Image
							src="/story-covers/weeknight-dinners.png"
							alt="Home cook preparing a weeknight dinner"
							fill
							priority
							sizes="(max-width: 1024px) 100vw, 50vw"
							className="object-cover"
						/>
					</div>
				</div>

				<div className="flex min-h-full flex-col px-8 py-10 lg:px-14 lg:py-14">
					<div>
						<div className="relative min-h-[22rem] overflow-hidden sm:min-h-[19rem] lg:min-h-64">
							<AnimatePresence
								initial={false}
								mode="popLayout"
								custom={direction}
							>
								<motion.div
									key={slide.title}
									custom={direction}
									initial={reduceMotion ? false : "enter"}
									animate="center"
									exit="exit"
									variants={{
										enter: (slideDirection: number) => ({
											x: slideDirection > 0 ? 44 : -44,
											opacity: 0,
										}),
										center: { x: 0, opacity: 1 },
										exit: (slideDirection: number) => ({
											x: slideDirection > 0 ? -44 : 44,
											opacity: 0,
										}),
									}}
									transition={
										reduceMotion
											? { duration: 0 }
											: { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
									}
									className="absolute inset-0 max-w-xl"
								>
									<p className="text-sm font-semibold text-[#006c5e] dark:text-[#4ade80]">
										{slide.kicker}
									</p>
									<h1 className="mt-4 text-4xl font-semibold leading-tight text-[#10231f] dark:text-white md:text-5xl">
										{slide.title}
									</h1>
									<p className="mt-5 text-base leading-7 text-[#465852] dark:text-white/70 md:text-lg">
										{slide.detail}
									</p>
								</motion.div>
							</AnimatePresence>
						</div>
						<PrimaryActionLink
							href="/recipe"
							variant="secondary"
							className="mt-6 h-10 px-4 py-0 lg:mt-7"
						>
							Explore recipes
						</PrimaryActionLink>
					</div>

					<div className="mt-8 flex items-center gap-3 lg:mt-auto lg:pt-8">
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
