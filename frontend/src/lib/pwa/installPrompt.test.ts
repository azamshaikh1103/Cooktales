import assert from "node:assert/strict";
import {
	canShowInstallPrompt,
	INSTALL_PROMPT_NEVER,
	isInstallEngaged,
	isInstallPromptSuppressedPath,
	isTypingTarget,
	parseInstallPromptState,
	recordInstallDismissal,
	remindLaterValue,
} from "./installPrompt";

const now = 1_700_000_000_000;
const day = 24 * 60 * 60 * 1000;

// Basic gating and legacy values
assert.equal(canShowInstallPrompt(null, now), true);
assert.equal(canShowInstallPrompt(INSTALL_PROMPT_NEVER, now), false);
assert.equal(canShowInstallPrompt(remindLaterValue(now), now), false);
assert.equal(canShowInstallPrompt(remindLaterValue(now), now + 30 * day), true);
assert.equal(canShowInstallPrompt("garbage{", now), true);

// Escalating snooze: 7 -> 30 -> 90 days, then the next dismissal is final
let stored = recordInstallDismissal(null, now);
assert.equal(canShowInstallPrompt(stored, now + 6 * day), false);
assert.equal(canShowInstallPrompt(stored, now + 7 * day), true);

stored = recordInstallDismissal(stored, now + 7 * day);
assert.equal(canShowInstallPrompt(stored, now + 7 * day + 29 * day), false);
assert.equal(canShowInstallPrompt(stored, now + 7 * day + 30 * day), true);

stored = recordInstallDismissal(stored, now + 40 * day);
assert.equal(canShowInstallPrompt(stored, now + 40 * day + 89 * day), false);
assert.equal(canShowInstallPrompt(stored, now + 40 * day + 90 * day), true);

stored = recordInstallDismissal(stored, now + 200 * day);
assert.equal(parseInstallPromptState(stored).never, true);
assert.equal(canShowInstallPrompt(stored, now + 10_000 * day), false);

// Legacy 30-day snooze counts as one dismissal
assert.equal(parseInstallPromptState(remindLaterValue(now)).dismissals, 1);

// Earn the ask
assert.equal(isInstallEngaged({ visits: 1, actions: 0 }), false);
assert.equal(isInstallEngaged({ visits: 2, actions: 0 }), true);
assert.equal(isInstallEngaged({ visits: 1, actions: 1 }), true);

// Never interrupt: sensitive routes (and not look-alikes such as /cookies)
for (const path of [
	"/cook",
	"/cook/abc",
	"/auth",
	"/auth/google/callback",
	"/payment/success",
	"/onboarding",
]) {
	assert.equal(isInstallPromptSuppressedPath(path), true, path);
}
for (const path of ["/", "/recipe", "/cookies", "/authors", "/profile/chef"]) {
	assert.equal(isInstallPromptSuppressedPath(path), false, path);
}

// Never interrupt: typing
assert.equal(isTypingTarget({ tagName: "INPUT" }), true);
assert.equal(isTypingTarget({ tagName: "textarea" }), true);
assert.equal(isTypingTarget({ tagName: "DIV", isContentEditable: true }), true);
assert.equal(isTypingTarget({ tagName: "BUTTON" }), false);
assert.equal(isTypingTarget(null), false);

console.log("install prompt rules: PASS");
