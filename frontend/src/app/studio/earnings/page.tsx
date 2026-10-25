'use client';

import { Landmark, LoaderCircle, Plus, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { studioClient, type CreatorEarnings } from '@/lib/api/studioClient';
import { useAuth } from '@/lib/auth/AuthContext';

type Method = 'UPI' | 'PAYPAL' | 'WISE';
const methodLabels: Record<Method, string> = { UPI: 'UPI', PAYPAL: 'PayPal', WISE: 'Wise' };
const destinationLabels: Record<Method, string> = {
  UPI: 'UPI ID',
  PAYPAL: 'PayPal email',
  WISE: 'Wise email',
};
const inputClass =
  'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#101827] outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-[#4ADE80]';

export default function EarningsPage() {
  const { status } = useAuth();
  const [earnings, setEarnings] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<Method>('UPI');
  const [legalName, setLegalName] = useState('');
  const [country, setCountry] = useState('');
  const [destination, setDestination] = useState('');

  const load = async () => {
    if (status !== 'authenticated') return;
    setLoading(true);
    try {
      setEarnings(await studioClient.earnings());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load earnings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableMethods = (['UPI', 'PAYPAL', 'WISE'] as Method[]).filter(
    (item) => !earnings?.payoutMethods.some((saved) => saved.method === item)
  );

  useEffect(() => {
    if (availableMethods.length && !availableMethods.includes(method))
      setMethod(availableMethods[0]);
  }, [availableMethods, method]);

  const saveMethod = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!legalName.trim() || !country.trim() || !destination.trim())
      return toast.error('Complete every payout detail first.');
    setSaving(true);
    try {
      await studioClient.addPayoutMethod({
        method,
        legalName,
        country,
        destination,
        primary: !earnings?.payoutMethods.some((saved) => saved.isPrimary),
      });
      toast.success(`${methodLabels[method]} payout method saved.`);
      setLegalName('');
      setCountry('');
      setDestination('');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save payout method.');
    } finally {
      setSaving(false);
    }
  };

  const makePrimary = async (id: string) => {
    try {
      await studioClient.setPrimaryPayoutMethod(id);
      setEarnings(
        (current) =>
          current && {
            ...current,
            payoutMethods: current.payoutMethods.map((saved) => ({
              ...saved,
              isPrimary: saved.id === id,
            })),
          }
      );
      toast.success('Primary payout method updated.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not update your primary payout method.'
      );
    }
  };

  const wallet = earnings?.wallet;
  return (
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-semibold text-[#101827] dark:text-white">Monetization</h2>
      </header>
      <section className="grid gap-3 sm:grid-cols-2">
        <AmountCard label="Available balance" value={wallet?.availableUsd} />
        <AmountCard label="Total earnings" value={wallet?.lifetimeEarnedUsd} />
      </section>
      <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#0d1f1c]">
          <div className="flex items-start gap-3">
            <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-[#006C5E] dark:text-[#4ADE80]" />
            <div>
              <h3 className="text-xl font-semibold text-[#101827] dark:text-white">
                Payout methods
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Add each once. Switch your primary method anytime. To change saved details, contact
                us.
              </p>
            </div>
          </div>
          {loading ? (
            <Loading />
          ) : (
            <div className="mt-6 space-y-3">
              {earnings?.payoutMethods.length ? (
                earnings.payoutMethods.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 p-4 dark:border-white/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#101827] dark:text-white">
                        {methodLabels[saved.method]}{' '}
                        {saved.isPrimary ? (
                          <span className="ml-2 rounded-full bg-[#e8f5f2] px-2 py-1 text-xs text-[#006C5E] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]">
                            Primary
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                        {saved.legalName} · {saved.country} · {saved.maskedDestination}
                      </p>
                    </div>
                    {!saved.isPrimary ? (
                      <button
                        type="button"
                        onClick={() => void makePrimary(saved.id)}
                        className="cursor-pointer rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:border-[#006C5E]/40 hover:text-[#006C5E] dark:border-white/10 dark:text-gray-200 dark:hover:border-[#4ADE80]/40 dark:hover:text-[#4ADE80]"
                      >
                        Make primary
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-[#fafafa] p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                  Add a payout method to receive eligible payouts.
                </p>
              )}
            </div>
          )}
        </div>
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 sm:p-8 dark:border-white/10 dark:bg-[#0d1f1c]">
          <h3 className="text-xl font-semibold text-[#101827] dark:text-white">
            Add payout method
          </h3>
          {availableMethods.length ? (
            <form className="mt-5 space-y-4" onSubmit={saveMethod}>
              <Field label="Method">
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as Method)}
                  className={inputClass}
                >
                  {availableMethods.map((item) => (
                    <option key={item} value={item}>
                      {methodLabels[item]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Legal name">
                <input
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  className={inputClass}
                />
              </Field>
              <Field label="Country">
                <input
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                  maxLength={80}
                  autoComplete="country-name"
                  className={inputClass}
                />
              </Field>
              <Field label={destinationLabels[method]}>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  maxLength={180}
                  autoComplete={method === 'PAYPAL' || method === 'WISE' ? 'email' : 'off'}
                  className={inputClass}
                />
              </Field>
              <button
                type="submit"
                disabled={saving}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#006C5E] px-4 py-3 text-sm font-semibold text-white hover:bg-[#005a4e] disabled:cursor-wait disabled:opacity-60 dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#35c96b]"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving ? 'Saving…' : 'Save payout method'}
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-2xl bg-[#fafafa] p-4 text-sm leading-6 text-gray-500 dark:bg-white/5 dark:text-gray-400">
              You have saved all available payout methods. To change saved details, contact CookTale
              support.
            </p>
          )}
        </div>
      </section>
      <History
        title="Earnings"
        empty="No earnings yet."
        loading={loading}
        hasItems={Boolean(earnings?.earnings.length)}
      >
        {earnings?.earnings.map((item) => (
          <HistoryRow
            key={item.id}
            label={item.period}
            value={item.amountUsd}
            detail={`${item.recipeViews.toLocaleString()} recipe views · ${item.storyViews.toLocaleString()} story views`}
          />
        ))}
      </History>
      <History
        title="Payout history"
        empty="No payouts yet."
        loading={loading}
        hasItems={Boolean(earnings?.payouts.length)}
      >
        {earnings?.payouts.map((item) => (
          <HistoryRow
            key={item.id}
            label={
              item.status === 'PAID'
                ? `Paid ${item.paidAt ? new Date(item.paidAt).toLocaleDateString() : ''}`
                : 'Payout pending'
            }
            value={item.netUsd}
            detail={`${methodLabels[item.method]} · Transaction ID: ${item.reference || '—'}`}
          />
        ))}
      </History>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-[#101827] dark:text-white">
      {label}
      {children}
    </label>
  );
}
function Loading() {
  return (
    <div className="mt-6 flex justify-center py-5 text-gray-500">
      <LoaderCircle className="h-5 w-5 animate-spin" />
    </div>
  );
}
function AmountCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="flex items-center gap-3 text-[#006C5E] dark:text-[#4ADE80]">
        <WalletCards className="h-5 w-5" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="mt-5 text-3xl font-semibold text-[#101827] dark:text-white">
        ${Number(value || 0).toFixed(2)}
      </p>
    </div>
  );
}
function History({
  title,
  empty,
  loading,
  hasItems,
  children,
}: {
  title: string;
  empty: string;
  loading: boolean;
  hasItems: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white dark:border-white/10 dark:bg-[#0d1f1c]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-white/10">
        <h3 className="text-xl font-semibold text-[#101827] dark:text-white">{title}</h3>
      </div>
      {loading ? (
        <Loading />
      ) : hasItems ? (
        <div className="divide-y divide-gray-100 dark:divide-white/10">{children}</div>
      ) : (
        <p className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">{empty}</p>
      )}
    </section>
  );
}
function HistoryRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <p className="font-semibold text-[#101827] dark:text-white">{label}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{detail}</p>
      </div>
      <p className="font-semibold text-[#101827] dark:text-white">${Number(value).toFixed(2)}</p>
    </div>
  );
}
