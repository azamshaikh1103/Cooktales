import Image from 'next/image';
import Link from 'next/link';
import { FaMedal, FaTrophy } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { communityClient } from '@/lib/api/communityClient';
import imageLoader from '@/lib/loader';

// --- METADATA ---
export const metadata = {
  title: 'Hall of Fame | CookTale',
  description: 'Celebrating the top chefs in the CookTale community.',
};

export default async function LeaderboardPage() {
  // 1. Fetch Data on Server
  const { users: chefs } = await communityClient.leaderboard().catch(() => ({ users: [] }));

  // 2. Split Data
  const first = chefs[0];
  const second = chefs[1];
  const third = chefs[2];
  const rest = chefs.slice(3);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-20 lg:px-24">
        {/* --- HEADER --- */}
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400/10 text-3xl text-yellow-500 shadow-sm">
            <FaTrophy />
          </div>
          <h1 className="mb-4 text-5xl font-black lg:text-7xl">
            Hall of <span className="text-[#006C5E] dark:text-[#4ADE80]">Fame.</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            The most active and celebrated chefs of the community.
          </p>
        </div>

        {/* --- PODIUM (Top 3) --- */}
        {chefs.length > 0 && (
          <div className="mb-20 flex flex-col items-end justify-center gap-8 md:flex-row">
            {/* 🥈 2nd Place (Left on Desktop) */}
            {second && (
              <div className="order-2 w-full text-center md:order-1 md:w-auto">
                <Link href={`/profile/${second.username}`}>
                  <div className="relative mx-auto mb-4 h-24 w-24 rounded-full border-4 border-gray-300 p-1 transition-transform hover:scale-105 lg:h-28 lg:w-28 dark:border-gray-600">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={second.image || '/placeholder.png'}
                        fill
                        alt={second.name}
                        className="object-cover"
                        loader={imageLoader}
                      />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-300 px-3 py-1 text-xs font-black text-gray-800 shadow-lg">
                      2nd
                    </div>
                  </div>
                  <h3 className="flex items-center justify-center gap-1 text-xl font-bold">
                    {second.name}
                    {second.isPro && (
                      <MdVerified className="text-sm text-[#006C5E] dark:text-[#4ADE80]" />
                    )}
                  </h3>
                  <p className="font-bold text-[#006C5E] dark:text-[#4ADE80]">
                    {second.points.toLocaleString()} pts
                  </p>
                </Link>
              </div>
            )}

            {/* 🥇 1st Place (Center & Highest) */}
            {first && (
              <div className="order-1 w-full translate-y-0 transform text-center md:order-2 md:w-auto md:-translate-y-8">
                <Link href={`/profile/${first.username}`}>
                  <div className="relative mx-auto mb-6 h-32 w-32 rounded-full border-4 border-yellow-400 p-1 shadow-[0_0_50px_rgba(250,204,21,0.3)] transition-transform hover:scale-105 lg:h-40 lg:w-40">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={first.image || '/placeholder.png'}
                        fill
                        alt={first.name}
                        className="object-cover"
                        loader={imageLoader}
                      />
                    </div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce text-5xl text-yellow-400 drop-shadow-lg lg:text-6xl">
                      👑
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-4 py-1.5 text-sm font-black text-black shadow-lg">
                      1st
                    </div>
                  </div>
                  <h3 className="flex items-center justify-center gap-2 text-2xl font-black lg:text-3xl">
                    {first.name}
                    {first.isPro && (
                      <MdVerified className="text-lg text-[#006C5E] dark:text-[#4ADE80]" />
                    )}
                  </h3>
                  <p className="text-xl font-black text-yellow-500">
                    {first.points.toLocaleString()} pts
                  </p>
                </Link>
              </div>
            )}

            {/* 🥉 3rd Place (Right on Desktop) */}
            {third && (
              <div className="order-3 w-full text-center md:order-3 md:w-auto">
                <Link href={`/profile/${third.username}`}>
                  <div className="relative mx-auto mb-4 h-24 w-24 rounded-full border-4 border-orange-400 p-1 transition-transform hover:scale-105 lg:h-28 lg:w-28">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={third.image || '/placeholder.png'}
                        fill
                        alt={third.name}
                        className="object-cover"
                        loader={imageLoader}
                      />
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-orange-400 px-3 py-1 text-xs font-black text-white shadow-lg">
                      3rd
                    </div>
                  </div>
                  <h3 className="flex items-center justify-center gap-1 text-xl font-bold">
                    {third.name}
                    {third.isPro && (
                      <MdVerified className="text-sm text-[#006C5E] dark:text-[#4ADE80]" />
                    )}
                  </h3>
                  <p className="font-bold text-[#006C5E] dark:text-[#4ADE80]">
                    {third.points.toLocaleString()} pts
                  </p>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* --- THE REST (List) --- */}
        {rest.length > 0 && (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-xl dark:border-white/5 dark:bg-[#152a26]">
            {rest.map((chef, index) => (
              <Link href={`/profile/${chef.username}`} key={chef.id}>
                <div className="flex items-center gap-6 border-b border-gray-100 p-6 transition-colors last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5">
                  <span className="w-8 text-center text-xl font-black text-gray-300 dark:text-gray-600">
                    {index + 4}
                  </span>

                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                    <Image
                      src={chef.image || '/placeholder.png'}
                      fill
                      alt="User"
                      className="object-cover"
                      loader={imageLoader}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="flex items-center gap-1 truncate font-bold text-gray-900 dark:text-white">
                      {chef.name}
                      {chef.isPro && (
                        <MdVerified className="text-xs text-[#006C5E] dark:text-[#4ADE80]" />
                      )}
                    </h4>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      @{chef.username}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {chef.points.toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                      Points
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
