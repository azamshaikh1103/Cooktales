'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaHandshake, FaChartLine, FaBullhorn, FaArrowRight, FaUtensils } from 'react-icons/fa';
import { BiWorld } from 'react-icons/bi';
import { BsStars } from 'react-icons/bs';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import imageLoader from '@/lib/loader';

// Mock Partners (Replace with real logos later)
const PARTNERS = [
  {
    name: 'WholeFoods',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Whole_Foods_Market_2016_logo.svg',
  },
  {
    name: 'KitchenAid',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/KitchenAid_logo.svg',
  },
  {
    name: 'HelloFresh',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/92/HelloFresh_Logo.svg',
  },
  {
    name: 'Instacart',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Instacart_logo_and_wordmark.svg',
  },
  {
    name: 'LeCreuset',
    logo: 'https://upload.wikimedia.org/wikipedia/en/8/8d/Le_Creuset_logo.svg',
  },
];

export default function PartnersPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main className="relative grow pt-24 pb-20 lg:pt-32">
        {/* --- BACKGROUND AMBIENCE --- */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/2 h-[800px] w-[1200px] -translate-x-1/2 rounded-full bg-indigo-100 opacity-30 blur-[120px] dark:bg-indigo-900/10" />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-24">
          {/* --- HERO --- */}
          <div className="mx-auto mb-24 max-w-4xl text-center lg:mb-32">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-indigo-600 uppercase transition-colors dark:border-white/10 dark:bg-white/5 dark:text-indigo-400">
              <FaHandshake /> Partner Program
            </div>

            <h1 className="mb-8 text-5xl leading-[1.1] font-black lg:text-7xl">
              Let's build the <br />
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">
                Future of Food.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-500 dark:text-gray-500">
              Connect with the world's most engaged culinary community. Whether you're a brand, a
              creator, or a tech platform, there is a seat at our table.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                className="rounded-xl bg-black px-8 py-4 font-bold text-white shadow-xl transition-transform hover:scale-105 dark:bg-white dark:text-black"
              >
                Become a Partner
              </button>
              <button
                type="button"
                className="rounded-xl border border-gray-200 px-8 py-4 font-bold transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                Download Media Kit
              </button>
            </div>
          </div>

          {/* --- LOGO WALL --- */}
          <div className="mb-32">
            <p className="mb-10 text-center text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">
              Trusted by Industry Leaders
            </p>
            <div className="grid grid-cols-2 items-center gap-8 opacity-60 md:grid-cols-3 lg:grid-cols-6">
              {PARTNERS.map((p, i) => (
                <div
                  key={i}
                  className="group flex h-16 cursor-pointer items-center justify-center grayscale transition-all duration-500 hover:scale-110 hover:grayscale-0"
                >
                  <div className="relative h-12 w-32">
                    <Image
                      src={p.logo}
                      fill
                      alt={p.name}
                      className="object-contain dark:invert"
                      loader={imageLoader}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- BENTO BENEFITS --- */}
          <div className="mb-32">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              {/* Card 1 (Large) */}
              <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 transition-all hover:-translate-y-1 hover:shadow-xl md:col-span-2 dark:border-white/5 dark:bg-[#152a26]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                  <BiWorld />
                </div>
                <h3 className="mb-4 text-3xl font-bold">Global Reach, Local Flavor.</h3>
                <p className="max-w-lg text-lg leading-relaxed text-gray-500 dark:text-gray-500">
                  Our algorithm matches your brand with hyper-relevant local communities. Don't just
                  buy ads; become part of the recipe.
                </p>
              </div>

              {/* Card 2 (Stats) */}
              <div className="rounded-[2.5rem] border border-transparent bg-[#006C5E] p-10 text-white transition-all hover:-translate-y-1 hover:shadow-xl">
                <FaChartLine className="mb-6 text-4xl text-[#4ADE80]" />
                <h3 className="mb-2 text-5xl font-black">3.5M+</h3>
                <p className="font-medium text-white/80">Monthly Active Chefs</p>
                <div className="my-6 h-px w-full bg-white/20" />
                <p className="text-sm text-white/60">
                  Growing at 120% YoY. The fastest growing food network.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-[#152a26]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-50 text-2xl text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
                  <FaBullhorn />
                </div>
                <h3 className="mb-3 text-2xl font-bold">Storytelling.</h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Go beyond banner ads. Co-create interactive challenges and sponsored stories.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-[2.5rem] border border-gray-100 bg-white p-10 transition-all hover:-translate-y-1 hover:shadow-xl md:col-span-2 dark:border-white/5 dark:bg-[#152a26]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                  <BsStars />
                </div>
                <h3 className="mb-3 text-2xl font-bold">For Creators & Brands.</h3>
                <p className="leading-relaxed text-gray-500 dark:text-gray-500">
                  Whether you are selling the best olive oil or building your personal brand,
                  CookTale provides the tools to monetize your passion.
                </p>
              </div>
            </div>
          </div>

          {/* --- DUAL CTA --- */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <CTA_Card
              title="For Brands"
              desc="Integrate your products into our recipe engine."
              icon={<FaHandshake />}
              link="/contact?type=business"
            />
            <CTA_Card
              title="For Creators"
              desc="Join the Partner Program and earn revenue."
              icon={<FaUtensils />}
              link="/community"
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// --- SUB COMPONENTS ---

const CTA_Card = ({ title, desc, icon, link }: any) => (
  <Link
    href={link}
    className="group rounded-[2.5rem] border border-gray-100 bg-white p-10 text-center transition-all hover:border-indigo-500/30 hover:shadow-2xl dark:border-white/5 dark:bg-[#0f221f] dark:hover:border-indigo-400/30"
  >
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-3xl text-gray-900 transition-transform group-hover:scale-110 group-hover:rotate-3 dark:bg-white/5 dark:text-white">
      {icon}
    </div>
    <h3 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">{title}</h3>
    <p className="mx-auto mb-8 max-w-xs text-gray-500 dark:text-gray-500">{desc}</p>
    <span className="inline-flex items-center gap-2 font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
      Get Started <FaArrowRight />
    </span>
  </Link>
);
