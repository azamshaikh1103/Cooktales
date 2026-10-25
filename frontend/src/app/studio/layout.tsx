"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Navbar from "@/components/Navbar";
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
			<div className="min-h-screen bg-[#fafafa] p-8 dark:bg-[#0d1f1c]">
				<div className="h-12 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-white/5" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#fafafa] font-sans transition-colors duration-500 dark:bg-[#0d1f1c]">
			<Navbar alwaysVisible />
			<main className="mx-auto min-h-screen w-full max-w-7xl px-5 pt-28 pb-20 lg:px-8">
				<StudioSidebar user={user} />
				{children}
			</main>
		</div>
	);
}
