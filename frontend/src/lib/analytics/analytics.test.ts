import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildGtmContainer } from "../../../analytics/gtmContainer";
import {
	ANALYTICS_EVENT_NAMES,
	ANALYTICS_EVENTS,
	ANALYTICS_PARAM_KEYS,
	newScrollMilestones,
} from "./catalog";
import { setAnalyticsUser, track } from "./track";

// Naming rules GA4 enforces: snake_case, max 40 chars
const snake = /^[a-z][a-z0-9_]{0,39}$/;
for (const name of ANALYTICS_EVENT_NAMES) assert.match(name, snake, name);
for (const key of ANALYTICS_PARAM_KEYS) assert.match(key, snake, key);
for (const [name, params] of Object.entries(ANALYTICS_EVENTS)) {
	assert.ok(params.length <= 25, `${name} exceeds GA4's 25 params per event`);
}

// Scroll milestones fire once each, in order
assert.deepEqual(newScrollMilestones(10, new Set()), []);
assert.deepEqual(newScrollMilestones(60, new Set()), [25, 50]);
assert.deepEqual(newScrollMilestones(60, new Set([25])), [50]);
assert.deepEqual(newScrollMilestones(95, new Set([25, 50, 75])), [90]);

// track() pushes a reset first, drops empty params, and never throws
const pushed: Record<string, unknown>[] = [];
(globalThis as unknown as { window: { dataLayer: typeof pushed } }).window = {
	dataLayer: pushed,
};
track("view_recipe", {
	recipe_id: "r1",
	cuisine: null,
	recipe_category: undefined,
	creator_id: "",
});
assert.deepEqual(pushed[0], { ct_params: null });
assert.deepEqual(pushed[1], {
	event: "view_recipe",
	ct_params: { recipe_id: "r1" },
});
setAnalyticsUser({ loggedIn: true });
assert.deepEqual(pushed[2], { logged_in: true });

// The committed GTM container must match the catalog (run `npm run analytics:gtm` after changes)
const committed = JSON.parse(
	readFileSync(join(__dirname, "../../../analytics/gtm-container.json"), "utf8"),
);
assert.deepEqual(
	committed,
	JSON.parse(JSON.stringify(buildGtmContainer())),
	"analytics/gtm-container.json is out of date: run `npm run analytics:gtm`",
);

console.log("analytics catalog, track(), GTM container: PASS");
