"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FaArrowUp, FaCommentDots, FaPen, FaSearch } from "react-icons/fa";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { communityClient, type Discussion } from "@/lib/api/communityClient";
import { DISCUSSION_CATEGORIES } from "@/lib/community/discussionCategories";
import imageLoader from "@/lib/loader";

const CATEGORIES = ["All Topics", ...DISCUSSION_CATEGORIES];

export default function DiscussionsPage() {
	const router = useRouter();
	const [discussions, setDiscussions] = useState<Discussion[]>([]);
	const [activeCat, setActiveCat] = useState("All Topics");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);

	// Simple fetcher (Can be upgraded to infinite scroll like recipe page)
	const fetchData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await communityClient.listDiscussions({
				category: activeCat,
				search,
				limit: 20,
			});
			setDiscussions(res.discussions || []);
		} catch {
			setDiscussions([]);
		} finally {
			setLoading(false);
		}
	}, [activeCat, search]);

	// Debounce Search
	useEffect(() => {
		const timer = setTimeout(() => fetchData(), 500);
		return () => clearTimeout(timer);
	}, [fetchData]);

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />

			<main className="container mx-auto max-w-6xl px-6 pt-28 pb-20 lg:px-8">
				{/* --- HEADER --- */}
				<div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
					<div>
						<span className="mb-2 block text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
							The Forum
						</span>
						<h1 className="text-4xl font-black lg:text-6xl">Discussions</h1>
					</div>
					<PrimaryActionButton
						onClick={() => router.push("/community/discussion/create")}
						className="px-6 py-3"
					>
						<FaPen /> Start New Thread
					</PrimaryActionButton>
				</div>

				<div className="space-y-7">
					<div className="flex flex-col gap-4 border-y border-gray-200 py-5 dark:border-white/10 md:flex-row md:items-center md:justify-between">
						<div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
							{CATEGORIES.map((cat) => (
								<button
									key={cat}
									type="button"
									onClick={() => setActiveCat(cat)}
									aria-pressed={activeCat === cat}
									className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeCat === cat ? "bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-[#0d1f1c]" : "bg-white text-gray-600 hover:bg-[#f1f7f6] dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"}`}
								>
									{cat}
								</button>
							))}
						</div>
						<div className="relative w-full md:max-w-xs">
							<FaSearch className="absolute top-3.5 left-4 text-gray-400" />
							<input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search discussions"
								aria-label="Search discussions"
								className="w-full rounded-full border border-gray-200 bg-white py-3 pr-4 pl-10 text-sm font-medium outline-none transition-colors focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
							/>
						</div>
					</div>

					<div className="space-y-3">
						{loading ? (
							<div className="py-20 text-center text-gray-400">
								Loading discussions...
							</div>
						) : discussions.length === 0 ? (
							<div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 text-center text-gray-500 sm:min-h-[480px] dark:border-white/15 dark:text-gray-400">
								No discussions yet. Start the first conversation.
							</div>
						) : (
							discussions.map((thread) => (
								<Link
									href={`/community/discussion/${thread.slug}`}
									key={thread.id}
								>
									<div className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-[#006C5E]/35 hover:bg-[#f8fbfa] dark:border-white/10 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/35 dark:hover:bg-white/5">
										<div className="flex items-start gap-4">
											{/* Vote Box */}
											<div className="flex min-w-[46px] flex-col items-center gap-1 rounded-xl bg-[#f1f7f6] p-2 text-gray-400 dark:bg-white/5 dark:text-gray-500">
												<FaArrowUp />
												<span className="text-sm font-bold text-gray-900 dark:text-white">
													{thread._count.likes}
												</span>
											</div>
											<div className="flex-1">
												<div className="mb-2 flex items-center gap-3 text-xs font-bold">
													<span className="rounded-full bg-[#006C5E]/10 px-2.5 py-1 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
														{thread.category}
													</span>
													<span className="text-gray-400">
														• {new Date(thread.createdAt).toLocaleDateString()}
													</span>
												</div>
												<h3 className="mb-2 text-lg font-bold transition-colors group-hover:text-[#006C5E] lg:text-xl dark:group-hover:text-[#4ADE80]">
													{thread.title}
												</h3>
												<div className="mt-4 flex items-center justify-between">
													<div className="flex items-center gap-2">
														<Image
															src={thread.author.image || "/placeholder.png"}
															width={24}
															height={24}
															alt="User"
															className="rounded-full bg-gray-200"
															loader={imageLoader}
														/>
														<span className="text-sm font-bold text-gray-600 dark:text-gray-300">
															{thread.author.name}
														</span>
													</div>
													<div className="flex items-center gap-2 text-sm font-bold text-gray-400">
														<FaCommentDots /> {thread._count.comments} comments
													</div>
												</div>
											</div>
										</div>
									</div>
								</Link>
							))
						)}
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
