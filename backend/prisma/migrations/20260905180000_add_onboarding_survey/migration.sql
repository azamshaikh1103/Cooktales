CREATE TYPE "OnboardingDiscoverySource" AS ENUM (
  'INSTAGRAM',
  'TIKTOK',
  'YOUTUBE',
  'GOOGLE_SEARCH',
  'FRIEND_OR_FAMILY',
  'ONLINE_COMMUNITY',
  'PRESS_OR_BLOG',
  'OTHER'
);

CREATE TYPE "OnboardingGoal" AS ENUM (
  'FIND_RECIPES',
  'COOK_WITH_MORE_CONFIDENCE',
  'SAVE_MEAL_IDEAS',
  'SHARE_RECIPES_OR_STORIES',
  'GROW_A_FOOD_AUDIENCE'
);

CREATE TYPE "CookingIdentity" AS ENUM (
  'BEGINNER',
  'HOME_COOK',
  'SERIOUS_HOME_COOK',
  'FOOD_CREATOR',
  'PROFESSIONAL_COOK'
);

ALTER TABLE "User"
  ADD COLUMN "surveySkippedAt" TIMESTAMP(3),
  ADD COLUMN "discoverySource" "OnboardingDiscoverySource",
  ADD COLUMN "discoverySourceDetail" TEXT,
  ADD COLUMN "onboardingGoal" "OnboardingGoal",
  ADD COLUMN "cookingIdentity" "CookingIdentity";

CREATE INDEX "User_discoverySource_idx" ON "User"("discoverySource");
CREATE INDEX "User_onboardingGoal_idx" ON "User"("onboardingGoal");
