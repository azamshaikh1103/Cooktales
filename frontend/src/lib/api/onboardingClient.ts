import { ApiClientError, authenticatedFetch } from './authClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type DiscoverySource =
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'YOUTUBE'
  | 'GOOGLE_SEARCH'
  | 'FRIEND_OR_FAMILY'
  | 'ONLINE_COMMUNITY'
  | 'PRESS_OR_BLOG'
  | 'OTHER';

export type OnboardingGoal =
  | 'FIND_RECIPES'
  | 'COOK_WITH_MORE_CONFIDENCE'
  | 'SAVE_MEAL_IDEAS'
  | 'SHARE_RECIPES_OR_STORIES'
  | 'GROW_A_FOOD_AUDIENCE'
  | 'EARN_FROM_CONTENT';

export type CookingIdentity =
  | 'BEGINNER'
  | 'HOME_COOK'
  | 'SERIOUS_HOME_COOK'
  | 'FOOD_CREATOR'
  | 'PROFESSIONAL_COOK';

type SurveyInput = {
  discoverySource: DiscoverySource;
  discoverySourceDetail?: string;
  primaryGoal: OnboardingGoal;
  cookingIdentity: CookingIdentity;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { message?: string | string[]; error?: string } & T;

  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : payload.message || payload.error || 'Could not save your answers.';
    throw new ApiClientError(message, response.status);
  }

  return payload;
}

export const onboardingClient = {
  submit(input: SurveyInput) {
    return request<{ survey: { surveyCompleted: boolean } }>('/onboarding/survey', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  skip() {
    return request<{ survey: { surveyCompleted: boolean } }>('/onboarding/survey/skip', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};
