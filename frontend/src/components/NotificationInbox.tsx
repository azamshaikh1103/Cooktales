"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiCheckCircle } from "react-icons/fi";
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

export default function NotificationInbox() {
	const { status } = useAuth();
	const { unreadCount: liveUnreadCount, lastEvent, refreshUnreadCount: refreshLiveUnreadCount } =
		useNotificationRealtime();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [markingAll, setMarkingAll] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [notifications, setNotifications] = useState<CookTaleNotification[]>(
		[],
	);
	const containerRef = useRef<HTMLDivElement>(null);

	const refreshUnreadCount = useCallback(async () => {
		await refreshLiveUnreadCount();
	}, [refreshLiveUnreadCount]);

	const loadNotifications = useCallback(async () => {
		if (status !== "authenticated") return;
		setLoading(true);
		try {
			const response = await notificationClient.list({ limit: 20 });
			setNotifications(response.notifications);
			setUnreadCount(response.unreadCount);
		} catch {
			setNotifications([]);
		} finally {
			setLoading(false);
		}
	}, [status]);

	useEffect(() => {
		if (liveUnreadCount !== null) setUnreadCount(liveUnreadCount);
	}, [liveUnreadCount]);

	useEffect(() => {
		if (!lastEvent) return;
		if (lastEvent.type === "notification.created" && lastEvent.data.notification) {
			setNotifications((current) => [
				lastEvent.data.notification!,
				...current.filter((item) => item.id !== lastEvent.data.notification!.id),
			].slice(0, 20));
			return;
		}
		if (lastEvent.type === "notification.read" && lastEvent.data.notificationId) {
			setNotifications((current) =>
				current.map((item) =>
					item.id === lastEvent.data.notificationId
						? { ...item, readAt: lastEvent.data.readAt || new Date().toISOString() }
						: item,
				),
			);
			return;
		}
		if (lastEvent.type === "notification.read-all") {
			setNotifications((current) =>
				current.map((item) => ({
					...item,
					readAt: item.readAt || lastEvent.data.readAt || new Date().toISOString(),
				})),
			);
		}
	}, [lastEvent]);

	useEffect(() => {
		if (!open) return;
		void loadNotifications();
		const onMouseDown = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onMouseDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onMouseDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open, loadNotifications]);

	if (status === "loading")
		return <div className="h-10 w-10" aria-hidden="true" />;
	if (status !== "authenticated") return null;

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
				.catch(() => void refreshUnreadCount());
		}
		setOpen(false);
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
			void refreshUnreadCount();
		} finally {
			setMarkingAll(false);
		}
	}

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				className="relative grid h-10 w-10 cursor-pointer place-items-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#006C5E] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-[#4ADE80]"
				aria-label={
					unreadCount
						? `${unreadCount} unread notifications`
						: "Open notifications"
				}
				aria-expanded={open}
			>
				<FiBell className="h-[18px] w-[18px]" />
				{unreadCount > 0 && (
					<span className="absolute top-0.5 right-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#006C5E] px-1 text-[9px] font-bold leading-none text-white dark:bg-[#4ADE80] dark:text-[#0d1f1c]">
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{open && (
				<div className="absolute top-12 right-0 z-60 w-96 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#152a26]">
					<div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/10">
						<div>
							<p className="text-sm font-semibold text-gray-900 dark:text-white">
								Notifications
							</p>
							<p className="text-xs text-gray-500 dark:text-gray-400">
								{unreadCount
									? `${unreadCount} unread`
									: "You are all caught up"}
							</p>
						</div>
						{unreadCount > 0 && (
							<button
								type="button"
								onClick={() => void markAllRead()}
								disabled={markingAll}
								className="flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#006C5E] transition-colors hover:bg-[#f1f7f6] disabled:cursor-wait disabled:opacity-60 dark:text-[#4ADE80] dark:hover:bg-white/10"
							>
								<FiCheckCircle className="h-3.5 w-3.5" />
								Mark all read
							</button>
						)}
					</div>

					<div className="max-h-[26rem] overflow-y-auto">
						{loading ? (
							<output
								className="space-y-3 p-4"
								aria-label="Loading notifications"
							>
								{[1, 2, 3].map((item) => (
									<div key={item} className="flex animate-pulse gap-3">
										<div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10" />
										<div className="flex-1 space-y-2 pt-1">
											<div className="h-3 w-4/5 rounded bg-gray-100 dark:bg-white/10" />
											<div className="h-2.5 w-1/4 rounded bg-gray-100 dark:bg-white/10" />
										</div>
									</div>
								))}
							</output>
						) : notifications.length ? (
							notifications.map((notification) => (
								<button
									type="button"
									key={notification.id}
									onClick={() => void openNotification(notification)}
									className={`flex w-full cursor-pointer gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#f7faf8] dark:border-white/5 dark:hover:bg-white/5 ${notification.readAt ? "" : "bg-[#f1f7f6]/70 dark:bg-white/[0.03]"}`}
								>
									<div className="relative mt-0.5 h-9 w-9 shrink-0">
										{notification.actor?.image ? (
											<Image
												src={notification.actor.image}
												alt=""
												width={36}
												height={36}
												loader={imageLoader}
												className="h-9 w-9 rounded-full object-cover"
											/>
										) : (
											<NotificationTypeIcon type={notification.type} size={17} className="h-9 w-9" />
										)}
										{notification.actor?.image && (
											<div className="absolute -right-1 -bottom-1 grid h-4 w-4 place-items-center rounded-full border-2 border-white dark:border-[#152a26]">
												<NotificationTypeIcon type={notification.type} size={9} className="h-full w-full" />
											</div>
										)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-sm leading-5 text-gray-700 dark:text-gray-200">
											{notificationText(notification)}
										</p>
										<p className="mt-1 text-xs text-gray-400">
											{relativeTime(notification.createdAt)}
										</p>
									</div>
									{!notification.readAt && (
										<span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#006C5E] dark:bg-[#4ADE80]" />
									)}
								</button>
							))
						) : (
							<div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
								<div className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f7f6] text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
									<FiCheck className="h-5 w-5" />
								</div>
								<p className="mt-3 text-sm font-medium text-gray-800 dark:text-white">
									Nothing new yet
								</p>
								<p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
									Activity from your kitchen will appear here.
								</p>
							</div>
						)}
					</div>
					<div className="border-t border-gray-100 p-2 dark:border-white/10">
						<Link
							href="/notifications"
							onClick={() => setOpen(false)}
							className="flex cursor-pointer items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-[#006C5E] transition-colors hover:bg-[#f1f7f6] dark:text-[#4ADE80] dark:hover:bg-white/10"
						>
							View all notifications
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
