"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
	adminReportsClient,
	type ReportGroup,
	type ReportStatus,
} from "@/lib/api/reportsClient";
import { useAuth } from "@/lib/auth/AuthContext";
import {
	REASON_LABEL,
	type ReportReason,
	TARGET_LABEL,
} from "@/lib/reports/reasons";

const TABS: ReadonlyArray<{ value: ReportStatus; label: string }> = [
	{ value: "OPEN", label: "Open" },
	{ value: "ACTIONED", label: "Removed" },
	{ value: "DISMISSED", label: "Dismissed" },
];

const groupKey = (group: ReportGroup) =>
	`${group.targetType}:${group.targetId}`;

export default function AdminReportsPage() {
	const { user, status } = useAuth();
	const isAdmin = status === "authenticated" && user?.role === "ADMIN";
	const [tab, setTab] = useState<ReportStatus>("OPEN");
	const [groups, setGroups] = useState<ReportGroup[]>([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busyKey, setBusyKey] = useState<string | null>(null);
	const [removing, setRemoving] = useState<ReportGroup | null>(null);

	const load = useCallback(
		async (nextPage: number, replace: boolean) => {
			setLoading(true);
			setError(null);
			try {
				const result = await adminReportsClient.list(tab, nextPage);
				setGroups((current) =>
					replace ? result.reports : [...current, ...result.reports],
				);
				setPage(result.page);
				setHasMore(result.hasMore);
				setTotal(result.total);
			} catch (caught) {
				setError(
					caught instanceof Error ? caught.message : "Could not load reports",
				);
			} finally {
				setLoading(false);
			}
		},
		[tab],
	);

	useEffect(() => {
		if (isAdmin) void load(1, true);
	}, [isAdmin, load]);

	const finish = (group: ReportGroup, message: string) => {
		setGroups((current) =>
			current.filter((item) => groupKey(item) !== groupKey(group)),
		);
		setTotal((current) => Math.max(0, current - 1));
		toast.success(message);
	};

	const dismiss = async (group: ReportGroup) => {
		setBusyKey(groupKey(group));
		try {
			await adminReportsClient.dismiss(group.targetType, group.targetId);
			finish(group, "Reports dismissed");
		} catch (caught) {
			toast.error(
				caught instanceof Error ? caught.message : "Could not dismiss",
			);
		} finally {
			setBusyKey(null);
		}
	};

	const remove = async () => {
		if (!removing) return;
		const group = removing;
		setBusyKey(groupKey(group));
		try {
			await adminReportsClient.remove(group.targetType, group.targetId);
			setRemoving(null);
			finish(group, `The ${TARGET_LABEL[group.targetType]} was removed`);
		} catch (caught) {
			toast.error(
				caught instanceof Error ? caught.message : "Could not remove",
			);
		} finally {
			setBusyKey(null);
		}
	};

	return (
		<div className="min-h-screen bg-[#fafafa] text-gray-900 dark:bg-[#0d1f1c] dark:text-white">
			<Navbar />
			<main className="mx-auto w-full max-w-3xl px-4 pt-28 pb-24 sm:px-6">
				<h1 className="text-2xl font-bold tracking-tight">Reports</h1>

				{status === "loading" ? (
					<p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
						Loading…
					</p>
				) : !isAdmin ? (
					<p className="mt-6 text-sm text-gray-600 dark:text-gray-300">
						This page is for CookTale moderators.
					</p>
				) : (
					<>
						<div
							role="tablist"
							aria-label="Report status"
							className="mt-6 inline-flex rounded-full border border-gray-300 p-1 dark:border-white/15"
						>
							{TABS.map((item) => (
								<button
									key={item.value}
									type="button"
									role="tab"
									aria-selected={tab === item.value}
									onClick={() => setTab(item.value)}
									className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
										tab === item.value
											? "bg-[#006c5e] text-white dark:bg-[#4ade80] dark:text-[#092019]"
											: "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
									}`}
								>
									{item.label}
								</button>
							))}
						</div>
						<p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
							{total} {total === 1 ? "item" : "items"}
						</p>

						{error && (
							<p
								role="alert"
								className="mt-4 text-sm text-red-600 dark:text-red-400"
							>
								{error}
							</p>
						)}

						{!loading && !error && groups.length === 0 && (
							<p className="mt-8 rounded-2xl bg-gray-100 px-5 py-8 text-center text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
								Nothing here. {tab === "OPEN" ? "No open reports." : ""}
							</p>
						)}

						<ul className="mt-6 space-y-4">
							{groups.map((group) => {
								const key = groupKey(group);
								const busy = busyKey === key;
								return (
									<li
										key={key}
										className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
									>
										<div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
											<span className="rounded-full bg-[#006C5E]/10 px-2.5 py-1 text-[#006C5E] capitalize dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
												{TARGET_LABEL[group.targetType]}
											</span>
											<span className="text-gray-600 dark:text-gray-300">
												{group.reportCount}{" "}
												{group.reportCount === 1 ? "report" : "reports"}
											</span>
											<span className="text-gray-400">
												· last{" "}
												{new Date(group.lastReportedAt).toLocaleDateString()}
											</span>
											{group.target.state === "REMOVED" && (
												<span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-white/10 dark:text-gray-300">
													Already removed
												</span>
											)}
										</div>

										<h2 className="mt-3 text-base font-bold">
											{group.target.url ? (
												<Link
													href={group.target.url}
													target="_blank"
													className="inline-flex items-center gap-1.5 hover:underline"
												>
													{group.target.title}
													<ExternalLink size={14} aria-hidden="true" />
												</Link>
											) : (
												group.target.title
											)}
										</h2>
										{group.target.author && (
											<p className="text-xs text-gray-500 dark:text-gray-400">
												by {group.target.author.name}
											</p>
										)}
										{group.target.excerpt && (
											<p className="mt-2 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
												{group.target.excerpt}
											</p>
										)}

										<ul className="mt-3 flex flex-wrap gap-2">
											{(
												Object.entries(group.reasons) as [
													ReportReason,
													number,
												][]
											).map(([reason, count]) => (
												<li
													key={reason}
													className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-700 dark:border-white/10 dark:text-gray-200"
												>
													{REASON_LABEL[reason]} × {count}
												</li>
											))}
										</ul>

										{group.notes.length > 0 && (
											<ul className="mt-3 space-y-1.5">
												{group.notes.map((note) => (
													<li
														key={`${note.createdAt}-${note.reporterName}`}
														className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-200"
													>
														&ldquo;{note.details}&rdquo;{" "}
														<span className="text-xs text-gray-500 dark:text-gray-400">
															— {note.reporterName}
														</span>
													</li>
												))}
											</ul>
										)}

										{tab === "OPEN" && (
											<div className="mt-4 flex justify-end gap-2">
												<button
													type="button"
													disabled={busy}
													onClick={() => dismiss(group)}
													className="cursor-pointer rounded-full border border-gray-300 px-4 py-1.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-60 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
												>
													Dismiss
												</button>
												<button
													type="button"
													disabled={busy}
													onClick={() => setRemoving(group)}
													className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
												>
													{busy && (
														<Loader2 size={14} className="animate-spin" />
													)}
													Remove {TARGET_LABEL[group.targetType]}
												</button>
											</div>
										)}
									</li>
								);
							})}
						</ul>

						{loading && (
							<p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
								Loading…
							</p>
						)}
						{hasMore && !loading && (
							<button
								type="button"
								onClick={() => void load(page + 1, false)}
								className="mt-6 cursor-pointer rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/10"
							>
								Load more
							</button>
						)}
					</>
				)}
			</main>
			<Footer />

			<ConfirmDialog
				open={removing !== null}
				busy={busyKey !== null && removing !== null}
				title={`Remove this ${removing ? TARGET_LABEL[removing.targetType] : "content"}?`}
				description={
					removing &&
					(removing.targetType === "RECIPE" || removing.targetType === "STORY")
						? "It is hidden from readers. You can restore it from the admin tools."
						: "It is removed from the community. This can't be undone."
				}
				confirmLabel="Remove"
				onConfirm={remove}
				onCancel={() => setRemoving(null)}
			/>
		</div>
	);
}
