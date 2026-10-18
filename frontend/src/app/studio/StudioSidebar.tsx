'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdDashboard,
  MdAnalytics,
  MdRestaurantMenu,
  MdAttachMoney,
  MdArrowBack,
} from 'react-icons/md';
import Image from 'next/image';

export default function StudioSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="sticky top-0 z-50 hidden h-screen w-72 flex-col border-r border-gray-200 bg-white transition-colors duration-500 lg:flex dark:border-white/5 dark:bg-[#0d1f1c]">
      {/* Brand */}
      <div className="flex items-center gap-3 p-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006C5E] font-black text-white shadow-lg shadow-[#006C5E]/20">
          C
        </div>
        <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Studio
        </span>
        {user.isPro && (
          <span className="ml-auto rounded border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
            Pro
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-4">
        <NavItem
          href="/studio"
          icon={<MdDashboard />}
          label="Overview"
          active={isActive('/studio')}
        />
        <NavItem
          href="/studio/content"
          icon={<MdRestaurantMenu />}
          label="Content"
          active={isActive('/studio/content')}
        />
        <NavItem
          href="/studio/analytics"
          icon={<MdAnalytics />}
          label="Analytics"
          active={isActive('/studio/analytics')}
        />
        <NavItem
          href="/studio/earnings"
          icon={<MdAttachMoney />}
          label="Monetization"
          active={isActive('/studio/earnings')}
        />
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-100 p-4 dark:border-white/5">
        <Link
          href={`/profile/${user.username}`}
          className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-100 bg-gray-200 dark:border-transparent dark:bg-white/10">
            {user.image && <Image src={user.image} width={40} height={40} alt="" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500 transition-colors group-hover:text-[#006C5E] dark:text-gray-400 dark:group-hover:text-[#4ADE80]">
              <MdArrowBack /> Back to CookTale
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}

const NavItem = ({ href, icon, label, active }: any) => (
  <Link
    href={href}
    className={`flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all ${
      active
        ? 'bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]'
        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
    }`}
  >
    <span className="text-xl">{icon}</span>
    {label}
  </Link>
);
