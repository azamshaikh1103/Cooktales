"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	busy?: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

/**
 * Confirmation for destructive actions. Cancel is focused first (the safe choice), Escape cancels,
 * Tab stays inside the dialog, and focus returns to what opened it.
 */
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
	const confirmRef = useRef<HTMLButtonElement>(null);
	const onCancelRef = useRef(onCancel);
	onCancelRef.current = onCancel;

	useEffect(() => {
		if (!open) return;
		const opener = document.activeElement as HTMLElement | null;
		cancelRef.current?.focus();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onCancelRef.current();
				return;
			}
			if (event.key !== "Tab") return;
			const first = cancelRef.current;
			const last = confirmRef.current;
			if (!first || !last) return;
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("keydown", onKeyDown);
			opener?.focus?.();
		};
	}, [open]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close dialog"
				tabIndex={-1}
				onClick={() => {
					if (!busy) onCancel();
				}}
				className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
			/>
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
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
						ref={confirmRef}
						type="button"
						disabled={busy}
						onClick={onConfirm}
						className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
					>
						{busy && <Loader2 size={16} className="animate-spin" />}
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
