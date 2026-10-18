'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaTwitter,
  FaFacebookF,
  FaWhatsapp,
  FaLinkedinIn,
  FaRedditAlien,
  FaLink,
  FaCheck,
} from 'react-icons/fa';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Social Links Config
  const socials = [
    {
      icon: <FaWhatsapp />,
      label: 'WhatsApp',
      color: 'bg-[#25D366]',
      link: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      icon: <FaTwitter />,
      label: 'X / Twitter',
      color: 'bg-black dark:bg-white dark:text-black',
      link: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
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
                onClick={onClose}
                className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <FaTimes />
              </button>
            </div>

            {/* Social Grid */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-3"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg transition-transform group-hover:scale-110 ${s.color}`}
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
                  Page Link
                </p>
                <p className="truncate font-mono text-sm text-gray-900 dark:text-white">{url}</p>
              </div>
              <button
                onClick={handleCopy}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-black text-white dark:bg-white dark:text-black'}`}
              >
                {copied ? <FaCheck /> : 'Copy'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
