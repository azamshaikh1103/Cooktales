export type ReportTargetType = "DISCUSSION" | "COMMENT" | "RECIPE" | "STORY";

export type ReportReason =
	| "SPAM"
	| "HARASSMENT"
	| "MISINFORMATION"
	| "COPYRIGHT"
	| "INAPPROPRIATE"
	| "OTHER";

export const REPORT_REASONS: ReadonlyArray<{
	value: ReportReason;
	label: string;
	hint: string;
}> = [
	{
		value: "SPAM",
		label: "Spam or advertising",
		hint: "Promotions, repeated posts or link dumps",
	},
	{
		value: "HARASSMENT",
		label: "Harassment or hate",
		hint: "Attacks, threats, or targeting a person or group",
	},
	{
		value: "MISINFORMATION",
		label: "Misleading or unsafe food advice",
		hint: "Dangerous cooking or storage claims, or false information",
	},
	{
		value: "COPYRIGHT",
		label: "Stolen or copied content",
		hint: "Someone else's photos, recipe or writing",
	},
	{
		value: "INAPPROPRIATE",
		label: "Inappropriate content",
		hint: "Sexual, violent or otherwise not suitable here",
	},
	{
		value: "OTHER",
		label: "Something else",
		hint: "Tell us what is wrong",
	},
];

export const REASON_LABEL: Record<ReportReason, string> = Object.fromEntries(
	REPORT_REASONS.map((reason) => [reason.value, reason.label]),
) as Record<ReportReason, string>;

export const TARGET_LABEL: Record<ReportTargetType, string> = {
	DISCUSSION: "thread",
	COMMENT: "response",
	RECIPE: "recipe",
	STORY: "story",
};

export const REPORT_DETAILS_MAX = 500;
