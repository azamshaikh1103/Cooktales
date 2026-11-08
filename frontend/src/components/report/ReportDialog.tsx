"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { reportsClient } from "@/lib/api/reportsClient";
import {
	REPORT_DETAILS_MAX,
	REPORT_REASONS,
	type ReportReason,
	type ReportTargetType,
	TARGET_LABEL,
} from "@/lib/reports/reasons";

type ReportDialogProps = {
	open: boolean;
	onClose: () => void;
	targetType: ReportTargetType;
	targetId: string;
};

export function ReportDialog({
	open,
	onClose,
	targetType,
	targetId,
}: ReportDialogProps) {
	const titleId = useId();
	const descriptionId = useId();
	const detailsId = useId();
	const doneRef = useRef<HTMLButtonElement>(null);
	const [reason, setReason] = useState<ReportReason | null>(null);
	const [details, setDetails] = useState("");
	const [sending, setSending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<"sent" | "already" | null>(null);
	const label = TARGET_LABEL[targetType];

	// Every time the dialog opens it starts fresh.
	useEffect(() => {
		if (!open) return;
		setReason(null);
		setDetails("");
		setError(null);
		setResult(null);
		setSending(false);
	}, [open]);

	const submit = async () => {
		if (!reason || sending) return;
		setSending(true);
		setError(null);
		try {
			const response = await reportsClient.create({
				targetType,
				targetId,
				reason,
				details: details.trim() || undefined,
			});
			setResult(response.alreadyReported ? "already" : "sent");
		} catch (caught) {
			setError(
				caught instanceof Error ? caught.message : "Could not send your report",
			);
		} finally {
			setSending(false);
		}
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			busy={sending}
			labelledBy={titleId}
			describedBy={descriptionId}
			initialFocusRef={result ? doneRef : undefined}
			maxWidth="max-w-lg"
		>
			{result ? (
				<div className="text-center">
					<CheckCircle2
						className="mx-auto text-[#006C5E] dark:text-[#4ADE80]"
						size={40}
					/>
					<h2
						id={titleId}
						className="mt-4 text-lg font-bold text-gray-900 dark:text-white"
					>
						{result === "sent"
							? "Thanks for letting us know"
							: "We already have your report"}
					</h2>
					<p
						id={descriptionId}
						className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300"
					>
						Our moderators will review this {label}. We won&apos;t share who
						reported it.
					</p>
					<button
						ref={doneRef}
						type="button"
						onClick={onClose}
						className="mt-6 cursor-pointer rounded-full bg-[#006c5e] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#005a4f] dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#73e99d]"
					>
						Done
					</button>
				</div>
			) : (
				<>
					<h2
						id={titleId}
						className="text-lg font-bold text-gray-900 dark:text-white"
					>
						Report this {label}
					</h2>
					<p
						id={descriptionId}
						className="mt-1 text-sm text-gray-600 dark:text-gray-300"
					>
						What&apos;s wrong with it? Pick the closest reason.
					</p>

					<fieldset className="mt-4 space-y-2">
						<legend className="sr-only">Reason for reporting</legend>
						{REPORT_REASONS.map((option) => (
							<label
								key={option.value}
								className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:bg-gray-50 has-[:checked]:border-[#006C5E] has-[:checked]:bg-[#006C5E]/5 dark:border-white/10 dark:hover:bg-white/5 dark:has-[:checked]:border-[#4ADE80] dark:has-[:checked]:bg-[#4ADE80]/10"
							>
								<input
									type="radio"
									name="report-reason"
									value={option.value}
									checked={reason === option.value}
									onChange={() => setReason(option.value)}
									className="mt-1 h-4 w-4 cursor-pointer accent-[#006C5E] dark:accent-[#4ADE80]"
								/>
								<span>
									<span className="block text-sm font-semibold text-gray-900 dark:text-white">
										{option.label}
									</span>
									<span className="block text-xs text-gray-500 dark:text-gray-400">
										{option.hint}
									</span>
								</span>
							</label>
						))}
					</fieldset>

					<label
						htmlFor={detailsId}
						className="mt-4 block text-sm font-semibold text-gray-900 dark:text-white"
					>
						Details{" "}
						<span className="font-normal text-gray-500">(optional)</span>
					</label>
					<textarea
						id={detailsId}
						value={details}
						maxLength={REPORT_DETAILS_MAX}
						onChange={(event) => setDetails(event.target.value)}
						rows={3}
						placeholder="Anything that helps us understand"
						className="mt-2 w-full resize-none rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[#006C5E] focus:ring-2 focus:ring-[#006C5E]/15 dark:border-white/15 dark:bg-white/[0.03] dark:text-white dark:focus:border-[#4ADE80] dark:focus:ring-[#4ADE80]/15"
					/>
					<p className="mt-1 text-right text-xs text-gray-500 tabular-nums dark:text-gray-400">
						{details.length}/{REPORT_DETAILS_MAX}
					</p>

					{error && (
						<p
							role="alert"
							className="mt-2 text-sm text-red-600 dark:text-red-400"
						>
							{error}
						</p>
					)}

					<div className="mt-5 flex justify-end gap-3">
						<button
							type="button"
							onClick={onClose}
							disabled={sending}
							className="cursor-pointer rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={submit}
							disabled={!reason || sending}
							className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#006c5e] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#005a4f] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#73e99d]"
						>
							{sending && <Loader2 size={16} className="animate-spin" />}
							Send report
						</button>
					</div>
				</>
			)}
		</Modal>
	);
}
