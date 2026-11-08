"use client";

import { Loader2 } from "lucide-react";
import { useId, useRef } from "react";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/** Confirmation for destructive actions. Cancel is focused first: it is the safe choice. */
export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	busy = false,
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const titleId = useId();
	const descriptionId = useId();
	const cancelRef = useRef<HTMLButtonElement>(null);

	return (
		<Modal
			open={open}
			onClose={onCancel}
			busy={busy}
			role="alertdialog"
			labelledBy={titleId}
			describedBy={descriptionId}
			initialFocusRef={cancelRef}
		>
			<h2
				id={titleId}
				className="text-lg font-bold text-gray-900 dark:text-white"
			>
				{title}
			</h2>
			<p
				id={descriptionId}
				className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300"
			>
				{description}
			</p>
			<div className="mt-6 flex justify-end gap-3">
				<button
					ref={cancelRef}
					type="button"
					disabled={busy}
					onClick={onCancel}
					className="cursor-pointer rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] disabled:opacity-60 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10 dark:focus-visible:outline-[#4ADE80]"
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={busy}
					onClick={onConfirm}
					className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
				>
					{busy && <Loader2 size={16} className="animate-spin" />}
					{confirmLabel}
				</button>
			</div>
		</Modal>
	);
}
