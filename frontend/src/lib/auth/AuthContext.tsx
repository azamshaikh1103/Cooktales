"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	authClient,
	clearPersistedAuth,
	persistAuthResponse,
	setAccessToken,
	type AuthUser,
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
		} catch {
			clearPersistedAuth();
			setAccessTokenState(null);
			setUser(null);
			setStatus("unauthenticated");
		}
	}, []);

	useEffect(() => {
		void bootstrap();
	}, [bootstrap]);

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
