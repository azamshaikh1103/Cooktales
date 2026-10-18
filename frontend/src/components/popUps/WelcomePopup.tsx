'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { FaTimes, FaUtensils, FaPenNib, FaUsers, FaArrowRight, FaCrown } from 'react-icons/fa';
import imageLoader from '@/lib/loader';

function WelcomePopupContent() {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      setIsOpen(true);
      triggerCelebration();
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const triggerCelebration = () => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#006C5E', '#ffffff', '#fbbf24'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#006C5E', '#ffffff', '#fbbf24'],
      });
    }, 250);
  };

  const handleClose = () => setIsOpen(false);

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* The Card */}
          <motion.div
            variants={containerVars}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative flex w-full max-w-6xl flex-col overflow-hidden rounded-[3rem] border border-white/10 bg-white shadow-2xl lg:flex-row dark:bg-[#0d1f1c]"
          >
            {/* --- LEFT: VISUAL IMMERSION --- */}
            <div className="relative h-64 overflow-hidden lg:h-auto lg:w-2/5">
              <Image
                src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop"
                alt="Kitchen"
                fill
                className="object-cover"
                loader={imageLoader}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent lg:bg-linear-to-r lg:from-black/60 lg:via-transparent" />

              <div className="absolute bottom-0 left-0 p-8 text-white lg:p-12">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-1.5 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
                  Kitchen Access: Granted
                </div>
                <h3 className="text-3xl leading-tight font-semibold">Your apron is ready.</h3>
              </div>
            </div>

            {/* --- RIGHT: CONTENT & ACTIONS --- */}
            <div className="relative flex-1 overflow-hidden p-8 lg:p-16">
              {/* Background Blob */}
              <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#006C5E]/5 blur-[100px] dark:bg-[#006C5E]/10" />

              {/* Close */}
              <button
                aria-label="Close"
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-white"
              >
                <FaTimes size={24} />
              </button>

              <div className="relative z-10 flex h-full flex-col justify-center">
                <motion.div variants={itemVars} className="mb-2">
                  <span className="text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
                    All Systems Go
                  </span>
                </motion.div>

                <motion.h2
                  variants={itemVars}
                  className="mb-6 text-4xl font-semibold text-gray-900 lg:text-6xl dark:text-white"
                >
                  Welcome Home, <br /> Chef.
                </motion.h2>

                <motion.p
                  variants={itemVars}
                  className="mb-12 max-w-md text-lg leading-relaxed text-gray-500 dark:text-gray-500"
                >
                  CookTale is now your canvas. Here are three ways to get your hands dirty right
                  now.
                </motion.p>

                {/* Action Grid */}
                <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                  <ActionCard
                    icon={<FaUtensils />}
                    title="Browse"
                    label="Recipes"
                    link="/recipe"
                    color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                  />
                  <ActionCard
                    icon={<FaPenNib />}
                    title="Write"
                    label="A Story"
                    link="/new-story"
                    color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                  />
                  <ActionCard
                    icon={<FaUsers />}
                    title="Join"
                    label="Community"
                    link="/community"
                    color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                  />
                </div>

                <motion.div variants={itemVars}>
                  <button
                    onClick={handleClose}
                    className="group flex items-center gap-3 rounded-2xl bg-[#006C5E] px-8 py-4 text-lg font-bold text-white shadow-xl shadow-[#006C5E]/20 transition-all hover:scale-105 hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:shadow-[#4ADE80]/20 dark:hover:bg-[#3ccb74]"
                  >
                    Let's Get Cooking{' '}
                    <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- SUB COMPONENT ---
const ActionCard = ({ icon, title, label, link, color }: any) => {
  const router = useRouter();
  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      }}
      onClick={() => router.push(link)}
      className="group cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 transition-all hover:-translate-y-1 hover:border-gray-200 hover:shadow-xl dark:border-white/5 dark:bg-[#152a26] dark:hover:border-white/10"
    >
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl transition-transform group-hover:scale-110 ${color}`}
      >
        {icon}
      </div>
      <p className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">{title}</p>
      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{label}</h4>
    </motion.div>
  );
};

export default function WelcomePopup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d1f1c]" />}>
      <WelcomePopupContent />
    </Suspense>
  );
}
