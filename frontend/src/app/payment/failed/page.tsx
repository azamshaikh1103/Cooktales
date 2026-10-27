'use client';

import Link from 'next/link';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function PaymentFailed() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1f1c] p-6 text-center">
      <div className="w-full max-w-lg rounded-[3rem] border border-red-500/30 bg-[#152a26] p-12 shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-4xl text-red-500">
          <FaExclamationTriangle />
        </div>
        <h1 className="mb-4 text-4xl font-black text-white">Payment Failed</h1>
        <p className="mb-10 text-lg text-gray-400">
          We couldn't process your transaction. Your card was not charged. Don't worry, the kitchen
          is still open.
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="w-full rounded-2xl bg-white py-4 font-bold text-black transition-colors hover:bg-gray-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
