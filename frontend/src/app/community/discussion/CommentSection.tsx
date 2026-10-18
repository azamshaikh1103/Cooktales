'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaReply, FaArrowUp, FaFlag } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import imageLoader from '@/lib/loader';
import { communityClient } from '@/lib/api/communityClient';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from 'sonner';

export default function CommentSection({ comments, discussionId }: any) {
  return (
    <div className="border-t border-gray-200 pt-10 dark:border-white/10">
      <h3 className="mb-8 text-2xl font-bold">{comments.length} Responses</h3>

      {/* Main Input */}
      <CommentInput discussionId={discussionId} />

      {/* Comment List */}
      <div className="mt-12 space-y-8">
        {comments.map((comment: any) => (
          <div key={comment.id}>
            {/* Parent Comment */}
            <CommentItem comment={comment} discussionId={discussionId} />

            {/* Children (Replies) */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 ml-4 space-y-4 border-l-2 border-gray-100 pl-4 md:ml-12 dark:border-white/5">
                {comment.replies.map((reply: any) => (
                  <CommentItem key={reply.id} comment={reply} discussionId={discussionId} isReply />
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

const CommentItem = ({ comment, discussionId, isReply }: any) => {
  const [isReplying, setIsReplying] = useState(false);

  return (
    <div className={`group flex gap-4 ${isReply ? 'opacity-90' : ''}`}>
      {/* Avatar */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10 ${isReply ? 'h-8 w-8' : 'h-10 w-10'}`}
      >
        <Image
          src={comment.author.image || '/placeholder.png'}
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
          {comment.author.isPro && (
            <MdVerified className="text-xs text-[#006C5E] dark:text-[#4ADE80]" />
          )}
          <span className="text-xs text-gray-400">
            • {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Body */}
        <p className="mb-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 dark:text-gray-500">
          <button className="flex items-center gap-1 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]">
            <FaArrowUp /> {comment.likes.length || 0}
          </button>

          {/* Only show reply button on Top Level comments to force 2-tier structure */}
          {!isReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="transition-colors hover:text-gray-900 dark:hover:text-white"
            >
              Reply
            </button>
          )}

          <button className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500">
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
    </div>
  );
};

const CommentInput = ({ discussionId, parentId, onSuccess }: any) => {
  const router = useRouter();
  const { status } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      if (status !== 'authenticated') {
        toast.error('Sign in to join the discussion.');
        return;
      }
      await communityClient.createComment(discussionId, { content: text, ...(parentId ? { parentId } : {}) });
      setText('');
      toast.success('Comment posted!');
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div className="relative flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={parentId ? 'Write a reply...' : 'Add to the discussion...'}
          className="min-h-[100px] w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900 transition-all outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-[#152a26] dark:text-white dark:focus:border-[#4ADE80]"
        />
        <div className="absolute right-3 bottom-3 flex gap-2">
          {parentId && (
            <button
              onClick={onSuccess}
              className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="rounded-lg bg-[#006C5E] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#005a4e] disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};
