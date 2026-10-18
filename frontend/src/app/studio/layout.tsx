"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import StudioSidebar from "./StudioSidebar";

export default function StudioLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { status, user } = useAuth();

	useEffect(() => {
		if (status === "unauthenticated") router.replace("/auth");
	}, [router, status]);

	if (status === "loading" || !user) {
		return (
			<div className="min-h-screen bg-[#f3f4f6] p-8 dark:bg-[#050a09]">
				<div className="h-12 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-white/5" />
			</div>
		);
	}

	return (
		<div className="flex min-h-screen bg-[#f3f4f6] font-sans dark:bg-[#050a09]">
			<StudioSidebar user={{ ...user, isPro: false }} />
			<main className="flex-1 overflow-x-hidden">{children}</main>
		</div>
	);
}
