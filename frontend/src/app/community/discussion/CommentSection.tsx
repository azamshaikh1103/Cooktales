"use client";

import { Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaFlag } from "react-icons/fa";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import VerifiedBadge from "@/components/VerifiedBadge";
import { communityClient } from "@/lib/api/communityClient";
import { useAuth } from "@/lib/auth/AuthContext";
import imageLoader from "@/lib/loader";
import { Upvote } from "./Upvote";

// Matches the API limit (CreateCommentDto): markdown markers count too.
const COMMENT_MAX = 2000;

// A deleted comment that still has replies stays as a placeholder, so only live ones are counted.
const countLive = (comments: { deleted?: boolean; replies?: unknown[] }[]) =>
	comments.reduce(
		(total, comment) =>
			total + (comment.deleted ? 0 : 1) + (comment.replies?.length ?? 0),
		0,
	);

export default function CommentSection({
	comments,
	discussionId,
	locked = false,
}: any) {
	const responses = countLive(comments);

	return (
		<div className="border-t border-gray-200 pt-10 dark:border-white/10">
			<h3 className="mb-8 text-2xl font-bold">
				{responses} {responses === 1 ? "Response" : "Responses"}
			</h3>

			{/* Main Input */}
			{locked ? (
				<p className="rounded-2xl bg-gray-100 px-5 py-4 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
					Responses are closed because this thread was deleted.
				</p>
			) : (
				<CommentInput discussionId={discussionId} />
			)}

			{/* Comment List */}
			<div className="mt-12 space-y-8">
				{comments.map((comment: any) => (
					<div key={comment.id}>
						{/* Parent Comment */}
						<CommentItem
							comment={comment}
							discussionId={discussionId}
							locked={locked}
						/>

						{/* Children (Replies) */}
						{comment.replies && comment.replies.length > 0 && (
							<div className="mt-4 ml-4 space-y-4 border-l-2 border-gray-100 pl-4 md:ml-12 dark:border-white/5">
								{comment.replies.map((reply: any) => (
									<CommentItem
										key={reply.id}
										comment={reply}
										discussionId={discussionId}
										locked={locked}
										isReply
									/>
								))}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

// --- SUB COMPONENTS ---

const CommentItem = ({ comment, discussionId, isReply, locked }: any) => {
	const router = useRouter();
	const { user } = useAuth();
	const [isReplying, setIsReplying] = useState(false);
	const [confirming, setConfirming] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const isOwn = Boolean(user && user.id === comment.author?.id);
	const canDelete = Boolean(user && (isOwn || user.role === "ADMIN"));

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await communityClient.deleteComment(comment.id);
			toast.success("Response deleted");
			setConfirming(false);
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Could not delete this response",
			);
		} finally {
			setDeleting(false);
		}
	};

	// Kept only so the replies below it keep their context.
	if (comment.deleted) {
		return (
			<div className={`flex gap-4 ${isReply ? "opacity-90" : ""}`}>
				<div
					className={`shrink-0 rounded-full bg-gray-100 dark:bg-white/10 ${isReply ? "h-8 w-8" : "h-10 w-10"}`}
				/>
				<p className="pt-2 text-sm text-gray-400 italic dark:text-gray-500">
					[deleted]
				</p>
			</div>
		);
	}

	return (
		<div className={`group flex gap-4 ${isReply ? "opacity-90" : ""}`}>
			{/* Avatar */}
			<div
				className={`relative shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10 ${isReply ? "h-8 w-8" : "h-10 w-10"}`}
			>
				<Image
					src={comment.author.image || "/placeholder.png"}
					fill
					alt={comment.author.name}
					loader={imageLoader}
					className="object-cover"
				/>
			</div>

			<div className="flex-1">
				{/* Header */}
				<div className="mb-1 flex items-center gap-2">
					<span className="text-sm font-bold text-gray-900 dark:text-white">
						{comment.author.name}
					</span>
					<VerifiedBadge verified={comment.author.isVerifiedBadge} />
					<span className="text-xs text-gray-400">
						• {new Date(comment.createdAt).toLocaleDateString()}
					</span>
				</div>

				{/* Body */}
				<div className="mb-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
					<MarkdownText
						text={comment.content}
						variant="light"
						spacing="tight"
						keyPrefix={`comment-${comment.id}`}
					/>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500">
					{!locked && (
						<Upvote
							variant="comment"
							label="response"
							initialCount={comment.likes.length}
							initialLiked={Boolean(
								user &&
									comment.likes.some(
										(like: { userId: string }) => like.userId === user.id,
									),
							)}
							like={() => communityClient.likeComment(comment.id)}
							unlike={() => communityClient.unlikeComment(comment.id)}
						/>
					)}

					{/* Only show reply button on Top Level comments to force 2-tier structure */}
					{!isReply && !locked && (
						<button
							type="button"
							onClick={() => setIsReplying(!isReplying)}
							className="transition-colors hover:text-gray-900 dark:hover:text-white"
						>
							Reply
						</button>
					)}

					{canDelete && (
						<button
							type="button"
							onClick={() => setConfirming(true)}
							className="flex items-center gap-1 transition-colors hover:text-red-600 dark:hover:text-red-400"
						>
							<Trash2 size={14} />
							Delete
						</button>
					)}

					<button
						type="button"
						className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
					>
						<FaFlag />
					</button>
				</div>

				{/* Reply Input (Conditional) */}
				{isReplying && (
					<div className="animate-in slide-in-from-top-2 mt-4">
						<CommentInput
							discussionId={discussionId}
							parentId={comment.id}
							onSuccess={() => setIsReplying(false)}
						/>
					</div>
				)}
			</div>

			<ConfirmDialog
				open={confirming}
				busy={deleting}
				title="Delete this response?"
				description={
					isOwn
						? "Your response is removed for good. If people replied to it, a [deleted] note stays so their replies keep their context. This can't be undone."
						: "This removes the response for everyone as a moderator action."
				}
				confirmLabel="Delete response"
				onConfirm={handleDelete}
				onCancel={() => setConfirming(false)}
			/>
		</div>
	);
};

const CommentInput = ({ discussionId, parentId, onSuccess }: any) => {
	const router = useRouter();
	const { status } = useAuth();
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!text.trim()) return;
		setLoading(true);

		try {
			if (status !== "authenticated") {
				toast.error("Sign in to join the discussion.");
				return;
			}
			await communityClient.createComment(discussionId, {
				content: text,
				...(parentId ? { parentId } : {}),
			});
			setText("");
			toast.success("Comment posted!");
			if (onSuccess) onSuccess();
			router.refresh();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to post.");
		} finally {
			setLoading(false);
		}
	};

	const overLimit = text.length > COMMENT_MAX;
	const canPost = Boolean(text.trim()) && !overLimit && !loading;

	return (
		<div className="space-y-3">
			<RichTextEditor
				variant="light"
				size="compact"
				ariaLabel={parentId ? "Your reply" : "Your response"}
				value={text}
				maxLength={COMMENT_MAX}
				onChange={setText}
				onSubmit={() => {
					if (canPost) void handleSubmit();
				}}
				placeholder={parentId ? "Write a reply..." : "Add to the discussion..."}
			/>
			<div className="flex items-center justify-end gap-2">
				{parentId && (
					<button
						type="button"
						onClick={onSuccess}
						className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
					>
						Cancel
					</button>
				)}
				<PrimaryActionButton
					type="button"
					onClick={handleSubmit}
					disabled={!canPost}
					className="px-5 py-1.5"
				>
					{loading ? "Posting..." : "Post"}
				</PrimaryActionButton>
			</div>
		</div>
	);
};
