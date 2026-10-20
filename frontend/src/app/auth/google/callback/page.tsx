"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient, persistAuthResponse } from "@/lib/api/authClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { consumeGoogleReturnTo } from "@/lib/auth/googleReturnTo";

export default function GoogleCallbackPage() {
	const router = useRouter();
	const { setAuthenticated } = useAuth();
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		const finishSignIn = async () => {
			try {
				const result = await authClient.refresh();

				if (!result.user || !result.accessToken) {
					throw new Error("Google sign-in could not be completed.");
				}

				persistAuthResponse(result);
				setAuthenticated({
					user: result.user,
					accessToken: result.accessToken,
				});
				router.replace(
					result.user.surveyCompleted ? consumeGoogleReturnTo() : "/onboarding",
				);
			} catch {
				if (active) {
					setError("Google sign-in could not be completed. Please try again.");
				}
			}
		};

		void finishSignIn();

		return () => {
			active = false;
		};
	}, [router, setAuthenticated]);

	return (
		<main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 text-center dark:bg-[#0d1f1c]">
			<div>
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
					{error || "Signing you in with Google…"}
				</h1>
				{error && (
					<button
						type="button"
						onClick={() => router.replace("/auth")}
						className="mt-5 rounded-xl bg-[#006C5E] px-5 py-3 font-semibold text-white"
					>
						Back to sign in
					</button>
				)}
			</div>
		</main>
	);
}
