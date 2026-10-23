import Image from 'next/image';
import Link from 'next/link';
import { FaFire, FaTrophy, FaCommentDots, FaMedal } from 'react-icons/fa';
import { MdVerified, MdForum, MdOutlineTimer, MdAccountCircle } from 'react-icons/md';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import imageLoader from "@/lib/loader";
import { communityClient } from '@/lib/api/communityClient';

// Helper for "2h ago" format
function timeAgo(date: Date | string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}y ago`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}mo ago`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d ago`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h ago`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)}m ago`;
  return 'Just now';
}

export default async function CommunityPage() {
  const {
    topDiscussions,
    activeChallenge,
    topChefs,
    totalRecipes,
    totalStories,
    totalChefs,
    totalDiscussions,
  } = await communityClient.snapshot().catch(() => ({
    topDiscussions: [], activeChallenge: null, topChefs: [], totalRecipes: 0, totalStories: 0, totalChefs: 0, totalDiscussions: 0,
  }));

  const daysLeft = activeChallenge
    ? Math.ceil(
        (new Date(activeChallenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <div className="border-b border-gray-200 bg-white pt-28 pb-14 dark:border-white/10 dark:bg-[#0d1f1c] sm:pt-32 sm:pb-20">
        <div className="container mx-auto px-6 lg:px-24">
          <div className="flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center rounded-full bg-[#006C5E]/10 px-3 py-1 text-sm font-semibold text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                CookTale community
              </div>
              <h1 className="mb-5 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl dark:text-white">
                Cook, ask, and share <span className="text-[#006C5E] dark:text-[#4ADE80]">together.</span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-gray-600 dark:text-gray-300 sm:text-lg">
                Practical cooking questions, useful answers, and friendly challenges from people who cook at home.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/community/discussion"
                  className="inline-flex items-center gap-2 rounded-full bg-[#006C5E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#62e891]"
                >
                  <MdForum className="text-lg" /> Join a discussion
                </Link>
                <Link
                  href="/community-guidelines"
                  className="rounded-full border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#006C5E]/40 hover:text-[#006C5E] dark:border-white/15 dark:text-gray-200 dark:hover:border-[#4ADE80]/50 dark:hover:text-[#4ADE80]"
                >
                  Community guidelines
                </Link>
              </div>
            </div>

            {/* Community Stat Card */}
            <div className="relative hidden lg:block">
								<div className="w-80 rounded-3xl border border-[#006C5E]/20 bg-white p-1 shadow-[0_18px_45px_-30px_rgba(0,108,94,0.55)] dark:border-[#4ADE80]/20 dark:bg-[#152a26]">
									<div className="rounded-[1.3rem] bg-[#f1f7f6] p-6 dark:bg-[#112220]">
										<div className="flex items-center gap-2">
											<span className="h-2 w-2 rounded-full bg-[#006C5E] dark:bg-[#4ADE80]" aria-hidden="true" />
											<p className="text-sm font-medium tracking-wide text-[#42615a] dark:text-[#b7d2c8]">CookTale so far</p>
										</div>
										<div className="mt-5 grid grid-cols-2 gap-2">
                  <StatRow label="People" value={totalChefs.toLocaleString()} />
                  <StatRow label="Recipes" value={totalRecipes.toLocaleString()} />
                  <StatRow label="Stories" value={totalStories.toLocaleString()} />
                  <StatRow label="Discussions" value={totalDiscussions.toLocaleString()} />
										</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN GRID LAYOUT --- */}
      <div className="container mx-auto px-6 py-12 lg:px-24 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* LEFT COLUMN (8 Cols) */}
          <div className="lg:col-span-8">
            {/* ACTIVE CHALLENGE CARD */}
            {activeChallenge && (
              <Link href={`/community/challenge/${activeChallenge.id}`}>
                <div className="group relative mb-12 cursor-pointer overflow-hidden rounded-[2.5rem] bg-gray-900 p-8 text-white shadow-2xl transition-transform hover:-translate-y-1 lg:p-12 dark:border dark:border-white/10 dark:bg-black">
                  {activeChallenge.coverImage && (
                    <Image
                      src={activeChallenge.coverImage}
                      alt={activeChallenge.title}
                      fill
                      className="object-cover opacity-40 transition-all duration-700 group-hover:opacity-30"
                      loader={imageLoader}
                    />
                  )}
                  <div className="relative z-10">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="rounded-lg bg-orange-500 px-3 py-1 text-xs font-bold tracking-wider text-white uppercase">
                        Weekly Challenge
                      </span>
                      <span className="flex items-center gap-1 text-sm font-bold text-orange-300">
                        <MdOutlineTimer /> {daysLeft} days left
                      </span>
                    </div>
                    <h2 className="mb-4 text-3xl font-black lg:text-4xl">
                      {activeChallenge.title}
                    </h2>
                    <p className="mb-8 line-clamp-2 max-w-md text-lg text-gray-300">
                      {activeChallenge.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-gray-400">
                        +{activeChallenge._count.entries} joined
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* DISCUSSIONS LIST */}
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Trending Discussions
              </h3>
              <Link
                href="/community/discussion"
                className="text-sm font-bold text-[#006C5E] hover:underline dark:text-[#4ADE80]"
              >
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {topDiscussions.map((topic) => (
                <Link href={`/community/discussion/${topic.slug}`} key={topic.id}>
                  <div className="group mb-4 cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#006C5E]/20 hover:shadow-md dark:border-white/5 dark:bg-white/5 dark:hover:border-[#4ADE80]/30">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#006C5E]/5 text-[#006C5E] transition-colors group-hover:bg-[#006C5E] group-hover:text-white dark:bg-[#006C5E]/20 dark:text-[#4ADE80] dark:group-hover:bg-[#4ADE80] dark:group-hover:text-black">
                        <FaCommentDots className="text-xl" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase dark:bg-white/10 dark:text-gray-300">
                            {topic.category}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            • {timeAgo(topic.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 transition-colors group-hover:text-[#006C5E] dark:text-gray-100 dark:group-hover:text-[#4ADE80]">
                          {topic.title}
                        </h4>
                        <div className="mt-3 flex items-center gap-6 text-xs font-bold text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <MdAccountCircle className="text-base" /> {topic.author.name}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FaFire className={topic._count.likes > 20 ? 'text-orange-500' : ''} />{' '}
                            {topic._count.likes} Likes
                          </span>
                          <span className="flex items-center gap-1.5">
                            Reply ({topic._count.comments})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {topDiscussions.length === 0 && (
                <div className="py-10 text-center text-gray-500">
                  No discussions yet. Be the first!
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (Leaderboard & Tags) */}
          <div className="space-y-8 lg:col-span-4">
            {/* LEADERBOARD */}
            <div className="top-24 rounded-4xl border border-gray-100 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-[#152a26]">
              <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-yellow-50 p-3 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <FaTrophy className="text-xl" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Top Chefs</h3>
                  <p className="text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                    All Time
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {topChefs.map((chef, index) => (
                  <Link href={`/profile/${chef.username}`} key={chef.id}>
                    <div className="flex cursor-pointer items-center gap-4 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                      <div className="w-4 text-center font-black text-gray-300 dark:text-gray-600">
                        {index + 1}
                      </div>
                      <div className="relative">
                        {chef.image ? (
                          <Image
                            src={chef.image}
                            width={40}
                            height={40}
                            className="rounded-full"
                            alt={chef.name}
                            loader={imageLoader}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006C5E] font-bold text-white">
                            {chef.name[0]}
                          </div>
                        )}
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 rounded-full bg-white p-0.5 text-yellow-400 shadow-sm dark:bg-gray-800">
                            <FaMedal />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="flex items-center gap-1 truncate text-sm font-bold text-gray-900 dark:text-gray-200">
                          {chef.name}
                          {chef.isPro && (
                            <MdVerified className="text-xs text-[#006C5E] dark:text-[#4ADE80]" />
                          )}
                        </h4>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          @{chef.username}
                        </p>
                      </div>
                      <div className="rounded-md bg-[#006C5E]/5 px-2 py-1 text-xs font-bold text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                        {chef.points.toLocaleString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-6 text-center dark:border-white/10">
                <Link
                  href="/community/leaderboard"
                  className="text-xs font-bold tracking-widest text-gray-400 uppercase transition-colors hover:text-[#006C5E] dark:text-gray-500 dark:hover:text-[#4ADE80]"
                >
                  View Full Leaderboard
                </Link>
              </div>
            </div>
            {/* ... Trending Tags & Newsletter ... */}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// --- HELPER ---
const StatRow = ({ label, value }: { label: string; value: string }) => (
	<div className="rounded-xl bg-white px-4 py-4 shadow-sm dark:bg-[#152a26]">
		<span className="block font-raleway text-2xl font-semibold tracking-tight text-[#18342e] dark:text-white">{value}</span>
		<span className="mt-1 block text-sm text-[#58736b] dark:text-[#a9c1b9]">{label}</span>
  </div>
);
