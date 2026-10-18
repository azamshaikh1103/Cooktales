"use client";

import Image from "next/image";
import Link from "next/link";
import { GiCookingPot, GiChefToque } from "react-icons/gi";
import { IoSearch, IoArrowForward } from "react-icons/io5";
import { MdRestaurantMenu } from "react-icons/md";
import imageLoader from "@/lib/loader";

const Stepsarea = () => {
	return (
		<section className="relative overflow-hidden bg-[#fafafa] py-10 transition-colors duration-500 lg:py-12 dark:bg-[#0d1f1c]">
			{/* 1. Grid Pattern */}
			<Image
				src="https://res.cloudinary.com/dtlfdwhnm/image/upload/v1762243652/grid-png-43559_rd7kgx.png"
				width={400}
				height={400}
				alt=""
				className="pointer-events-none absolute -top-20 -left-20 rotate-12 opacity-[0.03] dark:opacity-[0.02]"
				loader={imageLoader}
			/>

			{/* 2. Giant Watermark */}
			<div className="pointer-events-none absolute top-10 right-0 -z-10 translate-x-1/3 opacity-[0.03] select-none dark:opacity-[0.02]">
				<span className="text-[15rem] leading-none font-black tracking-tighter text-gray-900 dark:text-white">
					PROCESS
				</span>
			</div>

			<div className="relative z-10 w-full px-6 lg:px-24">
				{/* --- HEADER --- */}
				<div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
					<div>
						<span className="mb-2 block text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
							How it Works
						</span>
						<h2 className="text-2xl leading-tight font-extrabold tracking-tight text-gray-900 lg:text-4xl dark:text-white">
							From Craving to{" "}
							<span className="text-[#006C5E] dark:text-[#4ADE80]">
								Creation.
							</span>
						</h2>
					</div>
					<p className="max-w-md text-sm leading-relaxed font-medium text-gray-500 lg:text-sm dark:text-gray-500">
						We've simplified the journey. Stop guessing ingredients and start
						cooking like a maestro in three simple steps.
					</p>
				</div>

				{/* --- BENTO GRID LAYOUT --- */}
				<div className="grid h-auto grid-cols-1 gap-6 lg:h-[550px] lg:grid-cols-12">
					{/* === STEP 01: DISCOVERY (Tall Card) === */}
					<div className="group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/50 transition-colors duration-300 lg:col-span-5 lg:p-12 dark:border-white/5 dark:bg-[#152a26] dark:shadow-none dark:hover:border-[#4ADE80]/30">
						{/* Giant Number Background */}
						<span className="absolute -top-8 -right-4 text-[12rem] font-black text-gray-50 opacity-50 dark:text-white/5">
							1
						</span>

						<div className="relative z-10">
							<div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#006C5E]/5 transition-colors duration-300 group-hover:bg-[#006C5E] dark:bg-[#4ADE80]/10 dark:group-hover:bg-[#4ADE80]">
								<IoSearch className="text-3xl text-[#006C5E] transition-colors group-hover:text-white dark:text-[#4ADE80] dark:group-hover:text-[#0d1f1c]" />
							</div>

							<h3 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
								Find your <br />
								Inspiration
							</h3>
							<p className="mb-8 leading-relaxed text-gray-500 dark:text-gray-500">
								Filter by what's in your fridge, your diet goals, or your mood.
								Our smart search finds the perfect match instantly.
							</p>
						</div>

						{/* Mock Search UI Element */}
						<div className="relative z-10 flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-white/10 dark:bg-black/20">
							<IoSearch className="text-gray-500 dark:text-gray-500" />
							<div className="h-2 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10"></div>
							<div className="ml-auto rounded-lg bg-white px-3 py-1 text-[10px] font-bold text-[#006C5E] shadow-sm dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
								Healthy
							</div>
						</div>
					</div>

					{/* === RIGHT COLUMN (Stacked Steps) === */}
					<div className="flex flex-col gap-6 lg:col-span-7">
						{/* === STEP 02: COOKING (The Brand Card) === */}
						<div className="group relative flex flex-1 items-center overflow-hidden rounded-[2.5rem] border border-[#00a878]/30 bg-linear-to-br from-[#006C5E] to-[#004d41] p-8 shadow-lg transition-all duration-300 hover:shadow-xl lg:px-10 lg:py-8">
							{/* Abstract Pattern Overlay */}
							<div
								className="absolute inset-0 opacity-10"
								style={{
									backgroundImage:
										"radial-gradient(circle, white 1px, transparent 1px)",
									backgroundSize: "20px 20px",
								}}
							/>

							<div className="relative z-10 flex w-full flex-col items-start gap-6 md:flex-row md:items-center">
								<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/20 backdrop-blur-sm">
									<GiChefToque className="text-2xl text-white" />
								</div>

								<div className="flex-1">
									<div className="mb-2 flex items-center justify-between">
										<h3 className="text-2xl font-bold text-white">
											Master the Kitchen
										</h3>
										<span className="text-4xl font-black text-white/20">
											02
										</span>
									</div>
									<p className="max-w-md text-sm leading-relaxed text-green-50/90">
										Clear, step-by-step instructions with built-in timers. No
										more burnt garlic. No more guessing.
									</p>
								</div>

								{/* Arrow Action */}
								<div className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-[#006C5E] md:flex">
									<IoArrowForward />
								</div>
							</div>
						</div>

						{/* === STEP 03: ENJOY (The Visual Card) === */}
						<div className="group relative flex-1 overflow-hidden rounded-[2.5rem] bg-gray-900 shadow-lg dark:border dark:border-white/10 dark:bg-black">
							{/* Background Image */}
							<Image
								src="https://res.cloudinary.com/dtlfdwhnm/image/upload/v1762294545/gray-abstract-background_b1mxpl.jpg"
								alt="Delicious Food"
								fill
								className="object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-40"
								loader={imageLoader}
							/>

							<div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />

							<div className="relative z-10 flex h-full flex-col justify-end p-8 lg:px-10 lg:py-8">
								<div className="flex items-end justify-between">
									<div>
										<div className="mb-2 flex items-center gap-3">
											<div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
												<MdRestaurantMenu />
											</div>
											<span className="text-xs font-bold tracking-wider text-amber-400 uppercase">
												The Best Part
											</span>
										</div>
										<h3 className="mb-1 text-2xl font-bold text-white">
											Savor & Share
										</h3>
										<p className="max-w-sm text-sm text-gray-300">
											Plate it up, take a snap, and brag about it. You earned
											it.
										</p>
									</div>
									<span className="-mr-4 -mb-4 text-6xl font-black text-white/10">
										03
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Stepsarea;
