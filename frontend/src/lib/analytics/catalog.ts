/**
 * Single source of truth for CookTale analytics.
 *
 * Every event and the parameters it may carry are declared here. `track()` is typed from this
 * catalog, and `scripts/build-gtm-container.ts` generates the Google Tag Manager container from it,
 * so the code, GTM and GA4 can never drift apart.
 *
 * Rules: snake_case, max 40 chars, no personal data (no emails, names, search of private data).
 */
export const ANALYTICS_EVENTS = {
	// Discovery
	view_recipe: [
		"recipe_id",
		"recipe_name",
		"recipe_category",
		"cuisine",
		"creator_id",
	],
	view_story: ["story_id", "story_title", "creator_id"],
	scroll_depth: ["content_type", "content_id", "scroll_percent"],
	filter_category: ["category", "list_name"],
	load_more: ["list_name", "page_number"],
	search: ["search_term", "results_count"],
	search_no_results: ["search_term"],
	search_result_click: ["search_term", "result_type", "result_position"],
	open_gallery_image: ["recipe_id", "image_index"],
	check_ingredient: ["recipe_id", "context", "checked"],
	affiliate_click: [
		"recipe_id",
		"recipe_name",
		"creator_id",
		"item_kind",
		"item_name",
		"destination",
	],
	share: ["content_type", "content_id", "method"],

	// Cooking
	start_cooking: [
		"recipe_id",
		"recipe_name",
		"recipe_category",
		"cuisine",
		"creator_id",
	],
	cook_step: ["recipe_id", "step_number", "total_steps"],
	finish_cooking: ["recipe_id", "total_steps"],
	abandon_cooking: ["recipe_id", "step_number", "total_steps"],

	// Engagement
	save_recipe: ["recipe_id", "recipe_category", "cuisine", "creator_id"],
	unsave_recipe: ["recipe_id"],
	save_story: ["story_id", "creator_id"],
	unsave_story: ["story_id"],
	post_review: ["recipe_id", "rating"],
	follow_creator: ["creator_id"],
	unfollow_creator: ["creator_id"],

	// Account
	sign_up: ["method"],
	login: ["method"],
	onboarding_complete: ["skipped"],

	// App
	install_prompt_shown: ["platform"],
	install_prompt_accepted: ["platform"],
	install_prompt_dismissed: ["platform", "dismissal_count"],
} as const;

export type AnalyticsEventName = keyof typeof ANALYTICS_EVENTS;

export type AnalyticsParamKey =
	(typeof ANALYTICS_EVENTS)[AnalyticsEventName][number];

export type AnalyticsParamValue = string | number | boolean | null;

export type AnalyticsEventParams<E extends AnalyticsEventName> = Partial<
	Record<(typeof ANALYTICS_EVENTS)[E][number], AnalyticsParamValue>
>;

export const ANALYTICS_EVENT_NAMES = Object.keys(
	ANALYTICS_EVENTS,
) as AnalyticsEventName[];

export const ANALYTICS_PARAM_KEYS = [
	...new Set(Object.values(ANALYTICS_EVENTS).flat()),
] as AnalyticsParamKey[];

/** Scroll depth milestones reported on recipe and story pages. */
export const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 90] as const;

/** Returns the milestones newly reached at this scroll percentage that were not reported yet. */
export function newScrollMilestones(
	percent: number,
	alreadyReported: ReadonlySet<number>,
) {
	return SCROLL_DEPTH_MILESTONES.filter(
		(milestone) => percent >= milestone && !alreadyReported.has(milestone),
	);
}
