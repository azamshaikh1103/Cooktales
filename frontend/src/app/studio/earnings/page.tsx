import { WalletCards } from 'lucide-react';
import Link from 'next/link';

export default function EarningsPage() {
  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-semibold text-[#101827] dark:text-white">Monetization</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Payouts will appear here when CookTale creator earnings are available.
        </p>
      </header>

      <section className="rounded-[28px] border border-gray-200 bg-white px-6 py-12 text-center dark:border-white/10 dark:bg-[#0d1f1c] sm:px-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f7f6] text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
          <WalletCards className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-[#101827] dark:text-white">
          Creator payouts are not available yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
          We have removed the sample balance and sample payout history so this page only shows real information.
        </p>
        <Link
          href="/membership"
          className="mt-6 inline-flex rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[#006C5E]/40 hover:text-[#006C5E] dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80]/40 dark:hover:text-[#4ADE80]"
        >
          View membership options
        </Link>
      </section>
    </div>
  );
}
