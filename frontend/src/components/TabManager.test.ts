import assert from "node:assert/strict";
import { getTabMessage } from "./TabManager";

assert.equal(getTabMessage(0, 0), "Back in a sec, chef?");
assert.equal(getTabMessage(60_000, 0), "Chef? Chef?? CHEF??");
assert.equal(
	getTabMessage(180_000, 0),
	"Your recipe will be right where you left it.",
);

console.log("tab message timing: PASS");
