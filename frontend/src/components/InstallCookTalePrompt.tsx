"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	canShowInstallPrompt,
	INSTALL_PROMPT_NEVER,
	remindLaterValue,
} from "@/lib/pwa/installPrompt";

const STORAGE_KEY = "cooktale.install-prompt";
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

export default function InstallCookTalePrompt() {
	const deferredPrompt = useRef<DeferredInstallPrompt | null>(null);
	const [installKind, setInstallKind] = useState<InstallKind | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (
			isAlreadyInstalled() ||
			!canShowInstallPrompt(localStorage.getItem(STORAGE_KEY), Date.now())
		) {
			return;
		}

		const showManualInstall = window.setTimeout(() => {
			const kind = getInstallKind();
			if (kind) {
				setInstallKind(kind);
				setIsOpen(true);
			}
		}, 5_000);

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			deferredPrompt.current = event as DeferredInstallPrompt;
			setInstallKind("browser");
			setIsOpen(true);
		};
		const handleInstalled = () => {
			localStorage.setItem(STORAGE_KEY, INSTALL_PROMPT_NEVER);
			deferredPrompt.current = null;
			setIsOpen(false);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleInstalled);
		return () => {
			window.clearTimeout(showManualInstall);
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
			window.removeEventListener("appinstalled", handleInstalled);
		};
	}, []);

	const dismiss = (value: string) => {
		localStorage.setItem(STORAGE_KEY, value);
		setIsOpen(false);
	};

	const install = async () => {
		if (!deferredPrompt.current) return;

		await deferredPrompt.current.prompt();
		const { outcome } = await deferredPrompt.current.userChoice;
		deferredPrompt.current = null;
		dismiss(
			outcome === "accepted"
				? INSTALL_PROMPT_NEVER
				: remindLaterValue(Date.now()),
		);
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
						onClick={() => dismiss(remindLaterValue(Date.now()))}
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
							onClick={() => dismiss(remindLaterValue(Date.now()))}
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
								onClick={() => dismiss(remindLaterValue(Date.now()))}
								className="rounded-xl px-2 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:text-gray-300 dark:hover:text-white dark:focus-visible:outline-[#4ADE80]"
							>
								Remind me later
							</button>
							<button
								type="button"
								onClick={() => dismiss(INSTALL_PROMPT_NEVER)}
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
