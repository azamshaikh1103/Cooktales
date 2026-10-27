'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FaArrowRight, FaBookOpen, FaTimes, FaUsers } from 'react-icons/fa';
import { LuChefHat } from 'react-icons/lu';

const actions = [
  { label: 'Explore recipes', description: 'Find something good to cook today.', href: '/recipe', icon: FaBookOpen },
  { label: 'Share your food', description: 'Publish a recipe or write a story.', href: '/new-recipe', icon: LuChefHat },
  { label: 'Meet the community', description: 'Swap ideas with fellow home cooks.', href: '/community', icon: FaUsers },
];

function WelcomePopupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setIsOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  function visit(href: string) {
    setIsOpen(false);
    router.push(href);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
          <motion.button
            type="button"
            aria-label="Close welcome message"
            className="absolute inset-0 cursor-default bg-[#092019]/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          <motion.section
            aria-labelledby="welcome-title"
            className="relative w-full max-w-2xl rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#0d1f1c] sm:p-10"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <button type="button" aria-label="Close" onClick={() => setIsOpen(false)} className="absolute top-5 right-5 cursor-pointer rounded-full p-2 text-[#61736e] transition hover:bg-[#edf4f1] hover:text-[#13221f] focus:outline-none focus:ring-2 focus:ring-[#008575] dark:text-[#aec0bb] dark:hover:bg-white/10 dark:hover:text-white dark:focus:ring-[#4ade80]">
              <FaTimes />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7f4f0] text-xl text-[#006c5e] dark:bg-[#4ade80]/15 dark:text-[#4ade80]">
              <LuChefHat />
            </div>
            <p className="mt-6 text-sm font-semibold text-[#008575] dark:text-[#4ade80]">Welcome to CookTale</p>
            <h2 id="welcome-title" className="mt-2 text-3xl font-semibold tracking-tight text-[#13221f] dark:text-white sm:text-4xl">Your kitchen, your stories, your table.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#61736e] dark:text-[#aec0bb]">Discover recipes, share what you make, and connect with people who love food as much as you do.</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {actions.map(({ label, description, href, icon: Icon }) => (
                <button key={href} type="button" onClick={() => visit(href)} className="group cursor-pointer rounded-2xl border border-[#dce7e3] bg-[#fbfdfc] p-4 text-left transition hover:border-[#8fcbbd] hover:bg-[#f2faf7] focus:outline-none focus:ring-2 focus:ring-[#008575] dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-[#4ade80]/50 dark:hover:bg-white/[0.06] dark:focus:ring-[#4ade80]">
                  <Icon className="text-lg text-[#008575] dark:text-[#4ade80]" />
                  <span className="mt-5 block text-sm font-semibold text-[#13221f] dark:text-white">{label}</span>
                  <span className="mt-1 block text-sm leading-5 text-[#61736e] dark:text-[#aec0bb]">{description}</span>
                </button>
              ))}
            </div>

            <button type="button" onClick={() => setIsOpen(false)} className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#007d6d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006c5e] focus:outline-none focus:ring-2 focus:ring-[#008575] focus:ring-offset-2 dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#62e895] dark:focus:ring-[#4ade80] dark:focus:ring-offset-[#0d1f1c]">
              Start exploring <FaArrowRight aria-hidden="true" />
            </button>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function WelcomePopup() {
  return (
    <Suspense fallback={null}>
      <WelcomePopupContent />
    </Suspense>
  );
}
