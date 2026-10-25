'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaTwitter,
  FaFacebookF,
  FaPinterestP,
  FaShareAlt,
  FaWhatsapp,
  FaLinkedinIn,
  FaRedditAlien,
  FaLink,
  FaCheck,
} from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Image from 'next/image';
import imageLoader from '@/lib/loader';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string | null;
  image?: string | null;
  primaryAction?: { label: string; onClick: () => void };
}

export default function ShareModal({
  isOpen,
  onClose,
  url,
  title,
  description,
  image,
  primaryAction,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [nativeShare, setNativeShare] = useState<Navigator['share']>();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareDescription = description?.trim();
  const encodedDescription = encodeURIComponent(shareDescription || title);
  const encodedShareText = encodeURIComponent(
    shareDescription ? `${title} — ${shareDescription.slice(0, 160)}` : title,
  );

  useEffect(() => {
    setNativeShare(() => navigator.share?.bind(navigator));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!nativeShare) return;
    try {
      await nativeShare({ title, text: shareDescription || title, url });
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        toast.error('Could not open sharing options.');
      }
    }
  };

  const socials = [
    {
      icon: <FaWhatsapp />,
      label: 'WhatsApp',
      color: 'bg-[#25D366]',
      link: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        [title, shareDescription, url].filter(Boolean).join('\n\n'),
      )}`,
    },
    {
      icon: <FaTwitter />,
      label: 'X / Twitter',
      color: 'bg-black dark:bg-white dark:text-black',
      link: `https://twitter.com/intent/tweet?text=${encodedShareText}&url=${encodedUrl}`,
    },
    {
      icon: <FaPinterestP />,
      label: 'Pinterest',
      color: 'bg-[#E60023]',
      link: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodeURIComponent(image || '')}&description=${encodedDescription}`,
    },
    {
      icon: <FaFacebookF />,
      label: 'Facebook',
      color: 'bg-[#1877F2]',
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      icon: <FaRedditAlien />,
      label: 'Reddit',
      color: 'bg-[#FF4500]',
      link: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      icon: <FaLinkedinIn />,
      label: 'LinkedIn',
      color: 'bg-[#0A66C2]',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-md rounded-[2rem] border border-gray-100 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
          >
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Share this Recipe
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <FaTimes />
              </button>
            </div>

            {image && (
              <div className="mb-6 overflow-hidden rounded-2xl bg-gray-100 dark:bg-white/5">
                <div className="relative aspect-[16/9]">
                  <Image src={image} alt={title} fill loader={imageLoader} className="object-cover" />
                </div>
                <div className="p-4">
                  <h4 className="line-clamp-1 font-bold text-gray-900 dark:text-white">{title}</h4>
                  {description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
                  )}
                </div>
              </div>
            )}

            <div className="no-scrollbar mb-8 flex gap-4 overflow-x-auto pb-2">
              {nativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex shrink-0 cursor-pointer flex-col items-center gap-3"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006C5E] text-2xl text-white shadow-lg">
                    <FaShareAlt />
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">More apps</span>
                </button>
              )}
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 cursor-pointer flex-col items-center gap-3"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg ${s.color}`}
                  >
                    {s.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {s.label}
                  </span>
                </a>
              ))}
            </div>

            {/* Copy Link Box */}
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-100 p-2 dark:border-white/10 dark:bg-black/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 dark:bg-white/10 dark:text-gray-300">
                <FaLink />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Share this recipe with your loved ones
                </p>
                <p className="truncate font-mono text-sm text-gray-900 dark:text-white">{url}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-black text-white dark:bg-white dark:text-black'}`}
              >
                {copied ? <FaCheck /> : 'Copy'}
              </button>
            </div>
            {primaryAction && (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="mt-4 w-full cursor-pointer rounded-xl bg-[#006C5E] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00584d] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#22c55e]"
              >
                {primaryAction.label}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
