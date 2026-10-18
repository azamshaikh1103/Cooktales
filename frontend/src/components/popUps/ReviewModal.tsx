'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { BiLoaderAlt } from 'react-icons/bi';
import { toast } from 'sonner';
import { recipeClient } from '@/lib/api/recipeClient';
import { useRouter } from 'next/navigation';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  existingReview?: { id: string; stars: number | null; text: string } | null;
  onSubmitted?: () => void | Promise<void>;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Not for me',
  2: 'Needs improvement',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

export default function ReviewModal({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  existingReview = null,
  onSubmitted,
}: ReviewModalProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRating(existingReview?.stars || 0);
    setText(existingReview?.text || '');
    setHoverRating(0);
  }, [existingReview, isOpen]);

  const handleSubmit = async () => {
    if (rating === 0) return toast.error('Please select a star rating');
    if (text.length < 3) return toast.error('Please write a few words');

    setIsSubmitting(true);
    try {
      if (existingReview) {
        await recipeClient.updateReview(recipeId, existingReview.id, { stars: rating, text });
      } else {
        await recipeClient.createReview(recipeId, { stars: rating, text });
      }
      toast.success(existingReview ? 'Review updated' : 'Review posted');
      onClose();
      await onSubmitted?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#152a26]"
          >
            {/* Header */}
            <div className="border-b border-gray-100 bg-gray-50 p-8 text-center dark:border-white/5 dark:bg-black/20">
              <h3 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                {existingReview ? 'Edit your review' : 'Rate this recipe'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                How did{' '}
                <span className="font-bold text-[#006C5E] dark:text-[#4ADE80]">{recipeName}</span>{' '}
                turn out?
              </p>
              <button
                onClick={onClose}
                className="absolute top-6 right-6 cursor-pointer text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-8">
              {/* Star Rater */}
              <div className="mb-8 flex flex-col items-center">
                <div className="mb-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} star${star === 1 ? '' : 's'}`}
                      className="cursor-pointer transition-colors focus:outline-none"
                    >
                      <FaStar
                        className={`text-4xl transition-colors duration-200 ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400'
                            : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="animate-fade-in h-6 text-sm font-bold text-[#006C5E] dark:text-[#4ADE80]">
                  {RATING_LABELS[hoverRating || rating]}
                </p>
              </div>

              {/* Text Input */}
              <div className="mb-8">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share your cooking experience..."
                  maxLength={1000}
                  className="h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#006C5E] dark:border-white/10 dark:bg-black/20 dark:text-white dark:focus:border-[#4ADE80]"
                />
                <p className="mt-2 text-right text-xs text-gray-400">{text.length}/1000</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006C5E] py-4 text-lg font-semibold text-white transition-colors hover:bg-[#005a4e] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
              >
                {isSubmitting ? <BiLoaderAlt className="animate-spin" /> : <FaPaperPlane />}
                <span>{existingReview ? 'Save changes' : 'Post review'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
