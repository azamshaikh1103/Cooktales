export const INSTALL_PROMPT_NEVER = "never";

const REMIND_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export function remindLaterValue(now: number) {
	return `later:${now + REMIND_AFTER_MS}`;
}

export function canShowInstallPrompt(value: string | null, now: number) {
	if (!value) return true;
	if (value === INSTALL_PROMPT_NEVER) return false;

	const remindAt = Number(value.replace("later:", ""));
	return !Number.isFinite(remindAt) || now >= remindAt;
}
