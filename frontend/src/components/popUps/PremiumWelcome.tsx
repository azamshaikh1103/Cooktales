'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { FaTimes, FaCrown, FaCheckCircle, FaArrowRight, FaStar } from 'react-icons/fa';
import imageLoader from '@/lib/loader';

function PremiumWelcomePopupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('upgrade') === 'success') {
      setIsOpen(true);
      triggerLuxuryConfetti();

      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const triggerLuxuryConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Gold, White, and Deep Green confetti
    const colors = ['#FCD34D', '#ffffff', '#006C5E'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  const handleClose = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4 lg:p-8">
          {/* --- 1. LUXURY BACKDROP --- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#050a09]/95 backdrop-blur-xl"
          />

          {/* --- 2. THE VIP SPLIT CARD --- */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
            className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-[3rem] border border-[#006C5E]/30 bg-[#0d1f1c] shadow-2xl lg:flex-row"
          >
            {/* LEFT SIDE: IMMERSIVE VISUAL */}
            <div className="relative h-64 overflow-hidden lg:h-auto lg:w-5/12">
              <Image
                src="https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=2000&auto=format&fit=crop"
                alt="Fine Dining"
                fill
                className="object-cover opacity-80"
                loader={imageLoader}
              />
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-linear-to-t from-[#0d1f1c] via-transparent to-transparent lg:bg-linear-to-r lg:from-[#0d1f1c] lg:via-[#006C5E]/20 lg:to-transparent" />

              <div className="absolute bottom-0 left-0 z-10 p-8 text-white lg:p-10">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-1.5 text-xs font-bold tracking-widest text-amber-400 uppercase backdrop-blur-md">
                  <FaStar className="animate-spin-slow text-amber-400" /> Membership Active
                </div>
                <h3 className="mb-2 text-3xl leading-tight font-black text-white">
                  The Kitchen is <br /> Yours to Command.
                </h3>
                <p className="text-sm font-medium text-white/60">Order #8392-PRO • Verified</p>
              </div>
            </div>

            {/* RIGHT SIDE: THE UPGRADE REVEAL */}
            <div className="relative flex flex-1 flex-col justify-center overflow-hidden p-8 lg:p-12">
              {/* Background Glows */}
              <div className="pointer-events-none absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-[#006C5E]/10 blur-[120px]" />

              {/* Close */}
              <button
                aria-label="Close"
                onClick={handleClose}
                className="absolute top-6 right-6 z-20 p-2 text-white/30 transition-colors hover:text-white"
              >
                <FaTimes size={24} />
              </button>

              <div className="relative z-10">
                {/* Crown Header */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-amber-300 to-amber-600 shadow-lg shadow-amber-500/20">
                    <FaCrown className="text-3xl text-[#0d1f1c]" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tight text-white">
                      Welcome,{' '}
                      <span className="bg-linear-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent">
                        Sous Chef.
                      </span>
                    </h2>
                    <p className="mt-1 text-sm font-medium text-gray-500">
                      You have successfully upgraded.
                    </p>
                  </div>
                </div>

                <p className="mb-10 text-lg leading-relaxed text-gray-300">
                  Your support keeps CookTale independent. In return, we've unlocked the full power
                  of the platform for you.
                </p>

                {/* Feature Grid (The Receipt) */}
                <div className="mb-10 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2">
                  <Feature text="Secret Family Recipes" delay={0.1} />
                  <Feature text="Advanced Nutrition" delay={0.2} />
                  <Feature text="Ad-Free Experience" delay={0.3} />
                  <Feature text="Unlimited Collections" delay={0.4} />
                  <Feature text="Priority Support" delay={0.5} />
                  <Feature text="Verified Badge" delay={0.6} />
                </div>

                {/* CTA */}
                <button
                  onClick={handleClose}
                  className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-[#006C5E] to-[#004d41] py-4 text-lg font-black text-white shadow-xl shadow-[#006C5E]/30 transition-all hover:scale-[1.01] hover:shadow-[#006C5E]/50"
                >
                  Start Exploring{' '}
                  <FaArrowRight className="transition-transform group-hover:translate-x-1" />
                </button>

                <p className="mt-6 text-center text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">
                  CookTale Premium • Thank You
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- ANIMATED LIST ITEM ---
const Feature = ({ text, delay }: { text: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition-colors hover:bg-white/10"
  >
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#006C5E] text-[10px] text-white shadow-sm">
      <FaCheckCircle />
    </div>
    <span className="text-sm font-bold text-gray-200">{text}</span>
  </motion.div>
);

export default function PremiumWelcomePopup() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d1f1c]" />}>
      <PremiumWelcomePopupContent />
    </Suspense>
  );
}
