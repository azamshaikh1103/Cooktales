'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdAnalytics, MdAttachMoney, MdDashboard, MdRestaurantMenu } from 'react-icons/md';

const navigation = [
  { href: '/studio', icon: <MdDashboard />, label: 'Overview' },
  { href: '/studio/content', icon: <MdRestaurantMenu />, label: 'Content' },
  { href: '/studio/analytics', icon: <MdAnalytics />, label: 'Analytics' },
  { href: '/studio/earnings', icon: <MdAttachMoney />, label: 'Monetization' },
];

export default function StudioSidebar({
  user,
}: {
  user: { name?: string | null; username?: string | null; image?: string | null };
}) {
  const pathname = usePathname();

  return (
    <section className="mb-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-9">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#006C5E] uppercase dark:text-[#4ADE80]">
            Creator Studio
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#101827] sm:text-3xl dark:text-white">
            Your CookTale kitchen
          </h1>
        </div>

        <Link
          href={`/profile/${user.username}`}
          className="flex items-center gap-3 self-start rounded-2xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#006C5E]/40 hover:text-[#006C5E] sm:self-auto dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80]/40 dark:hover:text-[#4ADE80]"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[#f1f7f6] dark:bg-white/10">
            {user.image ? <Image src={user.image} width={32} height={32} alt="" /> : null}
          </div>
          <span className="max-w-36 truncate">{user.name || 'My profile'}</span>
        </Link>
      </div>

      <nav
        className="flex gap-2 overflow-x-auto border-t border-gray-200 px-4 py-3 dark:border-white/10"
        aria-label="Creator Studio navigation"
      >
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-[#0d1f1c]'
                  : 'text-gray-500 hover:bg-[#f1f7f6] hover:text-[#006C5E] dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-[#4ADE80]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
