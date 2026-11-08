"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { communityClient } from "@/lib/api/communityClient";
import { useAuth } from "@/lib/auth/AuthContext";

/** Delete control for a thread: only its author (or an admin) ever sees it. */
export function ThreadActions({
	discussionId,
	authorId,
}: {
	discussionId: string;
	authorId: string;
}) {
	const router = useRouter();
	const { user } = useAuth();
	const [confirming, setConfirming] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const isAuthor = user?.id === authorId;
	if (!user || (!isAuthor && user.role !== "ADMIN")) return null;

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await communityClient.deleteDiscussion(discussionId);
			toast.success("Thread deleted");
			router.push("/community/discussion");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not delete the thread",
			);
			setDeleting(false);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setConfirming(true)}
				className="ml-auto flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
			>
				<Trash2 size={16} />
				Delete
			</button>
			<ConfirmDialog
				open={confirming}
				busy={deleting}
				title="Delete this thread?"
				description={
					isAuthor
						? "Your title and text are removed for good and the thread leaves the community. Replies stay in place under a [deleted] notice. This can't be undone."
						: "This removes the thread for everyone as a moderator action."
				}
				confirmLabel="Delete thread"
				onConfirm={handleDelete}
				onCancel={() => setConfirming(false)}
			/>
		</>
	);
}
