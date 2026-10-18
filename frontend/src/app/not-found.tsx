'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaArrowRight, FaSearch, FaHome, FaUtensils } from 'react-icons/fa';
import { MdArticle } from 'react-icons/md';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <Navbar />

      <main className="relative flex grow items-center justify-center overflow-hidden py-24 lg:py-32">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006C5E]/5 blur-[120px] transition-colors duration-700 dark:bg-[#006C5E]/20" />

        <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 select-none">
          <span className="text-[35vw] font-black text-white drop-shadow-sm transition-colors duration-500 dark:text-[#ffffff05]">
            404
          </span>
        </div>

        <div className="relative z-10 container mx-auto flex flex-col items-center px-4 lg:px-0">
          <div className="mx-4 w-full max-w-3xl rounded-[3rem] border border-white/50 bg-white/80 p-8 text-center shadow-2xl backdrop-blur-xl transition-all duration-500 lg:p-16 dark:border-white/10 dark:bg-[#152a26]/60">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold tracking-widest text-red-500 uppercase transition-colors dark:bg-red-900/20 dark:text-red-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Error 404
            </div>

            <h1 className="mb-6 text-4xl leading-tight font-bold text-gray-900 transition-colors lg:text-6xl dark:text-white">
              We burned this page. <br />
              <span className="mt-2 block text-2xl font-medium text-gray-500 transition-colors lg:text-4xl dark:text-gray-500">
                (It was overcooked anyway).
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed font-medium text-gray-500 transition-colors dark:text-gray-500">
              The recipe you are looking for has been moved, deleted, or never existed. Let's get
              you back to the good stuff.
            </p>

            <form onSubmit={handleSearch} className="group relative mx-auto mb-12 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for recipes..."
                className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 pr-14 pl-6 font-bold text-gray-800 transition-all placeholder:font-medium placeholder:text-gray-500 focus:border-[#006C5E] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:placeholder:text-gray-600 dark:focus:border-[#006C5E] dark:focus:bg-white/10"
              />
              <button
                type="submit"
                className="absolute top-3 right-3 rounded-xl bg-[#006C5E] p-2 text-white shadow-md transition-colors hover:bg-[#005a4e]"
                aria-label="Search"
              >
                <FaSearch />
              </button>
            </form>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Link
                href="/"
                className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-transparent p-6 transition-all duration-300 hover:border-[#006C5E]/30 hover:bg-[#006C5E]/5 dark:border-white/10 dark:hover:border-[#006C5E]/50 dark:hover:bg-[#006C5E]/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-[#006C5E] group-hover:text-white dark:bg-white/10 dark:text-gray-500 dark:group-hover:bg-[#006C5E] dark:group-hover:text-white">
                  <FaHome className="text-xl" />
                </div>
                <span className="font-bold text-gray-700 transition-colors group-hover:text-[#006C5E] dark:text-gray-300 dark:group-hover:text-[#006C5E]">
                  Homepage
                </span>
              </Link>

              <Link
                href="/recipe"
                className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-transparent p-6 transition-all duration-300 hover:border-[#006C5E]/30 hover:bg-[#006C5E]/5 dark:border-white/10 dark:hover:border-[#006C5E]/50 dark:hover:bg-[#006C5E]/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-[#006C5E] group-hover:text-white dark:bg-white/10 dark:text-gray-500 dark:group-hover:bg-[#006C5E] dark:group-hover:text-white">
                  <FaUtensils className="text-xl" />
                </div>
                <span className="font-bold text-gray-700 transition-colors group-hover:text-[#006C5E] dark:text-gray-300 dark:group-hover:text-[#006C5E]">
                  All Recipes
                </span>
              </Link>

              <Link
                href="/stories"
                className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-transparent p-6 transition-all duration-300 hover:border-[#006C5E]/30 hover:bg-[#006C5E]/5 dark:border-white/10 dark:hover:border-[#006C5E]/50 dark:hover:bg-[#006C5E]/10"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors group-hover:bg-[#006C5E] group-hover:text-white dark:bg-white/10 dark:text-gray-500 dark:group-hover:bg-[#006C5E] dark:group-hover:text-white">
                  <MdArticle className="text-xl" />
                </div>
                <span className="font-bold text-gray-700 transition-colors group-hover:text-[#006C5E] dark:text-gray-300 dark:group-hover:text-[#006C5E]">
                  Read Stories
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-10">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm font-bold tracking-widest text-gray-500 uppercase transition-colors hover:text-[#006C5E] dark:text-gray-500 dark:hover:text-[#006C5E]"
            >
              <span className="rotate-180">
                <FaArrowRight />
              </span>{' '}
              Go Back Previous Page
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
