'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaClock, FaTrophy, FaUsers } from 'react-icons/fa';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { communityClient, type Challenge } from '@/lib/api/communityClient';
import imageLoader from '@/lib/loader';

function daysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000));
}

export default function ChallengesPage() {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void communityClient.challenges().then((result) => setChallenges(result.challenges)).catch(() => setChallenges([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />
      <main className="container mx-auto px-6 pb-20 pt-32 lg:px-24">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-3xl text-black"><FaTrophy /></div>
          <h1 className="mb-6 text-4xl font-black lg:text-6xl">The Arena.</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">Community challenges with real entries, dates, and prizes.</p>
        </div>
        {loading ? <div className="py-20 text-center text-gray-500">Loading challenges...</div> : challenges.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-white/15 dark:text-gray-400">There are no challenges right now. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => {
              const active = challenge.isActive && new Date(challenge.endDate).getTime() > Date.now();
              return <button key={challenge.id} type="button" onClick={() => router.push(`/community/challenge/${challenge.id}`)} className="group overflow-hidden rounded-3xl border border-gray-100 bg-white text-left transition-colors hover:border-[#006C5E]/40 dark:border-white/5 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/40">
                <div className="relative h-60 bg-[#0d1f1c]">
                  {challenge.coverImage ? <Image src={challenge.coverImage} fill alt={challenge.title} className={`object-cover ${active ? '' : 'grayscale'}`} loader={imageLoader} /> : <div className="flex h-full items-center justify-center text-5xl text-[#4ADE80]"><FaTrophy /></div>}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase ${active ? 'bg-green-400 text-black' : 'bg-gray-800 text-white'}`}>{active ? 'Live now' : 'Ended'}</span>
                </div>
                <div className="p-7"><h2 className="text-2xl font-bold">{challenge.title}</h2><p className="mt-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{challenge.description}</p><div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 text-sm font-bold text-gray-500 dark:border-white/10 dark:text-gray-400"><span className="flex items-center gap-2"><FaUsers /> {challenge._count.entries}</span><span className={active ? 'flex items-center gap-2 text-orange-500' : 'text-gray-500'}>{active && <FaClock />}{active ? `${daysLeft(challenge.endDate)} days left` : 'Completed'}</span></div></div>
              </button>;
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
