import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import Footer from "@/components/Footer";
import Stepsarea from "@/components/homepage/Stepsarea";
import Navbar from "@/components/Navbar";
import imageLoader from "@/lib/loader";

export default function AboutUs() {
	return (
		<div className="flex min-h-screen flex-col overflow-x-hidden bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />
			<main>
				<section className="border-b border-gray-100 pt-28 pb-16 dark:border-white/5 lg:pt-40 lg:pb-24">
					<div className="grid w-full items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-24">
						<div>
							<p className="mb-6 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
								About CookTale
							</p>
							<h1 className="mb-7 max-w-xl text-5xl leading-[1.05] font-black lg:text-7xl">
								Recipes worth cooking. Stories worth sharing.
							</h1>
							<p className="max-w-xl text-lg leading-relaxed text-gray-500 lg:text-xl dark:text-gray-400">
								CookTale gives home cooks and food creators one clear place to
								discover recipes, publish what they make, and share the stories
								behind the food.
							</p>
							<Link
								href="/recipe"
								className="mt-9 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#006C5E] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#005a4f] dark:bg-[#4ADE80] dark:text-[#092019] dark:hover:bg-[#73e99d]"
							>
								Explore recipes <FaArrowRight />
							</Link>
						</div>

						<div className="relative mx-auto w-full max-w-md lg:justify-self-end">
							<div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-[#152a26]">
								<Image
									src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200&auto=format&fit=crop"
									alt="Fresh ingredients prepared for home cooking"
									fill
									className="object-cover"
									loader={imageLoader}
									sizes="(max-width: 1024px) 100vw, 40vw"
								/>
							</div>
							<div className="absolute -bottom-5 -left-4 max-w-[13rem] rounded-2xl border border-gray-100 bg-white p-5 shadow-lg dark:border-white/10 dark:bg-[#152a26]">
								<p className="text-2xl font-bold text-[#006C5E] dark:text-[#4ADE80]">
									70%
								</p>
								<p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
									Creator revenue target from eligible net advertising revenue.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section className="py-20 lg:py-28">
					<div className="grid w-full gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-24">
						<h2 className="text-3xl leading-tight font-black lg:text-5xl">
							Made for the way people actually cook.
						</h2>
						<div className="space-y-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
							<p>
								Recipes should be easy to read when your hands are busy.
								CookTale keeps the ingredients, method, and useful details clear
								and close at hand.
							</p>
							<p>
								For creators, it is a home for original recipes and kitchen
								stories without turning every page into a cluttered feed.
							</p>
						</div>
					</div>
				</section>

				<Stepsarea />

				<section className="py-20 lg:py-28">
					<div className="mx-auto max-w-7xl px-6 lg:px-24">
						<div className="rounded-[3rem] bg-[#006C5E] p-12 text-center text-white lg:p-20">
							<h2 className="mb-6 text-4xl font-black lg:text-6xl">
								Ready to share your table?
							</h2>
							<p className="mx-auto mb-10 max-w-xl text-lg text-white/80">
								Discover dishes from home cooks worldwide, or share your own
								favourite recipes with the CookTale community.
							</p>
							<div className="flex flex-col justify-center gap-3 sm:flex-row">
								<Link
									href="/recipe"
									className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-white px-8 py-4 font-bold text-[#006C5E] transition-colors hover:bg-gray-100"
								>
									Browse recipes <FaArrowRight />
								</Link>
								<Link
									href="/new-recipe"
									className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/40 px-8 py-4 font-bold text-white transition-colors hover:bg-white/10"
								>
									Start writing
								</Link>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
