'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FaHeart, FaGlobeAmericas, FaCode, FaArrowRight } from 'react-icons/fa';
import { BsStars, BsLightningChargeFill } from 'react-icons/bs';
import { IoMdInfinite } from 'react-icons/io';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import imageLoader from '@/lib/loader';

export default function AboutUs() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#fafafa] font-sans text-gray-900 transition-colors duration-500 dark:bg-[#0d1f1c] dark:text-white">
      <Navbar />

      <main>
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
          <div className="pointer-events-none absolute top-0 left-1/2 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[#006C5E]/5 blur-[120px] dark:bg-[#006C5E]/10" />
          <div className="pointer-events-none absolute top-20 right-0 opacity-[0.03] select-none dark:opacity-[0.02]">
            <span className="text-[15vw] font-black">ORIGIN</span>
          </div>

          <div className="relative z-10 container mx-auto px-6 text-center lg:px-24">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-[#006C5E]/10 px-4 py-1.5 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:bg-[#006C5E]/20 dark:text-[#4ADE80]">
              <BsStars /> Our Story
            </div>

            <h1 className="mb-8 text-5xl leading-[1.1] font-black lg:text-8xl">
              We believe food is <br />
              <span className="bg-linear-to-r from-[#006C5E] to-[#009478] bg-clip-text text-transparent dark:from-[#4ADE80] dark:to-[#006C5E]">
                a universal language.
              </span>
            </h1>

            <p className="mx-auto max-w-3xl text-xl leading-relaxed font-medium text-gray-500 lg:text-2xl dark:text-gray-500">
              CookTale isn't just a recipe book. It's a digital kitchen where culture, technology,
              and flavor collide.
            </p>
          </div>
        </section>

        <section className="border-t border-gray-100 py-20 lg:py-32 dark:border-white/5">
          <div className="container mx-auto px-6 lg:px-24">
            <div className="flex flex-col items-center gap-16 lg:flex-row lg:gap-24">
              <div className="relative lg:w-1/2">
                <div className="group relative aspect-4/5 rotate-3 overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-700 hover:rotate-0">
                  <Image
                    src="https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000&auto=format&fit=crop"
                    fill
                    alt="Cooking together"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    loader={imageLoader}
                  />
                  <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
                </div>

                <div className="absolute -bottom-10 -left-10 hidden max-w-xs rounded-4xl border border-gray-100 bg-white p-8 shadow-xl md:block dark:border-white/10 dark:bg-[#152a26]">
                  <p className="mb-2 text-2xl font-bold text-[#006C5E] dark:text-[#4ADE80]">10k+</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-500">
                    Recipes shared by our community in the last month alone.
                  </p>
                </div>
              </div>

              <div className="lg:w-1/2">
                <h2 className="mb-8 text-4xl leading-tight font-black">
                  From a single kitchen <br /> to a global table.
                </h2>
                <div className="space-y-6 text-lg leading-loose text-gray-600 dark:text-gray-300">
                  <p>
                    It started with a simple frustration: recipe sites were cluttered, slow, and
                    disconnected. Cooking should be about <strong>connection</strong>, not dodging
                    pop-up ads.
                  </p>
                  <p>
                    We built CookTale to be the{' '}
                    <span className="font-bold text-[#006C5E] dark:text-[#4ADE80]">
                      cleanest, most beautiful place
                    </span>{' '}
                    on the internet to document your culinary journey. Whether you are a Michelin
                    chef or a student making ramen, your story matters here.
                  </p>
                </div>

                <div className="mt-10 flex gap-6">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black">2025</span>
                    <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">
                      Founded
                    </span>
                  </div>
                  <div className="w-px bg-gray-200 dark:bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-black">Global</span>
                    <span className="text-sm font-bold tracking-wider text-gray-500 uppercase">
                      Community
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- VALUES (Bento Grid) --- */}
        <section className="relative overflow-hidden bg-gray-50 py-20 lg:py-32 dark:bg-[#112220]">
          <div className="relative z-10 container mx-auto px-6 lg:px-24">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-6 text-3xl font-black lg:text-5xl">Our Core Values.</h2>
              <p className="text-lg text-gray-500 dark:text-gray-500">
                We don't just write code; we curate experiences. Here is what drives us.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Card 1: Large */}
              <div className="group flex min-h-[300px] flex-col justify-between rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm transition-transform duration-500 hover:-translate-y-1 md:col-span-2 dark:border-white/5 dark:bg-[#152a26]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-500 dark:bg-red-900/20">
                  <FaHeart />
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold">Passion over Perfection.</h3>
                  <p className="leading-relaxed text-gray-500 dark:text-gray-500">
                    We celebrate burnt toast as much as soufflés. Cooking is a messy, beautiful
                    learning process. We built this platform to honor the attempt, not just the
                    result.
                  </p>
                </div>
              </div>

              {/* Card 2: Tall */}
              <div className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[2.5rem] bg-[#006C5E] p-10 text-white shadow-xl transition-transform duration-500 hover:-translate-y-1 md:row-span-2 dark:bg-[#004d41]">
                <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl text-white">
                  <FaGlobeAmericas />
                </div>
                <div className="relative z-10">
                  <h3 className="mb-3 text-2xl font-bold">Borderless Flavor.</h3>
                  <p className="leading-relaxed text-white/80">
                    Food has no borders. We are building a map of the world's flavors, accessible to
                    everyone, everywhere.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group flex min-h-[300px] flex-col justify-between rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm transition-transform duration-500 hover:-translate-y-1 dark:border-white/5 dark:bg-[#152a26]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-500 dark:bg-amber-900/20">
                  <BsLightningChargeFill />
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold">Speed & Soul.</h3>
                  <p className="leading-relaxed text-gray-500 dark:text-gray-500">
                    We optimize for speed so you spend less time loading and more time cooking. Fast
                    app, slow food.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="group flex min-h-[300px] flex-col justify-between rounded-[2.5rem] border border-gray-100 bg-white p-10 shadow-sm transition-transform duration-500 hover:-translate-y-1 dark:border-white/5 dark:bg-[#152a26]">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-2xl text-purple-500 dark:bg-purple-900/20">
                  <IoMdInfinite />
                </div>
                <div>
                  <h3 className="mb-3 text-2xl font-bold">Forever Free.</h3>
                  <p className="leading-relaxed text-gray-500 dark:text-gray-500">
                    Our core features will always be free. We believe good food education is a human
                    right.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- TEAM SECTION --- */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-6 text-center lg:px-24">
            <h2 className="mb-16 text-3xl font-black lg:text-5xl">The Builders.</h2>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
              {/* Founder Card */}
              <div className="group relative rounded-[2.5rem] border border-gray-100 bg-white p-8 transition-all hover:border-[#006C5E]/30 hover:shadow-xl dark:border-white/5 dark:bg-[#152a26]">
                <div className="mx-auto mb-6 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-lg transition-transform group-hover:scale-110 dark:border-[#152a26] dark:bg-white/10">
                  {/* Put your image here */}
                  <div className="flex h-full w-full items-center justify-center text-4xl">👨‍💻</div>
                </div>
                <h3 className="text-xl font-bold">Azam (The Founder)</h3>
                <p className="mb-4 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
                  Lead Developer
                </p>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-500">
                  Coding late nights and cooking early mornings. Building the platform I always
                  wished existed.
                </p>
                <div className="mt-6 flex justify-center gap-4 text-gray-500">
                  <FaCode className="cursor-pointer transition-colors hover:text-[#006C5E]" />
                </div>
              </div>

              {/* Community Card */}
              <div className="group relative rounded-[2.5rem] border border-dashed border-gray-300 bg-linear-to-br from-gray-50 to-gray-100 p-8 dark:border-white/10 dark:from-[#112220] dark:to-[#0d1f1c]">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#006C5E]/10 text-4xl text-[#006C5E] transition-transform group-hover:rotate-12 dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
                  👋
                </div>
                <h3 className="text-xl font-bold">The Community</h3>
                <p className="mb-4 text-xs font-bold tracking-widest text-[#006C5E] uppercase dark:text-[#4ADE80]">
                  Content Creators
                </p>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-500">
                  The thousands of chefs, moms, students, and foodies who make CookTale alive. This
                  is your platform.
                </p>
                <div className="mt-6">
                  <Link
                    href="/community"
                    className="border-b border-gray-300 pb-0.5 text-xs font-bold transition-colors hover:border-[#006C5E] hover:text-[#006C5E]"
                  >
                    Join the Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BIG CTA --- */}
        <section className="pb-20">
          <div className="container mx-auto px-6 lg:px-24">
            <div className="relative overflow-hidden rounded-[3rem] bg-[#006C5E] p-12 text-center text-white shadow-2xl shadow-[#006C5E]/30 lg:p-24">
              <div className="relative z-10">
                <h2 className="mb-6 text-4xl font-black lg:text-6xl">Ready to Cook?</h2>
                <p className="mx-auto mb-10 max-w-xl text-lg text-white/80">
                  The kitchen is open. The ingredients are fresh. The only thing missing is you.
                </p>
                <Link
                  href="/recipe"
                  className="inline-flex items-center gap-3 rounded-full bg-white px-10 py-5 text-lg font-bold text-[#006C5E] shadow-xl transition-all hover:scale-105 hover:bg-gray-100"
                >
                  Browse Recipes <FaArrowRight />
                </Link>
              </div>

              {/* Decor */}
              <div
                className="absolute top-0 left-0 h-full w-full opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                }}
              />
              <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-white/20 blur-[100px]" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
