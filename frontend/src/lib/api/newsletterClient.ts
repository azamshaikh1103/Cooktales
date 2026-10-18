import { ApiClientError } from "./authClient";

const API_URL =
	typeof window === "undefined"
		? process.env.SERVER_API_URL ||
			process.env.NEXT_SERVER_API_URL ||
			process.env.NEXT_PUBLIC_API_URL ||
			"http://localhost:4000/api/v1"
		: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type ApiError = { message?: string | string[]; error?: string };

export const newsletterClient = {
	async subscribe(email: string) {
		const response = await fetch(`${API_URL}/newsletter/subscriptions`, {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email }),
		});
		const payload = (await response.json().catch(() => ({}))) as {
			accepted?: boolean;
			message?: string | string[];
			error?: string;
		};

		if (!response.ok) {
			const message = Array.isArray(payload.message)
				? payload.message[0]
				: payload.message || payload.error || "Newsletter signup is unavailable right now.";
			throw new ApiClientError(message, response.status);
		}

		return payload as { accepted: boolean; message: string };
	},
};
