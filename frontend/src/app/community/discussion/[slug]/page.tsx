import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { communityClient } from "@/lib/api/communityClient";
import imageLoader from "@/lib/loader";
import CommentSection from "../CommentSection";
import RichContent from "../RichContent";
import { ThreadActions } from "../ThreadActions";
import { ThreadVote } from "../ThreadVote";

interface PageProps {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ bid?: string }>;
}

// A deleted thread must never be indexed or shown in search results.
export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const result = await communityClient.getDiscussion(slug).catch(() => null);
	if (result?.discussion.deleted) {
		return { robots: { index: false, follow: false } };
	}
	return {};
}

export default async function DiscussionPage({ params }: PageProps) {
	const { slug } = await params;
	const result = await communityClient.getDiscussion(slug).catch(() => null);

	if (!result) notFound();
	const { discussion, attachments } = result;
	const deleted = Boolean(discussion.deleted);

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />

			<main className="container mx-auto max-w-5xl px-6 pt-28 pb-20 lg:px-24">
				{/* Breadcrumbs */}
				<div className="mb-8 flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
					<span className="text-[#006C5E] dark:text-[#4ADE80]">Community</span>{" "}
					/ {discussion.category}
				</div>

				{/* --- MAIN POST --- */}
				<div className="mb-12 flex flex-col gap-5 md:flex-row md:gap-6">
					{/* Upvote: a pill above the post on phones, a rail beside it from md up */}
					{!deleted && (
						<div className="w-fit shrink-0 md:w-10">
							<ThreadVote
								discussionId={discussion.id}
								initialCount={discussion._count.likes}
							/>
						</div>
					)}

					<div className="flex-1">
						<h1
							className={`mb-6 text-3xl leading-tight font-black lg:text-4xl ${deleted ? "text-gray-400 dark:text-gray-500" : ""}`}
						>
							{discussion.title}
						</h1>

						<div className="mb-8 flex items-center gap-3 border-b border-gray-200 pb-8 dark:border-white/10">
							<div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200 dark:border-white/10">
								<Image
									src={discussion.author.image || "/placeholder.png"}
									fill
									alt=""
									loader={imageLoader}
									className="object-cover"
								/>
							</div>
							<div className="text-sm">
								<span className="mr-2 font-bold">
									{discussion.author.name}{" "}
									<VerifiedBadge verified={discussion.author.isVerifiedBadge} />
								</span>
								<span className="text-gray-500 dark:text-gray-400">
									{new Date(discussion.createdAt).toLocaleDateString()}
								</span>
							</div>
							<span className="rounded-full bg-[#006C5E]/10 px-3 py-1 text-xs font-bold text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
								{discussion.category}
							</span>
							{!deleted && (
								<ThreadActions
									discussionId={discussion.id}
									authorId={discussion.author.id}
								/>
							)}
						</div>

						{deleted ? (
							<p className="rounded-2xl bg-gray-100 px-5 py-4 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
								{discussion.removedBy === "moderator"
									? "This thread was removed by moderators."
									: "This thread was deleted by its author."}
							</p>
						) : (
							/* --- RICH CONTENT RENDERER --- */
							<div className="prose prose-lg dark:prose-invert max-w-none">
								<RichContent
									content={discussion.content}
									attachments={attachments}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Comments */}
				<CommentSection
					comments={discussion.comments}
					discussionId={discussion.id}
					locked={deleted}
				/>
			</main>
			<Footer />
		</div>
	);
}
