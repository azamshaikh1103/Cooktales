"use client";

import {
	Heart,
	LoaderCircle,
	MessageCircle,
	Pencil,
	Reply,
	Send,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type RecipeComment, recipeClient } from "@/lib/api/recipeClient";
import imageLoader from "@/lib/loader";

type RecipeCommentsProps = {
	recipeId: string;
	slug: string;
	userId?: string;
	isAuthenticated: boolean;
	onRequireAuth: () => void;
};

const COMMENT_LIMIT = 10;

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

function authorName(comment: RecipeComment) {
	return comment.author.name || comment.author.username || "CookTale member";
}

export default function RecipeComments({
	recipeId,
	slug,
	userId,
	isAuthenticated,
	onRequireAuth,
}: RecipeCommentsProps) {
	const [comments, setComments] = useState<RecipeComment[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [content, setContent] = useState("");
	const [replyTo, setReplyTo] = useState<RecipeComment | null>(null);
	const [editing, setEditing] = useState<RecipeComment | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(
		new Set(),
	);

	const loadComments = useCallback(
		async (nextPage = 1, append = false) => {
			setIsLoading(true);
			try {
				const result = await recipeClient.listComments(
					slug,
					nextPage,
					COMMENT_LIMIT,
				);
				setComments((current) =>
					append ? [...current, ...result.comments] : result.comments,
				);
				setTotal(result.total);
				setPage(result.page);
				setHasMore(result.hasMore);
				if (isAuthenticated) {
					const commentIds = result.comments.flatMap((comment) => [
						comment.id,
						...comment.replies.map((reply) => reply.id),
					]);
					const viewer = await recipeClient.commentViewerState(
						recipeId,
						commentIds,
					);
					setLikedCommentIds(new Set(viewer.likedCommentIds));
				} else {
					setLikedCommentIds(new Set());
				}
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Could not load comments",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated, recipeId, slug],
	);

	useEffect(() => {
		void loadComments();
	}, [loadComments]);

	const beginReply = (comment: RecipeComment) => {
		if (!isAuthenticated) return onRequireAuth();
		if (comment.status !== "VISIBLE") return;
		setEditing(null);
		setReplyTo(comment);
		setContent("");
	};

	const beginEdit = (comment: RecipeComment) => {
		setReplyTo(null);
		setEditing(comment);
		setContent(comment.content);
	};

	const cancelComposer = () => {
		setReplyTo(null);
		setEditing(null);
		setContent("");
	};

	const submit = async () => {
		const trimmed = content.trim();
		if (!isAuthenticated) return onRequireAuth();
		if (!trimmed) return toast.error("Write a comment first");
		if (trimmed.length > 2000)
			return toast.error("Comments can be up to 2,000 characters");

		setIsSaving(true);
		try {
			if (editing) {
				await recipeClient.updateComment(recipeId, editing.id, trimmed);
				toast.success("Comment updated");
			} else {
				await recipeClient.createComment(recipeId, {
					content: trimmed,
					...(replyTo ? { parentId: replyTo.id } : {}),
				});
				toast.success(replyTo ? "Reply posted" : "Comment posted");
			}
			cancelComposer();
			await loadComments();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not save comment",
			);
		} finally {
			setIsSaving(false);
		}
	};

	const remove = async (comment: RecipeComment) => {
		if (!window.confirm("Remove this comment? Replies will stay visible."))
			return;
		try {
			await recipeClient.deleteComment(recipeId, comment.id);
			toast.success("Comment removed");
			await loadComments();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not remove comment",
			);
		}
	};

	const toggleLike = async (comment: RecipeComment) => {
		if (!isAuthenticated) return onRequireAuth();
		if (comment.author.id === userId)
			return toast.error("You cannot like your own comment");
		const currentlyLiked = likedCommentIds.has(comment.id);
		try {
			const result = currentlyLiked
				? await recipeClient.unlikeComment(recipeId, comment.id)
				: await recipeClient.likeComment(recipeId, comment.id);
			setLikedCommentIds((current) => {
				const next = new Set(current);
				if (result.liked) next.add(comment.id);
				else next.delete(comment.id);
				return next;
			});
			setComments((current) =>
				current.map((item) => {
					const update = (target: RecipeComment) =>
						target.id === comment.id
							? {
									...target,
									_count: { ...target._count, likes: result.likes },
								}
							: target;
					return { ...update(item), replies: item.replies.map(update) };
				}),
			);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not update comment like",
			);
		}
	};

	const renderComment = (comment: RecipeComment, isReply = false) => {
		const isOwn = userId === comment.author.id;
		const removed = comment.status === "REMOVED";
		return (
			<article
				key={comment.id}
				className={
					isReply ? "border-l border-gray-200 pl-4 dark:border-white/10" : ""
				}
			>
				<div className="flex gap-3">
					<div className="relative mt-1 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
						{comment.author.image ? (
							<Image
								src={comment.author.image}
								alt=""
								fill
								loader={imageLoader}
								className="object-cover"
							/>
						) : (
							<span className="flex h-full items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-300">
								{authorName(comment).slice(0, 1).toUpperCase()}
							</span>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
							<span className="text-sm font-semibold text-gray-900 dark:text-white">
								{authorName(comment)}
							</span>
							<span className="text-xs text-gray-500 dark:text-gray-400">
								{relativeTime(comment.createdAt)}
							</span>
							{comment.editedAt && !removed ? (
								<span className="text-xs text-gray-500 dark:text-gray-400">
									edited
								</span>
							) : null}
						</div>
						<p
							className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${removed ? "italic text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-200"}`}
						>
							{comment.content}
						</p>
						{!removed ? (
							<div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
								{!isReply ? (
									<button
										type="button"
										onClick={() => beginReply(comment)}
										className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
									>
										<Reply size={14} /> Reply
									</button>
								) : null}
								<button
									type="button"
									onClick={() => void toggleLike(comment)}
									className={`inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80] ${likedCommentIds.has(comment.id) ? "text-[#006C5E] dark:text-[#4ADE80]" : ""}`}
								>
									<Heart
										size={14}
										fill={
											likedCommentIds.has(comment.id) ? "currentColor" : "none"
										}
									/>
									Helpful {comment._count.likes}
								</button>
								{isOwn ? (
									<>
										<button
											type="button"
											onClick={() => beginEdit(comment)}
											className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
										>
											<Pencil size={14} /> Edit
										</button>
										<button
											type="button"
											onClick={() => void remove(comment)}
											className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-red-600 dark:hover:text-red-400"
										>
											<Trash2 size={14} /> Remove
										</button>
									</>
								) : null}
							</div>
						) : null}
					</div>
				</div>
				{comment.replies.length ? (
					<div className="mt-5 space-y-5">
						{comment.replies.map((reply) => renderComment(reply, true))}
					</div>
				) : null}
			</article>
		);
	};

	return (
		<section className="mt-16 border-t border-gray-100 pt-10 dark:border-white/5">
			<div className="mb-6 flex items-center gap-3">
				<MessageCircle
					className="text-[#006C5E] dark:text-[#4ADE80]"
					size={24}
				/>
				<h4 className="text-2xl font-bold text-gray-900 dark:text-white">
					Comments
				</h4>
				<span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
					{total}
				</span>
			</div>

			<div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
				{replyTo ? (
					<p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
						Replying to {authorName(replyTo)}
					</p>
				) : null}
				{editing ? (
					<p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
						Editing your comment
					</p>
				) : null}
				<textarea
					value={content}
					onChange={(event) => setContent(event.target.value)}
					onFocus={() => !isAuthenticated && onRequireAuth()}
					maxLength={2000}
					placeholder={
						isAuthenticated
							? "Share a helpful thought about this recipe..."
							: "Sign in to join the conversation"
					}
					className="min-h-28 w-full resize-y bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
				/>
				<div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-white/10">
					<span className="text-xs text-gray-500 dark:text-gray-400">
						{content.length}/2000
					</span>
					<div className="flex items-center gap-2">
						{replyTo || editing ? (
							<button
								type="button"
								onClick={cancelComposer}
								className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
							>
								Cancel
							</button>
						) : null}
						<button
							type="button"
							disabled={isSaving}
							onClick={() => void submit()}
							className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#006C5E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
						>
							{isSaving ? (
								<LoaderCircle className="animate-spin" size={16} />
							) : (
								<Send size={16} />
							)}
							{editing ? "Save" : replyTo ? "Reply" : "Comment"}
						</button>
					</div>
				</div>
			</div>

			<div className="mt-8 space-y-7">
				{isLoading && !comments.length ? (
					<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
						<LoaderCircle className="animate-spin" size={16} /> Loading comments
					</div>
				) : null}
				{!isLoading && !comments.length ? (
					<p className="text-sm text-gray-500 dark:text-gray-400">
						No comments yet. Start the conversation.
					</p>
				) : null}
				{comments.map((comment) => renderComment(comment))}
			</div>

			{hasMore ? (
				<button
					type="button"
					disabled={isLoading}
					onClick={() => void loadComments(page + 1, true)}
					className="mt-7 cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#006C5E] hover:text-[#006C5E] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80] dark:hover:text-[#4ADE80]"
				>
					{isLoading ? "Loading..." : "Load more comments"}
				</button>
			) : null}
		</section>
	);
}
