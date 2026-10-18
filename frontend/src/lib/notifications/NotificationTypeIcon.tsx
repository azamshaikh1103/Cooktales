import type { LucideIcon } from "lucide-react";
import {
	Bell,
	Heart,
	MessageCircle,
	Reply,
	Star,
	UserPlus,
} from "lucide-react";
import type { CookTaleNotification } from "@/lib/api/notificationClient";

type NotificationIconStyle = {
	Icon: LucideIcon;
	className: string;
	label: string;
};

export function notificationIconStyle(
	type: CookTaleNotification["type"],
): NotificationIconStyle {
	switch (type) {
		case "FOLLOW":
			return {
				Icon: UserPlus,
				className: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
				label: "New follower",
			};
		case "RECIPE_LIKE":
		case "STORY_LIKE":
			return {
				Icon: Heart,
				className: "bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
				label: "Like",
			};
		case "RECIPE_COMMENT":
		case "STORY_COMMENT":
			return {
				Icon: MessageCircle,
				className: "bg-amber-100 text-amber-700 dark:bg-amber-300/15 dark:text-amber-200",
				label: "Comment",
			};
		case "RECIPE_COMMENT_REPLY":
		case "STORY_COMMENT_REPLY":
		case "RECIPE_REVIEW_REPLY":
			return {
				Icon: Reply,
				className: "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
				label: "Reply",
			};
		case "RECIPE_REVIEW":
			return {
				Icon: Star,
				className: "bg-orange-100 text-orange-700 dark:bg-orange-300/15 dark:text-orange-200",
				label: "Recipe review",
			};
		default:
			return {
				Icon: Bell,
				className: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
				label: "CookTale update",
			};
	}
}

export function NotificationTypeIcon({
	type,
	size = 18,
	className = "h-11 w-11",
}: {
	type: CookTaleNotification["type"];
	size?: number;
	className?: string;
}) {
	const { Icon, className: colorClassName, label } = notificationIconStyle(type);

	return (
		<div
			className={`grid shrink-0 place-items-center rounded-full ${className} ${colorClassName}`}
			aria-label={label}
			title={label}
		>
			<Icon size={size} strokeWidth={2} aria-hidden="true" />
		</div>
	);
}
