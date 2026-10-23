import { notFound } from 'next/navigation';
import Image from 'next/image';
import { communityClient } from '@/lib/api/communityClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import AdUnit from '@/components/AdUnit';
import CommentSection from '../CommentSection';
import RichContent from '../RichContent';
import imageLoader from '@/lib/loader';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bid?: string }>;
}

export default async function DiscussionPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await communityClient.getDiscussion(slug).catch(() => null);

  if (!result) notFound();
  const { discussion, attachments } = result;

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main className="container mx-auto max-w-5xl px-6 pt-28 pb-20 lg:px-24">
        {/* Breadcrumbs */}
        <div className="mb-8 flex items-center gap-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
          <span className="text-[#006C5E] dark:text-[#4ADE80]">Community</span> /{' '}
          {discussion.category}
        </div>

        {/* --- MAIN POST --- */}
        <div className="mb-12 flex gap-6">
          {/* Vote Rail */}
          <div className="hidden w-10 shrink-0 flex-col items-center gap-2 md:flex">
            <button type="button" className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#006C5E] dark:hover:bg-white/10 dark:hover:text-[#4ADE80]">
              <FaArrowUp />
            </button>
            <span className="text-lg font-black">{discussion._count.likes}</span>
            <button type="button" className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-white/10">
              <FaArrowDown />
            </button>
          </div>

          <div className="flex-1">
            <h1 className="mb-6 text-3xl leading-tight font-black lg:text-4xl">
              {discussion.title}
            </h1>

            <div className="mb-8 flex items-center gap-3 border-b border-gray-200 pb-8 dark:border-white/10">
              <div className="relative h-10 w-10 overflow-hidden rounded-full border border-gray-200 dark:border-white/10">
                <Image
                  src={discussion.author.image || '/placeholder.png'}
                  fill
                  alt="User"
                  loader={imageLoader}
                  className="object-cover"
                />
              </div>
              <div className="text-sm">
                <span className="mr-2 font-bold">{discussion.author.name}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {new Date(discussion.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span className="rounded-full bg-[#006C5E]/10 px-3 py-1 text-xs font-bold text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                {discussion.category}
              </span>
            </div>

            {/* --- RICH CONTENT RENDERER --- */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <RichContent content={discussion.content} attachments={attachments} />
            </div>
          </div>
        </div>

        <AdUnit
          type="banner"
          slot="community-thread-inline"
          className="mx-auto mb-12 max-w-3xl"
        />

        {/* Comments */}
        <CommentSection
          comments={discussion.comments}
          discussionId={discussion.id}
        />
      </main>
      <Footer />
    </div>
  );
}
