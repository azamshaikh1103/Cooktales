'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi, FaRedo } from 'react-icons/fa';
import { BiSolidFridge } from 'react-icons/bi';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export default function OfflineStatus() {
  const isOnline = useOnlineStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
    }, 1000);
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          className="fixed inset-0 z-9999 flex items-center justify-center bg-white/80 p-6 dark:bg-[#0d1f1c]/90"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white p-10 text-center shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
          >
            {/* Background Decor */}
            <div className="pointer-events-none absolute top-0 right-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Icon */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                <BiSolidFridge className="text-4xl text-red-500 dark:text-red-400" />
                <div className="absolute -right-2 -bottom-2 rounded-full bg-white p-2 shadow-sm dark:bg-[#152a26]">
                  <FaWifi className="text-sm text-gray-500" />
                </div>
              </div>

              <h2 className="mb-2 text-3xl font-black text-gray-900 dark:text-white">
                Connection Lost
              </h2>

              <p className="mb-8 text-base leading-relaxed text-gray-500 dark:text-gray-500">
                The kitchen is offline. Check your internet connection to keep cooking.
              </p>

              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="group w-full cursor-pointer rounded-2xl bg-gray-900 py-4 text-sm font-bold tracking-widest text-white uppercase transition-all hover:bg-black hover:shadow-xl dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <span className="flex items-center justify-center gap-2">
                  {isRetrying ? (
                    <FaRedo className="animate-spin" />
                  ) : (
                    <>
                      Retry Connection{' '}
                      <FaRedo className="transition-transform duration-500 group-hover:rotate-180" />
                    </>
                  )}
                </span>
              </button>

              <div className="mt-6 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase">
                  Reconnecting...
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
