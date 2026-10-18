'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronDown, FaChevronUp, FaEye, FaHeart, FaLock, FaArrowUp } from 'react-icons/fa';
import Image from 'next/image';
import imageLoader from '@/lib/loader';

// --- MOCK DATA GENERATORS ---
// Generates a random trend for the graphs
const generateTrend = () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 20);

export default function AnalyticsClient({ user, content }: { user: any; content: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // If not pro, we lock the interaction
  const isPro = user.isPro || true;

  const toggleRow = (id: string) => {
    if (!isPro) return; // Don't expand if not pro (Lock overlap handles it)
    setExpandedId(expandedId === id ? null : id);
  };

  // Total Views Data (Aggregate)
  const totalTrend = generateTrend();

  return (
    <div className="relative">
      {/* --- TOP: MASTER GRAPH --- */}
      <section className="relative mb-12 overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-sm dark:border-white/5 dark:bg-[#152a26]">
        <div className="relative z-10 mb-8 flex items-start justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Total Performance
            </h3>
            <div className="mt-2 flex items-baseline gap-3 text-4xl font-black text-gray-900 dark:text-white">
              12,450{' '}
              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-sm font-bold text-green-500">
                +24%
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border-none bg-gray-50 px-3 py-2 text-xs font-bold outline-none dark:bg-black/20">
              <option>Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* The Master Chart */}
        <div className="h-48 w-full">
          <ChartWidget data={totalTrend} color="#006C5E" />
        </div>

        {/* If NOT PRO, blur the bottom half slightly to tease depth */}
        {!isPro && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/30 backdrop-blur-sm dark:bg-black/30">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-white px-6 py-3 shadow-2xl dark:bg-[#0d1f1c]">
              <FaLock className="text-amber-500" />
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                Pro Analytics Locked
              </span>
            </div>
          </div>
        )}
      </section>

      {/* --- CONTENT LIST (Fiverr Style) --- */}
      <section className="overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#152a26]">
        <div className="flex items-center justify-between border-b border-gray-100 p-8 dark:border-white/5">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Content Breakdown</h3>
          <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Last 30 Days
          </span>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-white/5">
          {content.map((item) => (
            <div
              key={item.id}
              className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
            >
              {/* ROW HEADER (Clickable) */}
              <div
                onClick={() => toggleRow(item.id)}
                className={`flex cursor-pointer items-center gap-6 p-6 transition-all ${!isPro ? 'opacity-50' : ''}`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-200 dark:bg-white/10">
                  <Image
                    src={item.mainImage}
                    fill
                    alt=""
                    className="object-cover"
                    loader={imageLoader}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                    {item.name}
                  </h4>
                  <div className="mt-1 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaEye /> {item.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaHeart /> {item.likes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${expandedId === item.id ? 'rotate-180 bg-gray-200 dark:bg-white/20' : 'text-gray-400'}`}
                >
                  <FaChevronDown />
                </div>
              </div>

              {/* EXPANDABLE GRAPH DRAWER */}
              <AnimatePresence>
                {expandedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-black/20"
                  >
                    <div className="p-8">
                      <div className="mb-6 flex items-center justify-between">
                        <h5 className="text-xs font-bold tracking-widest text-gray-400 uppercase">
                          Performance Trend
                        </h5>
                        <div className="rounded bg-[#006C5E]/10 px-2 py-1 text-xs font-bold text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                          +84 Views this week
                        </div>
                      </div>

                      {/* Mini Chart for this specific item */}
                      <div className="h-32 w-full">
                        <ChartWidget data={generateTrend()} color="#F59E0B" />{' '}
                        {/* Amber for individual */}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* LOCK OVERLAY FOR LIST (If not pro) */}
        {!isPro && (
          <div className="absolute inset-0 top-48 z-10 flex items-end justify-center bg-linear-to-b from-transparent to-white pb-20 dark:to-[#0d1f1c]">
            <div className="text-center">
              <h3 className="mb-2 text-2xl font-black text-gray-900 dark:text-white">
                Deep Dive Analytics
              </h3>
              <p className="mb-6 text-gray-500">See exactly which recipe is trending and why.</p>
              <button className="rounded-xl bg-linear-to-r from-amber-400 to-orange-500 px-8 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105">
                Upgrade to Sous Chef
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// --- SVG CHART COMPONENT (The "Visual" Magic) ---
// Draws a smooth bezier curve based on data
const ChartWidget = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (val / max) * 80; // Keep some padding at top
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="group relative flex h-full w-full items-end justify-between">
      {/* SVG Line */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {/* Fill Gradient */}
        <path
          d={`M 0,100 ${points
            .split(' ')
            .map((p, i) => `L ${p}`)
            .join(' ')} L 100,100 Z`}
          fill={color}
          fillOpacity="0.1"
        />
        {/* Stroke Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Hoverable Bars (Invisible trigger zones) */}
      {data.map((val, i) => (
        <div
          key={i}
          className="group/bar relative flex h-full flex-1 cursor-pointer items-end justify-center"
        >
          {/* Tooltip */}
          <div className="pointer-events-none absolute -top-2 z-20 -translate-y-full transform rounded bg-gray-900 px-2 py-1 text-[10px] font-bold whitespace-nowrap text-white opacity-0 transition-opacity group-hover/bar:opacity-100">
            {val} Views
          </div>
          {/* Visual Dot on Line */}
          <div
            className="absolute h-2 w-2 rounded-full border-2 bg-white opacity-0 transition-all group-hover/bar:opacity-100"
            style={{ borderColor: color, bottom: `${(val / max) * 80}%`, marginBottom: '-4px' }}
          />
          {/* Vertical Guide Line */}
          <div className="h-full w-px bg-gray-100 opacity-0 group-hover/bar:opacity-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
};
