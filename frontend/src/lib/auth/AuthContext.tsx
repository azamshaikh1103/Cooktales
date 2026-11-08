"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { setAnalyticsUser } from "@/lib/analytics/track";
import {
	type AuthUser,
	authClient,
	clearPersistedAuth,
	getAccessToken,
	getAccessTokenExpiry,
	isConfirmedSessionInvalid,
	notifyAuthLogout,
	persistAuthResponse,
	setAccessToken,
} from "@/lib/api/authClient";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
	user: AuthUser | null;
	accessToken: string | null;
	status: AuthStatus;
	setAuthenticated: (input: { user?: AuthUser; accessToken?: string }) => void;
	updateUser: (input: Partial<AuthUser>) => void;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [accessToken, setAccessTokenState] = useState<string | null>(null);
	const [status, setStatus] = useState<AuthStatus>("loading");

	const bootstrap = useCallback(async () => {
		try {
			const refreshed = await authClient.refresh();
			persistAuthResponse(refreshed);
			const hasUsableSession = Boolean(refreshed.user && refreshed.accessToken);
			setAccessTokenState(refreshed.accessToken || null);
			setUser(hasUsableSession ? refreshed.user || null : null);
			setStatus(hasUsableSession ? "authenticated" : "unauthenticated");
		} catch (error) {
			if (isConfirmedSessionInvalid(error)) {
				clearPersistedAuth();
				setAccessTokenState(null);
				setUser(null);
				setStatus("unauthenticated");
				return;
			}

			setStatus("loading");
		}
	}, []);

	useEffect(() => {
		void bootstrap();
	}, [bootstrap]);

	useEffect(() => {
		if (status === "loading") return;
		setAnalyticsUser({ loggedIn: status === "authenticated" });
	}, [status]);

	useEffect(() => {
		if (status !== "authenticated") return;

		const expiry = getAccessTokenExpiry(accessToken);
		if (!expiry) return;

		const delay = Math.max(expiry - Date.now() - 60_000, 0);
		const timer = window.setTimeout(() => void bootstrap(), delay);
		return () => window.clearTimeout(timer);
	}, [accessToken, bootstrap, status]);

	useEffect(() => {
		const syncToken = () => {
			const token = getAccessToken();
			setAccessTokenState(token);
			if (!token) {
				setUser(null);
				setStatus("unauthenticated");
			}
		};

		window.addEventListener("cooktale-auth-changed", syncToken);
		return () => window.removeEventListener("cooktale-auth-changed", syncToken);
	}, []);

	const setAuthenticated = useCallback(
		(input: { user?: AuthUser; accessToken?: string }) => {
			setAccessToken(input.accessToken || null);
			setAccessTokenState(input.accessToken || null);
			setUser(input.user || null);
			setStatus(
				input.user && input.accessToken ? "authenticated" : "unauthenticated",
			);
		},
		[],
	);

	const updateUser = useCallback((input: Partial<AuthUser>) => {
		setUser((current) => (current ? { ...current, ...input } : current));
	}, []);

	const logout = useCallback(async () => {
		try {
			await authClient.logout();
		} finally {
			notifyAuthLogout();
			clearPersistedAuth();
			setAccessTokenState(null);
			setUser(null);
			setStatus("unauthenticated");
		}
	}, []);

	const value = useMemo(
		() => ({ user, accessToken, status, setAuthenticated, updateUser, logout }),
		[user, accessToken, status, setAuthenticated, updateUser, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const value = useContext(AuthContext);
	if (!value) throw new Error("useAuth must be used inside AuthProvider");
	return value;
}
