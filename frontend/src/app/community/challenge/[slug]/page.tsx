'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FaClock, FaTrophy, FaUsers } from 'react-icons/fa';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { communityClient, type Challenge } from '@/lib/api/communityClient';
import imageLoader from '@/lib/loader';

function daysLeft(endDate: string) { return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)); }

export default function ChallengePage() {
  const params = useParams<{ slug: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!params.slug) return; void communityClient.getChallenge(params.slug).then((result) => setChallenge(result.challenge)).catch(() => setChallenge(null)).finally(() => setLoading(false)); }, [params.slug]);

  if (loading) return <div className="min-h-screen bg-[#0d1f1c]"><Navbar /><main className="pt-32 text-center text-white">Loading challenge...</main></div>;
  if (!challenge) return <div className="min-h-screen bg-[#0d1f1c]"><Navbar /><main className="pt-32 text-center text-white">Challenge not found.</main></div>;
  const active = challenge.isActive && new Date(challenge.endDate).getTime() > Date.now();
  return <div className="min-h-screen bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]"><Navbar />
    <section className="relative min-h-[52vh] overflow-hidden bg-[#0d1f1c] text-white">
      {challenge.coverImage ? <Image src={challenge.coverImage} fill alt={challenge.title} className="object-cover opacity-50" loader={imageLoader} priority /> : null}
      <div className="absolute inset-0 bg-linear-to-t from-[#0d1f1c] via-[#0d1f1c]/75 to-black/20" />
      <div className="relative container mx-auto flex min-h-[52vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-32 lg:px-24"><div className="mb-5 flex items-center gap-4"><span className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${active ? 'bg-green-400 text-black' : 'bg-white/15'}`}>{active ? 'Active challenge' : 'Completed challenge'}</span>{active && <span className="flex items-center gap-2 text-sm font-bold text-orange-200"><FaClock /> {daysLeft(challenge.endDate)} days left</span>}</div><h1 className="max-w-4xl text-4xl font-black lg:text-6xl">{challenge.title}</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-200">{challenge.description}</p><div className="mt-7 flex flex-wrap gap-4"><div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 px-5 py-3"><FaTrophy className="text-yellow-400" /><span>{challenge.prize || 'Community recognition'}</span></div><div className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 px-5 py-3"><FaUsers /><span>{challenge._count.entries} entries</span></div></div></div>
    </section>
    <main className="container mx-auto max-w-6xl px-6 py-16 lg:px-24"><h2 className="mb-8 text-3xl font-black text-gray-900 dark:text-white">Submissions</h2>{challenge.entries && challenge.entries.length ? <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">{challenge.entries.map((entry) => <Link key={entry.id} href={entry.recipe.slug ? `/recipe/${entry.recipe.slug}` : '#'} className="overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-white/5 dark:bg-[#152a26]"><div className="relative aspect-[4/3] bg-gray-100 dark:bg-white/5">{entry.recipe.mainImage && <Image src={entry.recipe.mainImage} fill alt={entry.recipe.name} className="object-cover" loader={imageLoader} />}</div><div className="p-5"><h3 className="font-bold text-gray-900 dark:text-white">{entry.recipe.name}</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">by {entry.user.name}</p></div></Link>)}</div> : <div className="rounded-3xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-white/15 dark:text-gray-400">No entries have been submitted yet.</div>}</main><Footer />
  </div>;
}
