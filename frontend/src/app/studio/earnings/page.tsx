import { FaStripeS, FaMoneyBillWave, FaDownload, FaArrowUp } from 'react-icons/fa';

// --- MOCK DATA ---
const PAYOUTS = [
  { id: 'po_1Jk2', amount: 420.5, status: 'Paid', date: 'Dec 01, 2025', bank: '**** 4242' },
  { id: 'po_1Jk1', amount: 150.0, status: 'Paid', date: 'Nov 15, 2025', bank: '**** 4242' },
  { id: 'po_1Jk0', amount: 89.99, status: 'Processing', date: 'Nov 01, 2025', bank: '**** 4242' },
];

export default function EarningsPage() {
  const balance = 1250.0; // Mock balance

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-12">
      <header className="mb-10">
        <h1 className="mb-2 text-3xl font-black text-gray-900 lg:text-4xl dark:text-white">
          Monetization
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Manage payouts and subscription revenue.</p>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2 dark:border-white/5 dark:bg-[#0d1f1c]">
          <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006C5E]/5 blur-3xl" />

          <div className="mb-8 flex items-start justify-between">
            <div>
              <h3 className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase">
                Available Balance
              </h3>
              <div className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-[#006C5E]/20 dark:text-[#4ADE80]">
              <FaArrowUp /> 24% this month
            </div>
          </div>

          <div className="flex gap-4">
            <button className="rounded-xl bg-black px-6 py-3 font-bold text-white transition-opacity hover:opacity-80 dark:bg-white dark:text-black">
              Withdraw Funds
            </button>
            <button className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
              View Statement
            </button>
          </div>
        </div>

        {/* Stripe Connect Card */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] bg-[#635BFF] p-8 text-white shadow-xl shadow-[#635BFF]/20">
          <div className="absolute -top-6 -right-6 text-9xl text-white opacity-20">
            <FaStripeS />
          </div>

          <div className="relative z-10">
            <h3 className="mb-2 text-2xl font-bold">Payouts by Stripe</h3>
            <p className="text-sm leading-relaxed text-white/80">
              Your bank account is connected and ready to receive payouts.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-xs font-bold tracking-wider uppercase">Active</span>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div>
        <h3 className="mb-6 text-lg font-bold text-gray-900 dark:text-white">Payout History</h3>

        <div className="overflow-hidden rounded-4xl border border-gray-200 bg-white dark:border-white/5 dark:bg-[#0d1f1c]">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase dark:bg-white/5">
              <tr>
                <th className="px-8 py-4">Amount</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4 text-right">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {PAYOUTS.map((po) => (
                <tr
                  key={po.id}
                  className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <td className="px-8 py-5 font-bold text-gray-900 dark:text-white">
                    ${po.amount.toFixed(2)}
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                        po.status === 'Paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${po.status === 'Paid' ? 'bg-green-500' : 'bg-amber-500'}`}
                      />
                      {po.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500 dark:text-gray-400">{po.date}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-gray-400 transition-colors hover:text-[#006C5E] dark:hover:text-[#4ADE80]">
                      <FaDownload />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
