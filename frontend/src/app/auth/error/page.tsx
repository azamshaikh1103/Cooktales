'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaExclamationTriangle,
  FaArrowLeft,
  FaTerminal,
  FaChevronDown,
  FaChevronUp,
  FaBug,
} from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// --- ERROR DICTIONARY ---
const ERROR_MAP: Record<string, { title: string; desc: string; color: string }> = {
  Configuration: {
    title: 'System Config Error',
    desc: 'The server refused the connection. This is usually a temporary configuration issue.',
    color: 'text-red-600 dark:text-red-500',
  },
  AccessDenied: {
    title: 'Access Denied',
    desc: 'You do not have permission to enter the kitchen.',
    color: 'text-orange-600 dark:text-orange-500',
  },
  Verification: {
    title: 'Link Expired',
    desc: 'That verification link has already been used or is too old.',
    color: 'text-yellow-600 dark:text-yellow-500',
  },
  OAuthAccountNotLinked: {
    title: 'Email Already in Use',
    desc: 'You previously signed in with a different provider (like Google vs Email). Please use the original method.',
    color: 'text-purple-600 dark:text-purple-500',
  },
  Default: {
    title: 'Authentication Failed',
    desc: "The kitchen doors are stuck. We couldn't sign you in this time.",
    color: 'text-gray-900 dark:text-white',
  },
};

function ErrorContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const rawError = params.get('error') || 'Default';

  const isTechnicalError = rawError.includes(' ');
  const errorKey = isTechnicalError ? 'Default' : rawError;
  const info = ERROR_MAP[errorKey] || ERROR_MAP['Default'];

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-red-100 bg-white shadow-2xl dark:border-red-900/30 dark:bg-[#152a26]"
      >
        {/* Header */}
        <div className="border-b border-red-100 bg-red-50 p-10 text-center dark:border-red-900/10 dark:bg-red-900/20">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white text-5xl text-red-500 shadow-sm dark:bg-[#0d1f1c]">
            <FaExclamationTriangle />
          </div>
          <h1 className={`text-3xl font-black ${info.color} mb-3 leading-tight`}>{info.title}</h1>
          <p className="leading-relaxed font-medium text-gray-600 dark:text-gray-400">
            {info.desc}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-6 p-8">
          <button
            onClick={() => router.push('/?auth=login')}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#006C5E] py-4 text-lg font-bold text-white shadow-lg shadow-[#006C5E]/20 transition-all hover:bg-[#005a4e]"
          >
            <FaArrowLeft className="transition-transform group-hover:-translate-x-1" /> Back to
            Login
          </button>

          <div className="text-center">
            <a
              href="mailto:support@cooktale.in"
              className="text-xs font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-[#006C5E]"
            >
              Contact Support
            </a>
          </div>

          {/* Developer Details (Collapsible) */}
          <div className="border-t border-gray-100 pt-6 dark:border-white/5">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center justify-between bg-transparent text-[10px] font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <span className="flex items-center gap-2">
                <FaTerminal /> Developer Log
              </span>
              {showDetails ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-xl border border-gray-200 bg-black/5 p-4 font-mono text-[10px] leading-relaxed wrap-break-word text-red-600 select-all dark:border-white/5 dark:bg-black/40 dark:text-red-400">
                    {rawError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <Navbar />
      <main className="relative grow overflow-hidden pt-20">
        {/* Background Chaos */}
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-500/10 blur-[100px]" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Suspense
            fallback={<div className="p-20 text-center text-gray-500">Analyzing error...</div>}
          >
            <ErrorContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
