"use client";

import { Check, CheckCheck, ChevronRight, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import {
	type CookTaleNotification,
	notificationClient,
} from "@/lib/api/notificationClient";
import { useAuth } from "@/lib/auth/AuthContext";
import imageLoader from "@/lib/loader";
import { useNotificationRealtime } from "@/lib/notifications/NotificationRealtimeProvider";
import {
	notificationText,
	relativeTime,
} from "@/lib/notifications/presentation";
import { NotificationTypeIcon } from "@/lib/notifications/NotificationTypeIcon";

type Filter = "all" | "unread";

function NotificationAvatar({
	notification,
}: {
	notification: CookTaleNotification;
}) {
	if (notification.actor?.image) {
		return (
			<Image
				src={notification.actor.image}
				alt=""
				width={44}
				height={44}
				loader={imageLoader}
				className="h-11 w-11 rounded-full object-cover"
			/>
		);
	}

	return <NotificationTypeIcon type={notification.type} size={20} />;
}

export default function NotificationCenter() {
	const { status } = useAuth();
	const { unreadCount: liveUnreadCount, lastEvent } = useNotificationRealtime();
	const router = useRouter();
	const [filter, setFilter] = useState<Filter>("all");
	const [notifications, setNotifications] = useState<CookTaleNotification[]>(
		[],
	);
	const [unreadCount, setUnreadCount] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [markingAll, setMarkingAll] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (nextPage: number, append = false) => {
			if (status !== "authenticated") return;
			if (append) setLoadingMore(true);
			else setLoading(true);
			setError(null);
			try {
				const response = await notificationClient.list({
					page: nextPage,
					limit: 20,
					unreadOnly: filter === "unread",
				});
				setNotifications((current) =>
					append
						? [...current, ...response.notifications]
						: response.notifications,
				);
				setUnreadCount(response.unreadCount);
				setPage(response.page);
				setHasMore(response.hasMore);
			} catch (requestError) {
				if (!append) setNotifications([]);
				setError(
					requestError instanceof Error
						? requestError.message
						: "Notifications are unavailable right now.",
				);
			} finally {
				setLoading(false);
				setLoadingMore(false);
			}
		},
		[filter, status],
	);

	useEffect(() => {
		if (status === "unauthenticated") router.replace("/auth");
	}, [router, status]);

	useEffect(() => {
		if (status === "authenticated") void load(1);
	}, [load, status]);

	useEffect(() => {
		if (liveUnreadCount !== null) setUnreadCount(liveUnreadCount);
	}, [liveUnreadCount]);

	useEffect(() => {
		if (!lastEvent) return;
		if (lastEvent.type === "notification.created" && lastEvent.data.notification) {
			if (filter === "unread" || filter === "all") {
				setNotifications((current) => [
					lastEvent.data.notification!,
					...current.filter((item) => item.id !== lastEvent.data.notification!.id),
				].slice(0, 20));
			}
			return;
		}
		if (lastEvent.type === "notification.read" && lastEvent.data.notificationId) {
			if (filter === "unread") {
				setNotifications((current) =>
					current.filter((item) => item.id !== lastEvent.data.notificationId),
				);
			} else {
				setNotifications((current) =>
					current.map((item) =>
						item.id === lastEvent.data.notificationId
							? { ...item, readAt: lastEvent.data.readAt || new Date().toISOString() }
							: item,
					),
				);
			}
			return;
		}
		if (lastEvent.type === "notification.read-all") {
			setNotifications((current) =>
				filter === "unread"
					? []
					: current.map((item) => ({
						...item,
						readAt: item.readAt || lastEvent.data.readAt || new Date().toISOString(),
					})),
			);
		}
	}, [filter, lastEvent]);

	async function openNotification(notification: CookTaleNotification) {
		if (!notification.readAt) {
			setNotifications((current) =>
				current.map((item) =>
					item.id === notification.id
						? { ...item, readAt: new Date().toISOString() }
						: item,
				),
			);
			setUnreadCount((current) => Math.max(0, current - 1));
			void notificationClient
				.markRead(notification.id)
				.catch(() => void load(1));
		}
		if (notification.targetPath?.startsWith("/"))
			router.push(notification.targetPath);
	}

	async function markAllRead() {
		setMarkingAll(true);
		try {
			await notificationClient.markAllRead();
			setUnreadCount(0);
			setNotifications((current) =>
				current.map((item) => ({
					...item,
					readAt: item.readAt || new Date().toISOString(),
				})),
			);
		} catch {
			void load(1);
		} finally {
			setMarkingAll(false);
		}
	}

	function changeFilter(nextFilter: Filter) {
		if (nextFilter === filter) return;
		setFilter(nextFilter);
	}

	const isLoadingState = status === "loading" || loading;

	return (
		<div className="flex min-h-screen flex-col bg-[#f7faf8] text-slate-900 dark:bg-[#071a16] dark:text-white">
			<Navbar />
			<main className="grow px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
				<div className="mx-auto max-w-4xl">
					<header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between dark:border-white/10">
						<div>
							<p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
								Your kitchen
							</p>
							<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
								Notifications
							</h1>
							<p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
								{unreadCount
									? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
									: "You are all caught up."}
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								onClick={() => void load(1)}
								disabled={isLoadingState}
								className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-slate-300 bg-white text-slate-600 transition-colors hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
								aria-label="Refresh notifications"
							>
								<RefreshCw
									size={17}
									className={isLoadingState ? "animate-spin" : ""}
									aria-hidden="true"
								/>
							</button>
							{unreadCount > 0 && (
								<button
									type="button"
									onClick={() => void markAllRead()}
									disabled={markingAll}
									className="flex cursor-pointer items-center gap-2 rounded-md border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-300 dark:bg-emerald-300 dark:text-[#071a16] dark:hover:bg-emerald-200"
								>
									<CheckCheck size={17} aria-hidden="true" />
									Mark all read
								</button>
							)}
						</div>
					</header>

					<div
						className="mt-6 flex gap-2"
						role="tablist"
						aria-label="Notification filter"
					>
						{(["all", "unread"] as const).map((item) => {
							const selected = filter === item;
							return (
								<button
									key={item}
									type="button"
									role="tab"
									aria-selected={selected}
									onClick={() => changeFilter(item)}
									className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors ${selected ? "bg-[#006C5E] text-white dark:bg-[#4ADE80] dark:text-[#071a16]" : "bg-transparent text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/5"}`}
								>
									{item === "all" ? "All activity" : "Unread"}
								</button>
							);
						})}
					</div>

					<section
						className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#102622]"
						aria-live="polite"
					>
						{isLoadingState ? (
							<output
								className="space-y-5 p-5"
								aria-label="Loading notifications"
							>
								{[1, 2, 3, 4].map((item) => (
									<div
										key={item}
										className="flex animate-pulse items-start gap-4"
									>
										<div className="h-11 w-11 shrink-0 rounded-full bg-slate-100 dark:bg-white/10" />
										<div className="flex-1 space-y-2 pt-1">
											<div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-white/10" />
											<div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-white/10" />
										</div>
									</div>
								))}
							</output>
						) : error ? (
							<div className="p-8 text-center">
								<p className="text-sm text-slate-600 dark:text-slate-300">
									{error}
								</p>
								<button
									type="button"
									onClick={() => void load(1)}
									className="mt-4 cursor-pointer text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
								>
									Try again
								</button>
							</div>
						) : notifications.length ? (
							<div>
								{notifications.map((notification) => (
									<button
										key={notification.id}
										type="button"
										onClick={() => void openNotification(notification)}
										className={`flex w-full cursor-pointer items-start gap-4 border-b border-slate-100 p-5 text-left transition-colors last:border-b-0 hover:bg-[#f7faf8] dark:border-white/5 dark:hover:bg-white/5 ${notification.readAt ? "" : "bg-[#f1f7f6]/80 dark:bg-white/[0.03]"}`}
									>
										<NotificationAvatar notification={notification} />
										<div className="min-w-0 flex-1">
											<p className="text-sm leading-6 text-slate-700 dark:text-slate-200">
												{notificationText(notification)}
											</p>
											<p className="mt-1 text-xs text-slate-400">
												{relativeTime(notification.createdAt)}
											</p>
										</div>
										{notification.readAt ? (
											<ChevronRight
												className="mt-2 shrink-0 text-slate-400"
												size={17}
												aria-hidden="true"
											/>
										) : (
											<span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#006C5E] dark:bg-[#4ADE80]" />
										)}
									</button>
								))}
								{hasMore && (
									<div className="p-4 text-center">
										<button
											type="button"
											onClick={() => void load(page + 1, true)}
											disabled={loadingMore}
											className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:border-white/15 dark:text-slate-200 dark:hover:border-emerald-300 dark:hover:text-emerald-200"
										>
											{loadingMore ? "Loading..." : "Load more"}
										</button>
									</div>
								)}
							</div>
						) : (
							<div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
								<div className="grid h-12 w-12 place-items-center rounded-full bg-[#e2efec] text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
									<Check size={22} aria-hidden="true" />
								</div>
								<h2 className="mt-4 text-lg font-semibold">
									{filter === "unread"
										? "No unread notifications"
										: "Nothing new yet"}
								</h2>
								<p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
									{filter === "unread"
										? "You have read every update from your kitchen."
										: "Likes, comments, reviews, and new followers will show up here."}
								</p>
							</div>
						)}
					</section>
				</div>
			</main>
		</div>
	);
}
