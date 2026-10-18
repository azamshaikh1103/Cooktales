"use client";

import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { storyClient } from "@/lib/api/storyClient";
import { useAuth } from "@/lib/auth/AuthContext";

type Props = {
	storyId: string;
	initialLikes: number;
	initialViews: number;
	initialComments: number;
};

export default function StoryEngagement({
	storyId,
	initialLikes,
	initialViews,
	initialComments,
}: Props) {
	const { status } = useAuth();
	const router = useRouter();
	const [liked, setLiked] = useState(false);
	const [bookmarked, setBookmarked] = useState(false);
	const [likes, setLikes] = useState(initialLikes);
	const [views, setViews] = useState(initialViews);
	const [readingProgress, setReadingProgress] = useState(0);
	const viewed = useRef(false);

	useEffect(() => {
		if (status !== "authenticated") {
			setLiked(false);
			setBookmarked(false);
			return;
		}
		void storyClient
			.viewerState(storyId)
			.then((state) => {
				setLiked(state.liked);
				setBookmarked(state.bookmarked);
				setLikes(state.likes);
				setViews(state.views);
			})
			.catch(() => undefined);
	}, [status, storyId]);

	useEffect(() => {
		const key = `cooktale-story-view-${storyId}`;
		const lastViewed = Number(localStorage.getItem(key) || 0);
		if (Date.now() - lastViewed < 30 * 60 * 1000) return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const recordWhenReading = () => {
			if (viewed.current) return;
			const progress =
				(window.scrollY + window.innerHeight) /
				Math.max(document.body.scrollHeight, 1);
			if (progress < 0.4 || timer) return;
			timer = setTimeout(() => {
				void storyClient
					.recordView(storyId)
					.then(() => {
						viewed.current = true;
						setViews((current) => current + 1);
						localStorage.setItem(key, String(Date.now()));
					})
					.catch(() => undefined);
			}, 10_000);
		};
		window.addEventListener("scroll", recordWhenReading, { passive: true });
		recordWhenReading();
		return () => {
			window.removeEventListener("scroll", recordWhenReading);
			if (timer) clearTimeout(timer);
		};
	}, [storyId]);

	useEffect(() => {
		const updateProgress = () => {
			const scrollable =
				document.documentElement.scrollHeight - window.innerHeight;
			setReadingProgress(
				scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0,
			);
		};
		updateProgress();
		window.addEventListener("scroll", updateProgress, { passive: true });
		return () => window.removeEventListener("scroll", updateProgress);
	}, []);

	const requireAuth = () => {
		if (status === "authenticated") return true;
		router.push("/auth");
		return false;
	};

	const toggleLike = async () => {
		if (!requireAuth()) return;
		const nextLiked = !liked;
		setLiked(nextLiked);
		setLikes((current) => Math.max(0, current + (nextLiked ? 1 : -1)));
		try {
			const state = nextLiked
				? await storyClient.like(storyId)
				: await storyClient.unlike(storyId);
			setLiked(state.liked);
			setLikes(state.likes);
		} catch (error) {
			setLiked(!nextLiked);
			setLikes((current) => Math.max(0, current + (nextLiked ? -1 : 1)));
			toast.error(
				error instanceof Error ? error.message : "Could not update like",
			);
		}
	};

	const toggleBookmark = async () => {
		if (!requireAuth()) return;
		const nextBookmarked = !bookmarked;
		setBookmarked(nextBookmarked);
		try {
			const state = nextBookmarked
				? await storyClient.bookmark(storyId)
				: await storyClient.unbookmark(storyId);
			setBookmarked(state.bookmarked);
			toast.success(
				state.bookmarked
					? "Saved to your kitchen"
					: "Removed from saved stories",
			);
		} catch (error) {
			setBookmarked(!nextBookmarked);
			toast.error(
				error instanceof Error ? error.message : "Could not update saved story",
			);
		}
	};

	const share = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.success("Story link copied");
		} catch {
			toast.error("Could not copy the story link");
		}
	};

	return (
		<>
			<div
				aria-hidden="true"
				className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent"
			>
				<div
					className="h-full bg-[#00a884] transition-[width] duration-150"
					style={{ width: `${readingProgress}%` }}
				/>
			</div>
			<div className="my-8 flex flex-wrap items-center gap-2 border-y border-slate-200 py-4 dark:border-white/10">
				<button
					type="button"
					onClick={toggleLike}
					className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-200 dark:hover:bg-rose-400/10 dark:hover:text-rose-300"
					aria-pressed={liked}
				>
					<Heart className={liked ? "fill-current" : ""} size={18} /> {likes}
				</button>
				<button
					type="button"
					onClick={toggleBookmark}
					className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-[#006c5e] dark:text-slate-200 dark:hover:bg-emerald-400/10 dark:hover:text-[#4ade80]"
					aria-pressed={bookmarked}
				>
					<Bookmark className={bookmarked ? "fill-current" : ""} size={18} />{" "}
					Save
				</button>
				<a
					href="#story-comments"
					className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
				>
					<MessageCircle size={18} /> {initialComments}
				</a>
				<button
					type="button"
					onClick={share}
					className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
				>
					<Share2 size={18} /> Share
				</button>
				<span className="ml-auto hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
					{views.toLocaleString()} reads
				</span>
			</div>
		</>
	);
}
