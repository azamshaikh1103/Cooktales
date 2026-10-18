"use client";

import { LoaderCircle, Reply, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type StoryComment, storyClient } from "@/lib/api/storyClient";
import { useAuth } from "@/lib/auth/AuthContext";

const MAX_COMMENT_LENGTH = 2000;

function displayName(comment: StoryComment) {
	return comment.author.name || comment.author.username || "CookTale member";
}

function relativeTime(value: string) {
	const seconds = Math.max(
		1,
		Math.floor((Date.now() - new Date(value).getTime()) / 1000),
	);
	if (seconds < 60) return "just now";
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	return `${Math.floor(seconds / 86400)}d ago`;
}

export default function StoryComments({ storyId }: { storyId: string }) {
	const { status, user } = useAuth();
	const router = useRouter();
	const [comments, setComments] = useState<StoryComment[]>([]);
	const [content, setContent] = useState("");
	const [replyTo, setReplyTo] = useState<StoryComment | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const result = await storyClient.listComments(storyId);
			setComments(result.comments);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not load comments",
			);
		} finally {
			setLoading(false);
		}
	}, [storyId]);

	useEffect(() => {
		void load();
	}, [load]);

	const requireAuth = () => {
		if (status === "authenticated") return true;
		toast.error("Log in to join the conversation");
		router.push("/auth");
		return false;
	};

	const submit = async () => {
		const trimmed = content.trim();
		if (!requireAuth()) return;
		if (!trimmed) return toast.error("Write a comment first");
		setSaving(true);
		try {
			await storyClient.createComment(storyId, {
				content: trimmed,
				...(replyTo ? { parentId: replyTo.id } : {}),
			});
			setContent("");
			setReplyTo(null);
			toast.success(replyTo ? "Reply posted" : "Comment posted");
			await load();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not post comment",
			);
		} finally {
			setSaving(false);
		}
	};

	const remove = async (comment: StoryComment) => {
		if (!window.confirm("Remove this comment?")) return;
		try {
			await storyClient.deleteComment(storyId, comment.id);
			toast.success("Comment removed");
			await load();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not remove comment",
			);
		}
	};

	const renderComment = (comment: StoryComment, reply = false) => {
		const ownComment = user?.id === comment.author.id;
		return (
			<article
				key={comment.id}
				className={
					reply ? "border-l border-slate-200 pl-4 dark:border-white/10" : ""
				}
			>
				<div className="flex gap-3">
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#006c5e]/10 text-xs font-bold text-[#006c5e] dark:bg-[#4ade80]/10 dark:text-[#4ade80]">
						{displayName(comment).slice(0, 1).toUpperCase()}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-baseline gap-x-2">
							<span className="text-sm font-semibold text-slate-900 dark:text-white">
								{displayName(comment)}
							</span>
							<span className="text-xs text-slate-500 dark:text-slate-400">
								{relativeTime(comment.createdAt)}
							</span>
						</div>
						<p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
							{comment.content}
						</p>
						<div className="mt-2 flex items-center gap-3">
							{!reply && (
								<button
									type="button"
									onClick={() => {
										if (!requireAuth()) return;
										setReplyTo(comment);
										setContent("");
									}}
									className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#006c5e] dark:text-slate-400 dark:hover:text-[#4ade80]"
								>
									<Reply size={14} /> Reply
								</button>
							)}
							{ownComment && (
								<button
									type="button"
									onClick={() => void remove(comment)}
									className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-300"
								>
									<Trash2 size={14} /> Remove
								</button>
							)}
						</div>
					</div>
				</div>
				{comment.replies?.length > 0 && (
					<div className="mt-4 space-y-4 pl-6">
						{comment.replies.map((item) => renderComment(item, true))}
					</div>
				)}
			</article>
		);
	};

	return (
		<section
			id="story-comments"
			className="mx-auto mt-16 max-w-3xl border-t border-slate-200 pt-12 dark:border-white/10"
		>
			<h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
				Conversation
			</h2>
			<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
				Share a thought, a memory, or a useful tip.
			</p>
			<div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-white/10">
				{replyTo && (
					<div className="mb-3 flex items-center justify-between rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
						<span>Replying to {displayName(replyTo)}</span>
						<button
							type="button"
							onClick={() => setReplyTo(null)}
							className="cursor-pointer font-semibold hover:text-slate-900 dark:hover:text-white"
						>
							Cancel
						</button>
					</div>
				)}
				<textarea
					value={content}
					onFocus={requireAuth}
					onChange={(event) => setContent(event.target.value)}
					maxLength={MAX_COMMENT_LENGTH}
					placeholder="Add to the conversation..."
					className="min-h-28 w-full resize-y bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
				/>
				<div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-3 dark:border-white/10">
					<span className="text-xs text-slate-500 dark:text-slate-400">
						{content.length}/{MAX_COMMENT_LENGTH}
					</span>
					<button
						type="button"
						disabled={saving}
						onClick={() => void submit()}
						className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#006c5e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00564b] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ade80] dark:text-[#08201b] dark:hover:bg-[#35cc69]"
					>
						{saving ? (
							<LoaderCircle className="animate-spin" size={16} />
						) : (
							<Send size={16} />
						)}{" "}
						Post comment
					</button>
				</div>
			</div>
			{loading ? (
				<div className="mt-8 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
					<LoaderCircle className="animate-spin" size={17} /> Loading
					conversation
				</div>
			) : comments.length ? (
				<div className="mt-8 space-y-7">
					{comments.map((comment) => renderComment(comment))}
				</div>
			) : (
				<p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
					No comments yet. Start the conversation.
				</p>
			)}
		</section>
	);
}
