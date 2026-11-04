import assert from "node:assert/strict";
import {
	canShowInstallPrompt,
	INSTALL_PROMPT_NEVER,
	remindLaterValue,
} from "./installPrompt";

const now = 1_700_000_000_000;

assert.equal(canShowInstallPrompt(null, now), true);
assert.equal(canShowInstallPrompt(INSTALL_PROMPT_NEVER, now), false);
assert.equal(canShowInstallPrompt(remindLaterValue(now), now), false);
assert.equal(
	canShowInstallPrompt(remindLaterValue(now), now + 30 * 24 * 60 * 60 * 1000),
	true,
);

console.log("install prompt timing: PASS");
