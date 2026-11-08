"use client";

import { ArrowBigUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { setTab } from "@/lib/Slices/tabSlice";

export type VoteState = { likes: number; liked: boolean };

type UpvoteProps = {
	/** `thread` is a pill on small screens and a vertical rail from md up; `comment` is compact. */
	variant: "thread" | "comment";
	/** What is being voted on, for screen readers: "thread" or "response". */
	label: string;
	initialCount: number;
	initialLiked?: boolean;
	like: () => Promise<VoteState>;
	unlike: () => Promise<VoteState>;
	/** Fetches the signed-in reader's own vote (pages are cached and anonymous). */
	loadState?: () => Promise<VoteState>;
};

/**
 * One upvote per account, available to everyone signed in, including the author. It can be taken
 * back. The count updates instantly and rolls back if the request fails.
 */
export function Upvote({
	variant,
	label,
	initialCount,
	initialLiked = false,
	like,
	unlike,
	loadState,
}: UpvoteProps) {
	const { status } = useAuth();
	const dispatch = useDispatch();
	const [count, setCount] = useState(initialCount);
	const [liked, setLiked] = useState(initialLiked);
	const [busy, setBusy] = useState(false);
	const loadStateRef = useRef(loadState);
	loadStateRef.current = loadState;

	useEffect(() => setLiked(initialLiked), [initialLiked]);

	useEffect(() => {
		if (status !== "authenticated") {
			if (status === "unauthenticated") setLiked(false);
			return;
		}
		const fetchState = loadStateRef.current;
		if (!fetchState) return;
		let cancelled = false;
		fetchState()
			.then((state) => {
				if (cancelled) return;
				setLiked(state.liked);
				setCount(state.likes);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [status]);

	const toggle = async () => {
		if (status === "unauthenticated") {
			dispatch(setTab("login"));
			return;
		}
		if (status !== "authenticated" || busy) return;

		const next = !liked;
		setBusy(true);
		setLiked(next);
		setCount((current) => Math.max(0, current + (next ? 1 : -1)));
		try {
			const state = await (next ? like() : unlike());
			setLiked(state.liked);
			setCount(state.likes);
		} catch (error) {
			setLiked(!next);
			setCount((current) => Math.max(0, current + (next ? -1 : 1)));
			toast.error(
				error instanceof Error ? error.message : "Could not save your vote",
			);
		} finally {
			setBusy(false);
		}
	};

	const active = "text-[#006C5E] dark:text-[#4ADE80]";
	const idle =
		"text-gray-500 hover:text-[#006C5E] dark:text-gray-400 dark:hover:text-[#4ADE80]";
	const accessibleName = liked
		? `Remove your upvote from this ${label}`
		: `Upvote this ${label}`;

	if (variant === "comment") {
		return (
			<button
				type="button"
				onClick={toggle}
				aria-pressed={liked}
				aria-label={accessibleName}
				className={`flex cursor-pointer items-center gap-1 text-xs font-bold tabular-nums transition-colors ${liked ? active : idle}`}
			>
				<ArrowBigUp size={18} fill={liked ? "currentColor" : "none"} />
				{count.toLocaleString()}
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={toggle}
			aria-pressed={liked}
			aria-label={accessibleName}
			className={`flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-base font-black tabular-nums transition-colors hover:bg-gray-100 md:w-10 md:flex-col md:gap-1 md:border-0 md:px-0 md:py-0 md:text-lg md:hover:bg-transparent dark:border-white/15 dark:hover:bg-white/10 ${liked ? active : idle}`}
		>
			<span className="flex items-center justify-center rounded-full md:h-10 md:w-10 md:hover:bg-gray-100 dark:md:hover:bg-white/10">
				<ArrowBigUp size={22} fill={liked ? "currentColor" : "none"} />
			</span>
			{count.toLocaleString()}
		</button>
	);
}
