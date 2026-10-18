'use client';

import { FormEvent, useEffect, useState } from 'react';
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
    <main className="min-h-screen bg-white px-5 py-12 text-[#13221f] dark:bg-[#092019] dark:text-white sm:py-20">
      <section className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold text-[#008575] dark:text-[#4ade80]">Optional setup</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Help us make CookTale more useful for you.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#5d6d69] dark:text-[#aec0bb]">
          Three quick answers help us understand our launch audience. You can skip this and use every part of CookTale normally.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-9">
          <Question label="How did you first hear about CookTale?">
            <OptionList value={discoverySource} onChange={setDiscoverySource} options={DISCOVERY_SOURCES} name="source" />
            {discoverySource === 'OTHER' && (
              <input
                value={discoverySourceDetail}
                onChange={(event) => setDiscoverySourceDetail(event.target.value)}
                maxLength={80}
                placeholder="Tell us where"
                className="mt-3 w-full rounded-md border border-[#bfd0cb] bg-white px-3 py-2 text-sm outline-none focus:border-[#008575] dark:border-white/20 dark:bg-transparent"
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

          <div className="flex flex-wrap items-center gap-4 border-t border-[#dce7e3] pt-7 dark:border-white/10">
            <button type="submit" disabled={isSaving} className="cursor-pointer rounded-md bg-[#007d6d] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ade80] dark:text-[#092019]">
              {isSaving ? 'Saving...' : 'Save answers'}
            </button>
            <button type="button" disabled={isSaving} onClick={() => void finish('skip')} className="cursor-pointer px-2 py-3 text-sm font-semibold text-[#52645f] hover:text-[#13221f] disabled:cursor-not-allowed dark:text-[#b6c8c2] dark:hover:text-white">
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
    <fieldset>
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
        <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md border border-[#d6e1de] px-3 py-3 text-sm hover:border-[#008575] dark:border-white/15 dark:hover:border-[#4ade80]">
          <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} className="h-4 w-4 accent-[#008575] dark:accent-[#4ade80]" />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
