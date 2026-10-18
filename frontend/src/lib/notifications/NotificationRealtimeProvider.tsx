"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import type { CookTaleNotification } from "@/lib/api/notificationClient";
import { notificationClient } from "@/lib/api/notificationClient";
import { useAuth } from "@/lib/auth/AuthContext";

type NotificationRealtimeEvent = {
	type: "notification.created" | "notification.read" | "notification.read-all";
	data: {
		unreadCount: number;
		notification?: CookTaleNotification;
		notificationId?: string;
		readAt?: string;
	};
};

type NotificationRealtimeContextValue = {
	unreadCount: number | null;
	lastEvent: NotificationRealtimeEvent | null;
	connected: boolean;
	refreshUnreadCount: () => Promise<void>;
};

const NotificationRealtimeContext =
	createContext<NotificationRealtimeContextValue | null>(null);

const API_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export function NotificationRealtimeProvider({ children }: { children: ReactNode }) {
	const { status, accessToken } = useAuth();
	const [unreadCount, setUnreadCount] = useState<number | null>(null);
	const [lastEvent, setLastEvent] = useState<NotificationRealtimeEvent | null>(null);
	const [connected, setConnected] = useState(false);
	const reconnectTimer = useRef<number | null>(null);
	const attempt = useRef(0);

	const refreshUnreadCount = useCallback(async () => {
		if (status !== "authenticated") return;
		try {
			const result = await notificationClient.unreadCount();
			setUnreadCount(result.unreadCount);
		} catch {
			// A disconnected stream must not clear an already-correct badge.
		}
	}, [status]);

	useEffect(() => {
		if (status !== "authenticated") {
			setUnreadCount(null);
			setLastEvent(null);
			setConnected(false);
			return;
		}

		let stopped = false;
		let connecting = false;
		let controller: AbortController | null = null;

		const scheduleReconnect = () => {
			if (stopped) return;
			if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
			const delay = Math.min(30_000, 1_000 * 2 ** attempt.current);
			attempt.current += 1;
			reconnectTimer.current = window.setTimeout(() => void connect(), delay + Math.random() * 500);
		};

		const handleEvent = (event: NotificationRealtimeEvent) => {
			setLastEvent(event);
			setUnreadCount(event.data.unreadCount);
		};

		const connect = async () => {
			if (stopped || connecting) return;
			if (!accessToken) {
				// Auth and React state can settle on separate ticks after a page load.
				// Keep trying instead of leaving the page permanently disconnected.
				scheduleReconnect();
				return;
			}

			connecting = true;
			const activeController = new AbortController();
			controller = activeController;
			try {
				const response = await fetch(`${API_URL}/notifications/stream`, {
					headers: {
						Accept: "text/event-stream",
						Authorization: `Bearer ${accessToken}`,
					},
					credentials: "include",
					signal: activeController.signal,
				});
				if (!response.ok || !response.body) throw new Error("Notification stream is unavailable");

				attempt.current = 0;
				setConnected(true);
				await consumeSse(response.body, (type, data) => {
					if (type === "notification.ready") {
						const ready = data as { unreadCount?: number };
						if (typeof ready.unreadCount === "number") setUnreadCount(ready.unreadCount);
						return;
					}
					if (
						type === "notification.created" ||
						type === "notification.read" ||
						type === "notification.read-all"
					) {
						handleEvent({ type, data: data as NotificationRealtimeEvent["data"] });
					}
				});
			} catch {
				if (!activeController.signal.aborted) setConnected(false);
			} finally {
				connecting = false;
				if (controller === activeController) {
					setConnected(false);
					if (!activeController.signal.aborted) scheduleReconnect();
				}
			}
		};

		const onVisibilityChange = () => {
			if (document.visibilityState !== "visible") return;
			attempt.current = 0;
			void refreshUnreadCount();
			void connect();
		};

		const reconnectAfterAuthChange = () => {
			attempt.current = 0;
			void refreshUnreadCount();
			void connect();
		};

		void refreshUnreadCount();
		void connect();
		document.addEventListener("visibilitychange", onVisibilityChange);
		window.addEventListener("cooktale-auth-changed", reconnectAfterAuthChange);
		window.addEventListener("online", reconnectAfterAuthChange);

		return () => {
			stopped = true;
			controller?.abort();
			if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
			document.removeEventListener("visibilitychange", onVisibilityChange);
			window.removeEventListener("cooktale-auth-changed", reconnectAfterAuthChange);
			window.removeEventListener("online", reconnectAfterAuthChange);
		};
	}, [accessToken, refreshUnreadCount, status]);

	const value = useMemo(
		() => ({ unreadCount, lastEvent, connected, refreshUnreadCount }),
		[connected, lastEvent, refreshUnreadCount, unreadCount],
	);

	return (
		<NotificationRealtimeContext.Provider value={value}>
			{children}
		</NotificationRealtimeContext.Provider>
	);
}

export function useNotificationRealtime() {
	const value = useContext(NotificationRealtimeContext);
	if (!value) {
		throw new Error("useNotificationRealtime must be used inside NotificationRealtimeProvider");
	}
	return value;
}

async function consumeSse(
	body: ReadableStream<Uint8Array>,
	onEvent: (type: string, data: unknown) => void,
) {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) return;
			buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
			let boundary = buffer.indexOf("\n\n");
			while (boundary !== -1) {
				const block = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const type = block
					.split("\n")
					.find((line) => line.startsWith("event:"))
					?.slice("event:".length)
					.trim();
				const rawData = block
					.split("\n")
					.filter((line) => line.startsWith("data:"))
					.map((line) => line.slice("data:".length).trim())
					.join("\n");
				if (type && rawData) {
					try {
						onEvent(type, JSON.parse(rawData));
					} catch {
						// Ignore malformed events and stay connected for later valid updates.
					}
				}
				boundary = buffer.indexOf("\n\n");
			}
		}
	} finally {
		reader.releaseLock();
	}
}
