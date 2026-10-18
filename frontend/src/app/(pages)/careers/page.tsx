'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FaArrowRight,
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaLaptopCode,
  FaUtensils,
  FaHeartbeat,
} from 'react-icons/fa';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

const SHOW_MOCK_JOBS = false;

const MOCK_JOBS = [
  {
    id: 1,
    title: 'Senior Frontend Chef (React)',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k - $160k',
    tags: ['Next.js', 'Tailwind', 'TypeScript'],
  },
  {
    id: 2,
    title: 'Product Designer (UI/UX)',
    department: 'Design',
    location: 'New York / Remote',
    type: 'Full-time',
    salary: '$100k - $140k',
    tags: ['Figma', 'Prototyping', 'Systems'],
  },
  {
    id: 3,
    title: 'Community Manager',
    department: 'Marketing',
    location: 'London / Remote',
    type: 'Contract',
    salary: '$60k - $80k',
    tags: ['Social Media', 'Content', 'Events'],
  },
];

export default function CareersPage() {
  const [filter, setFilter] = useState('');

  const jobs = SHOW_MOCK_JOBS
    ? MOCK_JOBS.filter(
        (job) =>
          job.title.toLowerCase().includes(filter.toLowerCase()) ||
          job.department.toLowerCase().includes(filter.toLowerCase())
      )
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <Navbar />

      <main className="relative grow pt-24 pb-20 lg:pt-32">
        {/* --- BACKGROUND AMBIENCE --- */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-[#006C5E]/5 blur-[120px] dark:bg-[#006C5E]/20" />
          <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-[100px] dark:bg-blue-900/10" />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-24">
          {/* --- HERO --- */}
          <div className="mx-auto mb-20 max-w-4xl text-center lg:mb-32">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-bold tracking-widest text-gray-600 uppercase transition-colors dark:border-white/10 dark:bg-white/5 dark:text-[#4ADE80]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#006C5E] dark:bg-[#4ADE80]" />
              We are Hiring
            </div>

            <h1 className="mb-8 text-5xl leading-[1.1] font-black text-gray-900 lg:text-8xl dark:text-white">
              Cook the <br />
              <span className="bg-linear-to-r from-[#006C5E] to-[#009478] bg-clip-text text-transparent dark:from-[#4ADE80] dark:to-[#006C5E]">
                Source Code.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-500 dark:text-gray-500">
              Join the team building the world's most beautiful culinary platform. We serve code,
              design, and experiences—always al dente.
            </p>
          </div>

          {/* --- PERKS GRID --- */}
          <div className="mb-24 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mb-32">
            <PerkCard
              icon={<FaLaptopCode />}
              title="Remote First"
              desc="Work from your kitchen, a cafe, or the beach. We care about output, not hours."
            />
            <PerkCard
              icon={<FaUtensils />}
              title="Food Budget"
              desc="Monthly stipends for grocery runs and cooking classes. We eat what we build."
            />
            <PerkCard
              icon={<FaHeartbeat />}
              title="Full Health"
              desc="Comprehensive coverage for you and your family. Physical and mental well-being first."
            />
          </div>

          {/* --- JOB BOARD SECTION --- */}
          <div id="openings" className="mx-auto max-w-5xl">
            <div className="mb-10 flex flex-col items-end justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Open Roles</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-500">
                  Come build the future of food with us.
                </p>
              </div>

              {/* Search Bar (Only show if there are jobs) */}
              {jobs.length > 0 && (
                <div className="group relative w-full md:w-auto">
                  <FaSearch className="absolute top-3.5 left-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search roles..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pr-4 pl-10 text-gray-900 transition-all outline-none focus:border-[#006C5E] md:w-64 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#4ADE80]"
                  />
                </div>
              )}
            </div>

            {/* --- JOB LISTINGS --- */}
            <div className="space-y-4">
              {jobs.length > 0 ? (
                // STATE 1: JOBS EXIST
                jobs.map((job) => <JobCard key={job.id} job={job} />)
              ) : (
                // STATE 2: NO JOBS (EMPTY STATE)
                <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-white py-20 text-center transition-colors dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 text-6xl opacity-50 grayscale">👩‍🍳</div>
                  <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                    No open roles right now.
                  </h3>
                  <p className="mx-auto mb-8 max-w-md text-gray-500 dark:text-gray-500">
                    But we are always looking for exceptional talent. If you think you can bring
                    some spice to the table, pitch us.
                  </p>
                  <a
                    href="mailto:careers@cooktale.in"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#006C5E] px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:bg-[#005a4e] dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    Email the Founder <FaArrowRight />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// --- SUB COMPONENTS ---

const PerkCard = ({ icon, title, desc }: any) => (
  <div className="rounded-4xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#006C5E]/20 hover:shadow-xl dark:border-white/5 dark:bg-[#152a26] dark:hover:border-[#4ADE80]/20">
    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#006C5E]/10 text-2xl text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
      {icon}
    </div>
    <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-500">{desc}</p>
  </div>
);

const JobCard = ({ job }: { job: any }) => (
  <Link
    href={`/careers/${job.id}`}
    className="group block rounded-3xl border border-gray-100 bg-white p-6 transition-all hover:border-[#006C5E] hover:shadow-lg lg:p-8 dark:border-white/5 dark:bg-[#152a26] dark:hover:border-[#4ADE80]"
  >
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
      <div>
        <div className="mb-2 flex items-center gap-3 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-500">
          <span>{job.department}</span>
          <span>•</span>
          <span className="text-[#006C5E] dark:text-[#4ADE80]">{job.type}</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 transition-colors group-hover:text-[#006C5E] dark:text-white dark:group-hover:text-[#4ADE80]">
          {job.title}
        </h3>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <FaMapMarkerAlt /> {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <FaDollarSign /> {job.salary}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {job.tags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-white/5 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors group-hover:border-[#006C5E] group-hover:bg-[#006C5E] group-hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-gray-500 dark:group-hover:bg-[#4ADE80] dark:group-hover:text-black">
          <FaArrowRight className="transition-transform duration-300 group-hover:-rotate-45" />
        </span>
      </div>
    </div>
  </Link>
);
