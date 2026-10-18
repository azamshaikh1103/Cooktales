import type { CookTaleNotification } from "@/lib/api/notificationClient";

export function notificationText(notification: CookTaleNotification) {
	const actor = notification.actor?.name || "Someone";
	const recipeName =
		typeof notification.payload.recipeName === "string"
			? notification.payload.recipeName
			: "your recipe";
	const storyTitle =
		typeof notification.payload.storyTitle === "string"
			? notification.payload.storyTitle
			: "your story";

	switch (notification.type) {
		case "FOLLOW":
			return `${actor} started following your kitchen.`;
		case "RECIPE_LIKE":
			return `${actor} liked ${recipeName}.`;
		case "STORY_LIKE":
			return `${actor} liked ${storyTitle}.`;
		case "RECIPE_COMMENT":
			return `${actor} commented on ${recipeName}.`;
		case "STORY_COMMENT":
			return `${actor} commented on ${storyTitle}.`;
		case "RECIPE_COMMENT_REPLY":
			return `${actor} replied to your comment on ${recipeName}.`;
		case "STORY_COMMENT_REPLY":
			return `${actor} replied to your comment on ${storyTitle}.`;
		case "RECIPE_REVIEW":
			return `${actor} reviewed ${recipeName}.`;
		case "RECIPE_REVIEW_REPLY":
			return `${actor} replied to your review of ${recipeName}.`;
		default:
			return "There is an update from CookTale.";
	}
}

export function relativeTime(value: string) {
	const seconds = Math.max(
		0,
		Math.floor((Date.now() - new Date(value).getTime()) / 1000),
	);
	if (seconds < 60) return "now";
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
	if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(value));
}
