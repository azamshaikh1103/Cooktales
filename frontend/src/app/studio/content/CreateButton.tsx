'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaPlus, FaUtensils, FaPenNib } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl bg-black px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-80 dark:bg-white dark:text-black"
      >
        <FaPlus className="text-xs" /> Create New
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-12 right-0 z-50 w-48 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a2c29]"
          >
            <div className="p-1">
              <Link
                href="/new-recipe"
                className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                  <FaUtensils className="text-xs" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-white">Recipe</span>
              </Link>
              <Link
                href="/new-story"
                className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  <FaPenNib className="text-xs" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-white">Story</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
