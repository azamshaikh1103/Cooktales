"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";
import { type ReportTargetType, TARGET_LABEL } from "@/lib/reports/reasons";
import { setTab } from "@/lib/Slices/tabSlice";
import { ReportDialog } from "./ReportDialog";

type ReportButtonProps = {
	targetType: ReportTargetType;
	targetId: string;
	/** The content's author: nobody gets a button to report their own content. */
	authorId?: string | null;
	/** `overlay` sits on photos, `text` is a labelled action, `icon` is a quiet flag. */
	variant: "overlay" | "text" | "icon";
};

const VARIANT_CLASS = {
	overlay:
		"cursor-pointer rounded-full bg-white/20 p-3 backdrop-blur-md transition-all hover:bg-white/30",
	text: "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
	icon: "cursor-pointer rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400",
} as const;

export function ReportButton({
	targetType,
	targetId,
	authorId,
	variant,
}: ReportButtonProps) {
	const { user, status } = useAuth();
	const dispatch = useDispatch();
	const [open, setOpen] = useState(false);
	const label = TARGET_LABEL[targetType];

	if (user && authorId && user.id === authorId) return null;

	const handleClick = () => {
		if (status === "unauthenticated") {
			toast.message(`Sign in to report this ${label}.`);
			dispatch(setTab("login"));
			return;
		}
		if (status !== "authenticated") return;
		setOpen(true);
	};

	return (
		<>
			<button
				type="button"
				onClick={handleClick}
				aria-label={`Report this ${label}`}
				title={`Report this ${label}`}
				className={VARIANT_CLASS[variant]}
			>
				<Flag size={variant === "icon" ? 14 : 16} />
				{variant === "text" && "Report"}
			</button>
			<ReportDialog
				open={open}
				onClose={() => setOpen(false)}
				targetType={targetType}
				targetId={targetId}
			/>
		</>
	);
}
