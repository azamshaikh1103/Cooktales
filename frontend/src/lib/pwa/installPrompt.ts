export const INSTALL_PROMPT_NEVER = "never";
export const INSTALL_ENGAGEMENT_EVENT = "cooktale:install-engagement";

const DAY_MS = 24 * 60 * 60 * 1000;
// Snooze after the 1st, 2nd and 3rd "remind me later". The 4th dismissal is final.
export const INSTALL_SNOOZE_DAYS = [7, 30, 90] as const;

const SUPPRESSED_PATHS = ["/cook", "/auth", "/payment", "/onboarding"];

export type InstallPromptState = {
	dismissals: number;
	remindAt: number | null;
	never: boolean;
};

export type InstallEngagement = { visits: number; actions: number };

const EMPTY_STATE: InstallPromptState = {
	dismissals: 0,
	remindAt: null,
	never: false,
};

export function parseInstallPromptState(
	value: string | null,
): InstallPromptState {
	if (!value) return { ...EMPTY_STATE };
	if (value === INSTALL_PROMPT_NEVER) return { ...EMPTY_STATE, never: true };
	// Legacy format: "later:<timestamp>"
	if (value.startsWith("later:")) {
		const remindAt = Number(value.slice(6));
		return {
			dismissals: 1,
			remindAt: Number.isFinite(remindAt) ? remindAt : null,
			never: false,
		};
	}
	try {
		const parsed = JSON.parse(value) as Partial<InstallPromptState>;
		return {
			dismissals: Number.isFinite(parsed.dismissals) ? Number(parsed.dismissals) : 0,
			remindAt: Number.isFinite(parsed.remindAt) ? Number(parsed.remindAt) : null,
			never: parsed.never === true,
		};
	} catch {
		return { ...EMPTY_STATE };
	}
}

export function canShowInstallPrompt(value: string | null, now: number) {
	const state = parseInstallPromptState(value);
	if (state.never) return false;
	return state.remindAt === null || now >= state.remindAt;
}

/** Records a "remind me later": 7, 30, then 90 days; the next dismissal is final. */
export function recordInstallDismissal(value: string | null, now: number) {
	const state = parseInstallPromptState(value);
	const snoozeDays = INSTALL_SNOOZE_DAYS[state.dismissals];
	const next: InstallPromptState =
		snoozeDays === undefined
			? { dismissals: state.dismissals + 1, remindAt: null, never: true }
			: {
					dismissals: state.dismissals + 1,
					remindAt: now + snoozeDays * DAY_MS,
					never: false,
				};
	return JSON.stringify(next);
}

/** Kept for compatibility: a single 30-day snooze value. */
export function remindLaterValue(now: number) {
	return `later:${now + 30 * DAY_MS}`;
}

export function parseInstallEngagement(value: string | null): InstallEngagement {
	try {
		const parsed = JSON.parse(value ?? "") as Partial<InstallEngagement>;
		return {
			visits: Number.isFinite(parsed.visits) ? Number(parsed.visits) : 0,
			actions: Number.isFinite(parsed.actions) ? Number(parsed.actions) : 0,
		};
	} catch {
		return { visits: 0, actions: 0 };
	}
}

/** Earn the ask: a second visit, or one real action (save, review, finished cook). */
export function isInstallEngaged(engagement: InstallEngagement) {
	return engagement.visits >= 2 || engagement.actions >= 1;
}

export function isInstallPromptSuppressedPath(pathname: string | null) {
	if (!pathname) return false;
	return SUPPRESSED_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);
}

export function isTypingTarget(
	element: { tagName?: string; isContentEditable?: boolean } | null,
) {
	if (!element) return false;
	const tag = element.tagName?.toUpperCase();
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		element.isContentEditable === true
	);
}

const PROMPT_KEY = "cooktale.install-prompt";
const ENGAGEMENT_KEY = "cooktale.install-engagement";

function readStorage(key: string) {
	try {
		return window.localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string) {
	try {
		window.localStorage.setItem(key, value);
	} catch {
		// Storage can be blocked (private mode, policy); the prompt just stays quiet.
	}
}

export const installPromptStorage = {
	promptKey: PROMPT_KEY,
	readPrompt: () => readStorage(PROMPT_KEY),
	writePrompt: (value: string) => writeStorage(PROMPT_KEY, value),
	readEngagement: () =>
		parseInstallEngagement(readStorage(ENGAGEMENT_KEY)),
	writeEngagement: (value: InstallEngagement) =>
		writeStorage(ENGAGEMENT_KEY, JSON.stringify(value)),
};

/** Call after a real positive action (saved a recipe, posted a review, finished cooking). */
export function markInstallEngagement() {
	if (typeof window === "undefined") return;
	const engagement = installPromptStorage.readEngagement();
	installPromptStorage.writeEngagement({
		...engagement,
		actions: engagement.actions + 1,
	});
	window.dispatchEvent(new Event(INSTALL_ENGAGEMENT_EVENT));
}
