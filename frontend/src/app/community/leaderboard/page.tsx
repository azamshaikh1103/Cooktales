import Image from 'next/image';
import Link from 'next/link';
import { MdVerified } from 'react-icons/md';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { communityClient } from '@/lib/api/communityClient';
import imageLoader from '@/lib/loader';

// --- METADATA ---
export const metadata = {
  title: 'Community Leaderboard | CookTale',
  description: 'Chefs who have earned points in the CookTale community.',
};

export default async function LeaderboardPage() {
  const { users: chefs } = await communityClient.leaderboard().catch(() => ({ users: [] }));

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-20 lg:px-24">
        <div className="mb-12 max-w-2xl">
          <h1 className="mb-4 text-4xl font-black lg:text-5xl">
            Community <span className="text-[#006C5E] dark:text-[#4ADE80]">Leaderboard</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Real chefs ranked by the points they have earned on CookTale.
          </p>
        </div>

        {chefs.length > 0 ? (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-[#152a26]">
            {chefs.map((chef, index) => (
              <Link href={`/profile/${chef.username}`} key={chef.id}>
                <div className="flex items-center gap-4 border-b border-gray-100 p-5 transition-colors last:border-0 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5">
                  <span className="w-8 text-center font-black text-gray-400 dark:text-gray-500">
                    {index + 1}
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
        ) : (
          <div className="mx-auto max-w-3xl rounded-3xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm dark:border-white/10 dark:bg-[#152a26] dark:text-gray-400">
            No chefs have earned points yet. Publish a recipe or join a discussion to get started.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
