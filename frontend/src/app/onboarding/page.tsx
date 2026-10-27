'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  onboardingClient,
  type CookingIdentity,
  type DiscoverySource,
  type OnboardingGoal,
} from '@/lib/api/onboardingClient';
import { useAuth } from '@/lib/auth/AuthContext';

const DISCOVERY_SOURCES: Array<{ value: DiscoverySource; label: string }> = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'GOOGLE_SEARCH', label: 'Google search' },
  { value: 'FRIEND_OR_FAMILY', label: 'Friend or family' },
  { value: 'ONLINE_COMMUNITY', label: 'An online community' },
  { value: 'PRESS_OR_BLOG', label: 'A blog, article, or newsletter' },
  { value: 'OTHER', label: 'Somewhere else' },
];

const GOALS: Array<{ value: OnboardingGoal; label: string }> = [
  { value: 'FIND_RECIPES', label: 'Find reliable recipes' },
  { value: 'COOK_WITH_MORE_CONFIDENCE', label: 'Cook with more confidence' },
  { value: 'SAVE_MEAL_IDEAS', label: 'Save meal ideas for later' },
  { value: 'SHARE_RECIPES_OR_STORIES', label: 'Share recipes or stories' },
  { value: 'GROW_A_FOOD_AUDIENCE', label: 'Grow a food audience' },
  { value: 'EARN_FROM_CONTENT', label: 'Earn money from my food content' },
];

const IDENTITIES: Array<{ value: CookingIdentity; label: string }> = [
  { value: 'BEGINNER', label: 'I am just getting started' },
  { value: 'HOME_COOK', label: 'I cook at home regularly' },
  { value: 'SERIOUS_HOME_COOK', label: 'Cooking is a serious hobby' },
  { value: 'FOOD_CREATOR', label: 'I create food content' },
  { value: 'PROFESSIONAL_COOK', label: 'I cook professionally' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { status, updateUser } = useAuth();
  const [discoverySource, setDiscoverySource] = useState<DiscoverySource | ''>('');
  const [discoverySourceDetail, setDiscoverySourceDetail] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState<OnboardingGoal | ''>('');
  const [cookingIdentity, setCookingIdentity] = useState<CookingIdentity | ''>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth');
  }, [router, status]);

  async function finish(action: 'submit' | 'skip') {
    setError('');
    setIsSaving(true);
    try {
      if (action === 'skip') {
        await onboardingClient.skip();
      } else {
        if (!discoverySource || !primaryGoal || !cookingIdentity) {
          setError('Choose one answer for each question, or select Not now.');
          return;
        }
        await onboardingClient.submit({
          discoverySource,
          discoverySourceDetail: discoverySource === 'OTHER' ? discoverySourceDetail : undefined,
          primaryGoal,
          cookingIdentity,
        });
      }
      updateUser({ surveyCompleted: true });
      router.replace('/?welcome=true');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save your answers.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void finish('submit');
  }

  if (status === 'loading') return null;

  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-10 text-[#13221f] dark:bg-[#092019] dark:text-white sm:py-16">
      <section className="mx-auto max-w-2xl rounded-[2rem] border border-[#dce7e3] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0d1f1c] sm:p-10">
        <p className="text-sm font-semibold text-[#008575] dark:text-[#4ade80]">Optional setup</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Help us make CookTale more useful for you.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#5d6d69] dark:text-[#aec0bb]">
          Three quick answers help us understand our launch audience. You can skip this and use every part of CookTale normally.
        </p>

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <Question label="How did you first hear about CookTale?">
            <OptionList value={discoverySource} onChange={setDiscoverySource} options={DISCOVERY_SOURCES} name="source" />
            {discoverySource === 'OTHER' && (
              <input
                value={discoverySourceDetail}
                onChange={(event) => setDiscoverySourceDetail(event.target.value)}
                maxLength={80}
                placeholder="Tell us where"
                className="mt-3 w-full rounded-xl border border-[#bfd0cb] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#008575] focus:ring-2 focus:ring-[#008575]/15 dark:border-white/20 dark:bg-transparent dark:focus:border-[#4ade80] dark:focus:ring-[#4ade80]/15"
              />
            )}
          </Question>

          <Question label="What would you most like to do first?">
            <OptionList value={primaryGoal} onChange={setPrimaryGoal} options={GOALS} name="goal" />
          </Question>

          <Question label="Which best describes you today?">
            <OptionList value={cookingIdentity} onChange={setCookingIdentity} options={IDENTITIES} name="identity" />
          </Question>

          {error && <p role="alert" className="text-sm text-[#b42318] dark:text-[#fda29b]">{error}</p>}

          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button type="submit" disabled={isSaving} className="cursor-pointer rounded-full bg-[#007d6d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#006c5e] focus:outline-none focus:ring-2 focus:ring-[#008575] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#62e895] dark:focus:ring-[#4ade80] dark:focus:ring-offset-[#0d1f1c]">
              {isSaving ? 'Saving...' : 'Save answers'}
            </button>
            <button type="button" disabled={isSaving} onClick={() => void finish('skip')} className="cursor-pointer px-3 py-3 text-sm font-semibold text-[#52645f] transition hover:text-[#13221f] focus:outline-none focus:ring-2 focus:ring-[#008575] disabled:cursor-not-allowed dark:text-[#b6c8c2] dark:hover:text-white dark:focus:ring-[#4ade80]">
              Not now
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-[#e0eae7] bg-[#fbfdfc] p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <legend className="text-lg font-semibold">{label}</legend>
      <div className="mt-4">{children}</div>
    </fieldset>
  );
}

function OptionList<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T | '';
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  name: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition focus-within:ring-2 focus-within:ring-[#008575]/30 dark:focus-within:ring-[#4ade80]/30 ${value === option.value ? 'border-[#008575] bg-[#eaf6f2] text-[#075c51] dark:border-[#4ade80] dark:bg-[#4ade80]/10 dark:text-white' : 'border-[#d6e1de] bg-white hover:border-[#008575] dark:border-white/15 dark:bg-transparent dark:hover:border-[#4ade80]'}`}>
          <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="h-4 w-4 accent-[#008575] dark:accent-[#4ade80]" />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
