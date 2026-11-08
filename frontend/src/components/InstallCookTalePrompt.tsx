"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, Share2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";
import { useEffect, useRef, useState } from "react";
import {
	canShowInstallPrompt,
	INSTALL_ENGAGEMENT_EVENT,
	INSTALL_PROMPT_NEVER,
	installPromptStorage,
	isInstallEngaged,
	isInstallPromptSuppressedPath,
	isTypingTarget,
	parseInstallPromptState,
	recordInstallDismissal,
} from "@/lib/pwa/installPrompt";

const VISIT_SESSION_KEY = "cooktale.install-visit-counted";
type InstallKind = "browser" | "ios" | "mac-safari";

type DeferredInstallPrompt = Event & {
	prompt: () => Promise<unknown>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function getInstallKind(): InstallKind | null {
	const userAgent = navigator.userAgent;
	const isAppleMobile =
		/iPhone|iPad|iPod/.test(userAgent) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
	if (isAppleMobile) return "ios";

	const isMacSafari =
		/Macintosh/.test(userAgent) &&
		/Safari/.test(userAgent) &&
		!/Chrome|Chromium|CriOS|Edg|OPR/.test(userAgent);
	return isMacSafari ? "mac-safari" : null;
}

function isAlreadyInstalled() {
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		("standalone" in navigator &&
			(navigator as Navigator & { standalone?: boolean }).standalone === true)
	);
}

function countVisitOncePerSession() {
	try {
		if (window.sessionStorage.getItem(VISIT_SESSION_KEY)) return;
		window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
	} catch {
		return;
	}
	const engagement = installPromptStorage.readEngagement();
	installPromptStorage.writeEngagement({
		...engagement,
		visits: engagement.visits + 1,
	});
}

export default function InstallCookTalePrompt() {
	const pathname = usePathname();
	const deferredPrompt = useRef<DeferredInstallPrompt | null>(null);
	const [installKind, setInstallKind] = useState<InstallKind | null>(null);
	const [eligible, setEligible] = useState(false);
	const [typing, setTyping] = useState(false);

	useEffect(() => {
		if (isAlreadyInstalled()) return;
		countVisitOncePerSession();

		// Eligible = not snoozed/never AND the visitor has earned the ask.
		const refresh = () =>
			setEligible(
				canShowInstallPrompt(installPromptStorage.readPrompt(), Date.now()) &&
					isInstallEngaged(installPromptStorage.readEngagement()),
			);
		const handleStorage = (event: StorageEvent) => {
			if (event.key === null || event.key.startsWith("cooktale.install")) {
				refresh();
			}
		};
		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			deferredPrompt.current = event as DeferredInstallPrompt;
			setInstallKind("browser");
		};
		const handleInstalled = () => {
			installPromptStorage.writePrompt(INSTALL_PROMPT_NEVER);
			deferredPrompt.current = null;
			setEligible(false);
		};
		const syncTyping = () => setTyping(isTypingTarget(document.activeElement));

		refresh();
		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleInstalled);
		window.addEventListener(INSTALL_ENGAGEMENT_EVENT, refresh);
		window.addEventListener("storage", handleStorage);
		document.addEventListener("focusin", syncTyping);
		document.addEventListener("focusout", syncTyping);
		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleInstalled);
			window.removeEventListener(INSTALL_ENGAGEMENT_EVENT, refresh);
			window.removeEventListener("storage", handleStorage);
			document.removeEventListener("focusin", syncTyping);
			document.removeEventListener("focusout", syncTyping);
		};
	}, []);

	// Safari/iOS have no install event: show the manual steps shortly after the ask is earned.
	useEffect(() => {
		if (!eligible) return;
		const timer = window.setTimeout(() => {
			const kind = getInstallKind();
			if (kind) setInstallKind(kind);
		}, 3_000);
		return () => window.clearTimeout(timer);
	}, [eligible]);

	const isOpen =
		eligible &&
		installKind !== null &&
		!typing &&
		!isInstallPromptSuppressedPath(pathname);

	const shownReported = useRef(false);
	useEffect(() => {
		if (!isOpen || !installKind || shownReported.current) return;
		shownReported.current = true;
		track("install_prompt_shown", { platform: installKind });
	}, [isOpen, installKind]);

	const remindLater = () => {
		const next = recordInstallDismissal(
			installPromptStorage.readPrompt(),
			Date.now(),
		);
		installPromptStorage.writePrompt(next);
		track("install_prompt_dismissed", {
			platform: installKind ?? "unknown",
			dismissal_count: parseInstallPromptState(next).dismissals,
		});
		setEligible(false);
	};

	const neverAsk = () => {
		installPromptStorage.writePrompt(INSTALL_PROMPT_NEVER);
		track("install_prompt_dismissed", {
			platform: installKind ?? "unknown",
			dismissal_count: 99,
		});
		setEligible(false);
	};

	const install = async () => {
		if (!deferredPrompt.current) return;

		await deferredPrompt.current.prompt();
		const { outcome } = await deferredPrompt.current.userChoice;
		deferredPrompt.current = null;
		if (outcome === "accepted") {
			track("install_prompt_accepted", { platform: installKind ?? "browser" });
			installPromptStorage.writePrompt(INSTALL_PROMPT_NEVER);
			setEligible(false);
		} else {
			remindLater();
		}
	};

	const isIos = installKind === "ios";
	const isMacSafari = installKind === "mac-safari";
	const title = isIos
		? "Add CookTale to your Home Screen"
		: isMacSafari
			? "Add CookTale to your Dock"
			: "Install CookTale";

	return (
		<AnimatePresence>
			{isOpen && installKind && (
				<div
					className="fixed inset-0 z-9999 flex items-end justify-center p-4 sm:items-center"
					role="dialog"
					aria-modal="true"
					aria-labelledby="install-cooktale-title"
				>
					<motion.button
						type="button"
						aria-label="Close install CookTale prompt"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => remindLater()}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
					/>
					<motion.section
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 24 }}
						className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#152a26]"
					>
						<button
							type="button"
							onClick={() => remindLater()}
							aria-label="Remind me later"
							className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-[#4ADE80]"
						>
							<X className="h-4 w-4" />
						</button>
						<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1f7f6] text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
							<Download className="h-5 w-5" />
						</div>
						<h2
							id="install-cooktale-title"
							className="pr-8 text-xl font-bold text-gray-900 dark:text-white"
						>
							{title}
						</h2>
						<p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
							Keep your favourite recipes close and open CookTale like an app.
						</p>

						{isIos && (
							<p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-black/20 dark:text-gray-300">
								Tap{" "}
								<Share2
									className="mx-1 inline h-4 w-4 text-[#006C5E] dark:text-[#4ADE80]"
									aria-label="Share"
								/>{" "}
								then <strong>Add to Home Screen</strong>, then{" "}
								<strong>Add</strong>.
							</p>
						)}
						{isMacSafari && (
							<p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:bg-black/20 dark:text-gray-300">
								In Safari, choose <strong>File</strong>, then{" "}
								<strong>Add to Dock…</strong>.
							</p>
						)}

						<div className="mt-6 flex flex-wrap items-center gap-3">
							{installKind === "browser" ? (
								<button
									type="button"
									onClick={install}
									className="rounded-xl bg-[#006C5E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74] dark:focus-visible:outline-[#4ADE80]"
								>
									Install CookTale
								</button>
							) : (
								<span className="inline-flex items-center gap-1.5 rounded-xl bg-[#f1f7f6] px-4 py-2.5 text-sm font-semibold text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
									<Plus className="h-4 w-4" /> Follow the steps above
								</span>
							)}
							<button
								type="button"
								onClick={() => remindLater()}
								className="rounded-xl px-2 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:text-gray-300 dark:hover:text-white dark:focus-visible:outline-[#4ADE80]"
							>
								Remind me later
							</button>
							<button
								type="button"
								onClick={() => neverAsk()}
								className="rounded-xl px-2 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:text-gray-500 dark:hover:text-gray-200 dark:focus-visible:outline-[#4ADE80]"
							>
								No thanks
							</button>
						</div>
					</motion.section>
				</div>
			)}
		</AnimatePresence>
	);
}
