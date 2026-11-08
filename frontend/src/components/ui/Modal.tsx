"use client";

import { type ReactNode, type RefObject, useEffect, useRef } from "react";

const FOCUSABLE =
	'button:not(:disabled), [href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
	open: boolean;
	onClose: () => void;
	labelledBy: string;
	describedBy?: string;
	role?: "dialog" | "alertdialog";
	/** While busy the dialog cannot be dismissed (a request is in flight). */
	busy?: boolean;
	/** Element to focus first; defaults to the first focusable element. */
	initialFocusRef?: RefObject<HTMLElement | null>;
	maxWidth?: string;
	children: ReactNode;
};

/**
 * Accessible modal shell: focus moves in, Tab stays inside, Escape and the backdrop close it, and
 * focus returns to whatever opened it.
 */
export function Modal({
	open,
	onClose,
	labelledBy,
	describedBy,
	role = "dialog",
	busy = false,
	initialFocusRef,
	maxWidth = "max-w-md",
	children,
}: ModalProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const busyRef = useRef(busy);
	busyRef.current = busy;

	useEffect(() => {
		if (!open) return;
		const opener = document.activeElement as HTMLElement | null;
		(
			initialFocusRef?.current ??
			panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
		)?.focus();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				if (!busyRef.current) onCloseRef.current();
				return;
			}
			if (event.key !== "Tab" || !panelRef.current) return;
			const items = Array.from(
				panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
			);
			if (!items.length) return;
			const first = items[0];
			const last = items[items.length - 1];
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
	}, [open, initialFocusRef]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close dialog"
				tabIndex={-1}
				onClick={() => {
					if (!busy) onClose();
				}}
				className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
			/>
			{/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role is always dialog or alertdialog, and both support aria-modal */}
			<div
				ref={panelRef}
				role={role}
				aria-modal="true"
				aria-labelledby={labelledBy}
				aria-describedby={describedBy}
				className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#152a26] ${maxWidth}`}
			>
				{children}
			</div>
		</div>
	);
}
