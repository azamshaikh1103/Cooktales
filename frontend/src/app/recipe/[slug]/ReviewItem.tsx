'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaStar, FaThumbsUp, FaThumbsDown, FaReply, FaPen, FaTrash } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { toast } from 'sonner';
import { recipeClient, type RecipeReview } from '@/lib/api/recipeClient';
import imageLoader from '@/lib/loader';
import { useRouter } from 'next/navigation';

export default function ReviewItem({
  review,
  recipeId,
  isRecipeAuthor,
  isOwnReview,
  onEdit,
  onDeleted,
}: {
  review: RecipeReview;
  recipeId: string;
  isRecipeAuthor: boolean;
  isOwnReview: boolean;
  onEdit: (review: RecipeReview) => void;
  onDeleted: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [votes, setVotes] = useState({ UP: review.upvotes, DOWN: review.downvotes });
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Optimistic Voting
  const handleVote = async (type: 'UP' | 'DOWN') => {
    try {
      const result = await recipeClient.voteOnReview(recipeId, review.id, type);
      setVotes({ UP: result.upvotes, DOWN: result.downvotes });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update vote');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await recipeClient.deleteReview(recipeId, review.id);
      toast.success('Review removed');
      await onDeleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove review');
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const reply = new FormData(e.currentTarget).get('reply');
    try {
      await recipeClient.replyToReview(recipeId, review.id, String(reply || ''));
      toast.success('Reply posted!');
      setShowReplyBox(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-4xl border border-gray-100 bg-gray-50 p-6 lg:p-8 dark:border-white/5 dark:bg-white/5">
      {/* Review Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
            {review.user.image ? (
              <Image
                src={review.user.image}
                fill
                alt=""
                loader={imageLoader}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg">👤</div>
            )}
          </div>
          <div>
            <h5 className="text-sm font-bold text-gray-900 dark:text-white">
              {review.user.name || review.user.username || 'CookTale member'}
            </h5>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              {review.editedAt && <span>Edited</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-0.5 rounded-lg border border-gray-100 bg-white px-2 py-1 shadow-sm dark:border-white/5 dark:bg-black/20">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar
              key={star}
              className={`text-xs ${star <= (review.stars || 0) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
            />
          ))}
        </div>
      </div>

      {/* Review Text */}
      <p className="mb-6 leading-relaxed text-gray-600 dark:text-gray-300">{review.text}</p>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-400 dark:text-gray-500">
        <button
          type="button"
          onClick={() => handleVote('UP')}
          className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
        >
          <FaThumbsUp /> {votes.UP}
        </button>
        <button
          type="button"
          onClick={() => handleVote('DOWN')}
          className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-red-500"
        >
          <FaThumbsDown /> {votes.DOWN}
        </button>

        {/* Reply Button (Only visible to Chef) */}
        {isRecipeAuthor && !review.authorReply && (
          <button
            type="button"
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="ml-auto flex cursor-pointer items-center gap-1.5 text-[#006C5E] hover:underline dark:text-[#4ADE80]"
          >
            <FaReply /> Reply as Chef
          </button>
        )}
        {isOwnReview && (
          <>
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]"
            >
              <FaPen /> Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex cursor-pointer items-center gap-1.5 transition-colors hover:text-red-500"
            >
              <FaTrash /> Remove
            </button>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
          <span>Remove this review?</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirmDelete(false)} className="cursor-pointer px-2 py-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="cursor-pointer rounded-md bg-red-600 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {/* --- CHEF REPLY --- */}
      {review.authorReply && (
        <div className="mt-6 border-l-4 border-[#006C5E] pl-6 dark:border-[#4ADE80]">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-black tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
              <MdVerified /> Chef's Note
            </span>
            <span className="text-[10px] text-gray-400">
              {review.authorReplyAt ? new Date(review.authorReplyAt).toLocaleDateString() : ''}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {review.authorReply}
          </p>
        </div>
      )}

      {/* --- REPLY INPUT (Hidden by default) --- */}
      {showReplyBox && (
        <form onSubmit={handleReplySubmit} className="animate-in slide-in-from-top-2 mt-6">
          <textarea
            name="reply"
            placeholder="Thank them or answer their question..."
            className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-black/20 dark:text-white"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowReplyBox(false)}
              className="cursor-pointer text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-lg bg-[#006C5E] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#005a4e] disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
