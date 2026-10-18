'use client';

import { useState, useEffect } from 'react';

const PHASE_1_MESSAGES = [
  'Sharpening the knives...',
  'Preheating the digital oven...',
  'Chopping the onions (no tears)...',
  'Melting the butter...',
  'Sifting the flour...',
  'Marinating the data...',
  'Whisking the pixels...',
  'Tasting the sauce...',
  'Putting on the apron...',
  'Washing the veggies...',
];

const PHASE_2_MESSAGES = [
  'Letting it simmer...',
  'Just a pinch more salt...',
  'Thickening the plot...',
  "Don't burn the garlic...",
  'Adding the secret ingredient...',
  'Plating the dish...',
  'Almost ready to serve...',
  'Garnishing with parsley...',
  'Checking the temperature...',
  'Smells good in here...',
];

const PHASE_3_MESSAGES = [
  'The waiter tripped. One moment...',
  'Is the stove plugged in?',
  'Checking your internet connection...',
  'This is taking longer than a soufflé...',
  'Still cooking... or maybe burning?',
  'You sure you have Wi-Fi?',
  'Sending a search party for the data...',
  'Re-heating the leftovers...',
];

export const FireLoader = () => {
  const [message, setMessage] = useState('Cooking your request...');

  useEffect(() => {
    setMessage(PHASE_1_MESSAGES[Math.floor(Math.random() * PHASE_1_MESSAGES.length)]);

    const timer1 = setTimeout(() => {
      setMessage(PHASE_2_MESSAGES[Math.floor(Math.random() * PHASE_2_MESSAGES.length)]);
    }, 5000);

    const timer2 = setTimeout(() => {
      setMessage(PHASE_3_MESSAGES[Math.floor(Math.random() * PHASE_3_MESSAGES.length)]);
    }, 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-8 bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-orange-500/20 blur-3xl dark:bg-orange-500/30" />

        {/* The Fire GIF */}
        <div className="relative z-10 drop-shadow-2xl filter transition-transform duration-500 hover:scale-110">
          <picture>
            <source
              srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.webp"
              type="image/webp"
            />
            <img
              src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif"
              alt="🔥"
              width="120"
              height="120"
              className="h-32 w-32 lg:h-40 lg:w-40"
            />
          </picture>
        </div>

        {/* Shadow */}
        <div className="absolute -bottom-6 left-1/2 h-3 w-20 -translate-x-1/2 animate-pulse rounded-[100%] bg-black/10 blur-md dark:bg-black/40" />
      </div>

      <div className="flex flex-col items-center gap-3 px-4 text-center">
        {/* Dynamic Message */}
        <span
          key={message}
          className="animate-fade-in-up text-sm font-black tracking-[0.25em] text-[#006C5E] uppercase transition-all duration-300 lg:text-base dark:text-[#4ADE80]"
        >
          {message}
        </span>

        <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase dark:text-gray-600">
          Please wait
        </span>
      </div>
    </div>
  );
};
