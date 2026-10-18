'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FaSearch, FaFilter, FaArrowUp, FaCommentDots, FaPen } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { communityClient } from '@/lib/api/communityClient';
import imageLoader from '@/lib/loader';

const CATEGORIES = ['All Topics', 'Baking Help', 'Showcase', 'General', 'Equipment', 'Ingredients'];

export default function DiscussionsPage() {
  const router = useRouter();
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('All Topics');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Simple fetcher (Can be upgraded to infinite scroll like recipe page)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityClient.listDiscussions({
        category: activeCat,
        search,
        limit: 20,
      });
      setDiscussions(res.discussions || []);
    } catch {
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [activeCat, search]);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-20 lg:px-24">
        {/* --- HEADER --- */}
        <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div>
            <span className="mb-2 block text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
              The Forum
            </span>
            <h1 className="text-4xl font-black lg:text-6xl">Discussions</h1>
          </div>
          <button
            onClick={() => router.push('/community/discussion/create')}
            className="flex items-center gap-2 rounded-xl bg-[#006C5E] px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-black dark:hover:bg-[#3ccb74]"
          >
            <FaPen /> Start New Thread
          </button>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* --- LEFT: FILTERS --- */}
          <aside className="space-y-8 lg:w-1/4">
            <div className="relative">
              <FaSearch className="absolute top-3.5 left-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics..."
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-10 font-medium transition-all outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]"
              />
            </div>
            <div className="space-y-1">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                <FaFilter /> Filters
              </h3>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${activeCat === cat ? 'bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-black' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </aside>

          {/* --- RIGHT: FEED --- */}
          <div className="space-y-4 lg:w-3/4">
            {loading ? (
              <div className="py-20 text-center text-gray-400">Loading discussions...</div>
            ) : discussions.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center text-gray-400 dark:border-white/10">
                No discussions found. Be the first to post!
              </div>
            ) : (
              discussions.map((thread) => (
                <Link href={`/community/discussion/${thread.slug}`} key={thread.id}>
                  <div className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/5 dark:bg-[#152a26]">
                    <div className="flex items-start gap-4">
                      {/* Vote Box */}
                      <div className="flex min-w-[50px] flex-col items-center gap-1 rounded-lg bg-gray-50 p-2 text-gray-400 dark:bg-white/5 dark:text-gray-500">
                        <FaArrowUp />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {thread._count.likes}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3 text-xs font-bold">
                          <span className="rounded bg-[#006C5E]/10 px-2 py-1 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                            {thread.category}
                          </span>
                          <span className="text-gray-400">
                            • {new Date(thread.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="mb-2 text-lg font-bold transition-colors group-hover:text-[#006C5E] lg:text-xl dark:group-hover:text-[#4ADE80]">
                          {thread.title}
                        </h3>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Image
                              src={thread.author.image || '/placeholder.png'}
                              width={24}
                              height={24}
                              alt="User"
                              className="rounded-full bg-gray-200"
                              loader={imageLoader}
                            />
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                              {thread.author.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                            <FaCommentDots /> {thread._count.comments} comments
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
