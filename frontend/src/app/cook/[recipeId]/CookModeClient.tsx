"use client";

import {
	ArrowLeft,
	ArrowRight,
	Check,
	CheckCircle2,
	ChefHat,
	Clock3,
	Maximize2,
	Pause,
	Play,
	TimerReset,
	UtensilsCrossed,
	X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicRecipe } from "@/lib/api/recipeClient";
import imageloader from "@/lib/loader";

type CookProgress = {
	stepIndex: number;
	checkedItemIds: string[];
};

type WakeLockLike = {
	release: () => Promise<void>;
};

const formatTime = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

const stepDurationInSeconds = (recipe: PublicRecipe, stepIndex: number) =>
	Math.max(0, (recipe.steps[stepIndex]?.timeReq || 0) * 60);

export default function CookModeClient({ recipe }: { recipe: PublicRecipe }) {
	const router = useRouter();
	const totalSteps = recipe.steps.length;
	const storageKey = `cooktale:cook-mode:${recipe.id}`;
	const wakeLockRef = useRef<WakeLockLike | null>(null);

	const [stepIndex, setStepIndex] = useState(-1);
	const [checkedItemIds, setCheckedItemIds] = useState<Set<string>>(new Set());
	const [timeLeft, setTimeLeft] = useState(0);
	const [isTimerPaused, setIsTimerPaused] = useState(false);
	const [timerFinished, setTimerFinished] = useState(false);
	const [isReady, setIsReady] = useState(false);

	const currentStep =
		stepIndex >= 0 && stepIndex < totalSteps ? recipe.steps[stepIndex] : null;
	const isComplete = stepIndex === totalSteps;
	const progress =
		totalSteps === 0
			? 0
			: isComplete
				? 100
				: Math.max(0, ((stepIndex + 1) / totalSteps) * 100);
	const prepItems = useMemo(
		() => [...recipe.ingredients, ...recipe.equipments],
		[recipe.equipments, recipe.ingredients],
	);

	useEffect(() => {
		try {
			const saved = window.localStorage.getItem(storageKey);
			if (saved) {
				const savedProgress = JSON.parse(saved) as Partial<CookProgress>;
				const savedStepIndex = Number(savedProgress.stepIndex);
				if (
					Number.isInteger(savedStepIndex) &&
					savedStepIndex >= -1 &&
					savedStepIndex < totalSteps
				) {
					setStepIndex(savedStepIndex);
					setTimeLeft(
						savedStepIndex >= 0
							? stepDurationInSeconds(recipe, savedStepIndex)
							: 0,
					);
				}
				if (Array.isArray(savedProgress.checkedItemIds)) {
					const validIds = new Set(prepItems.map((item) => item.id));
					setCheckedItemIds(
						new Set(
							savedProgress.checkedItemIds.filter((id): id is string =>
								validIds.has(id),
							),
						),
					);
				}
			}
		} catch {
			window.localStorage.removeItem(storageKey);
		} finally {
			setIsReady(true);
		}
	}, [prepItems, recipe, storageKey, totalSteps]);

	useEffect(() => {
		if (!isReady || isComplete) return;
		const savedProgress: CookProgress = {
			stepIndex,
			checkedItemIds: [...checkedItemIds],
		};
		window.localStorage.setItem(storageKey, JSON.stringify(savedProgress));
	}, [checkedItemIds, isComplete, isReady, stepIndex, storageKey]);

	const releaseWakeLock = useCallback(async () => {
		if (!wakeLockRef.current) return;
		try {
			await wakeLockRef.current.release();
		} catch {
			// Browsers can release this automatically when the tab is backgrounded.
		} finally {
			wakeLockRef.current = null;
		}
	}, []);

	useEffect(() => {
		const navigatorWithWakeLock = navigator as Navigator & {
			wakeLock?: { request: (type: "screen") => Promise<WakeLockLike> };
		};

		const requestWakeLock = async () => {
			if (
				!navigatorWithWakeLock.wakeLock ||
				document.visibilityState !== "visible"
			)
				return;
			try {
				wakeLockRef.current =
					await navigatorWithWakeLock.wakeLock.request("screen");
			} catch {
				// The browser may decline a wake lock. Cooking still works normally.
			}
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") void requestWakeLock();
		};

		void requestWakeLock();
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", onVisibilityChange);
			void releaseWakeLock();
		};
	}, [releaseWakeLock]);

	useEffect(() => {
		if (!currentStep || isTimerPaused || timeLeft <= 0) return;
		const timer = window.setInterval(() => {
			setTimeLeft((seconds) => {
				if (seconds <= 1) {
					setIsTimerPaused(true);
					setTimerFinished(true);
					return 0;
				}
				return seconds - 1;
			});
		}, 1000);
		return () => window.clearInterval(timer);
	}, [currentStep, isTimerPaused, timeLeft]);

	const openStep = useCallback(
		(nextIndex: number) => {
			setStepIndex(nextIndex);
			setTimeLeft(stepDurationInSeconds(recipe, nextIndex));
			setTimerFinished(false);
			setIsTimerPaused(false);
		},
		[recipe],
	);

	const finishCooking = useCallback(() => {
		setStepIndex(totalSteps);
		setTimeLeft(0);
		setIsTimerPaused(true);
		window.localStorage.removeItem(storageKey);
	}, [storageKey, totalSteps]);

	const goNext = useCallback(() => {
		if (totalSteps === 0) return;
		if (stepIndex === -1) return openStep(0);
		if (stepIndex < totalSteps - 1) return openStep(stepIndex + 1);
		if (stepIndex === totalSteps - 1) finishCooking();
	}, [finishCooking, openStep, stepIndex, totalSteps]);

	const goBack = useCallback(() => {
		if (stepIndex > 0) return openStep(stepIndex - 1);
		if (stepIndex === 0) {
			setStepIndex(-1);
			setTimeLeft(0);
			setTimerFinished(false);
			setIsTimerPaused(false);
		}
	}, [openStep, stepIndex]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (event.key === "ArrowRight") goNext();
			if (event.key === "ArrowLeft") goBack();
			if (event.key === " " && currentStep && timeLeft > 0) {
				event.preventDefault();
				setIsTimerPaused((paused) => !paused);
			}
			if (event.key === "Escape") router.push(`/recipe/${recipe.slug}`);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [currentStep, goBack, goNext, recipe.slug, router, timeLeft]);

	const toggleChecklistItem = (id: string) => {
		setCheckedItemIds((current) => {
			const next = new Set(current);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const resetTimer = () => {
		if (!currentStep) return;
		setTimeLeft(stepDurationInSeconds(recipe, stepIndex));
		setTimerFinished(false);
		setIsTimerPaused(false);
	};

	const exitCookMode = () => router.push(`/recipe/${recipe.slug}`);

	const enterFullscreen = () => {
		void document.documentElement.requestFullscreen?.().catch(() => undefined);
	};

	return (
		<div className="fixed inset-0 z-[100] flex min-h-dvh flex-col overflow-hidden bg-[#f7faf8] text-[#13221e] dark:bg-[#071713] dark:text-[#edf8f2]">
			<div className="h-1 w-full bg-[#d9e6df] dark:bg-white/10">
				<div
					className="h-full bg-[#06715f] transition-[width] duration-300 dark:bg-[#51de96]"
					style={{ width: `${progress}%` }}
				/>
			</div>

			<header className="flex items-center justify-between border-b border-[#dce8e1] bg-white px-4 py-3 sm:px-6 dark:border-white/10 dark:bg-[#0b211b]">
				<button
					type="button"
					onClick={exitCookMode}
					className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#4e635b] transition-colors hover:bg-[#edf4f0] hover:text-[#13221e] dark:text-[#b3c9bf] dark:hover:bg-white/10 dark:hover:text-white"
					aria-label="Exit Cook Mode"
					title="Exit Cook Mode"
				>
					<X size={21} />
				</button>
				<div className="min-w-0 text-center">
					<p className="text-xs font-medium tracking-[0.12em] text-[#06715f] uppercase dark:text-[#51de96]">
						Cook Mode
					</p>
					<h1 className="max-w-[14rem] truncate text-sm font-semibold sm:max-w-sm">
						{recipe.name}
					</h1>
				</div>
				<button
					type="button"
					onClick={enterFullscreen}
					className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-[#4e635b] transition-colors hover:bg-[#edf4f0] hover:text-[#13221e] dark:text-[#b3c9bf] dark:hover:bg-white/10 dark:hover:text-white"
					aria-label="Enter fullscreen"
					title="Enter fullscreen"
				>
					<Maximize2 size={19} />
				</button>
			</header>

			<main className="relative flex min-h-0 flex-1 overflow-hidden">
				{!isReady ? (
					<output className="flex w-full items-center justify-center text-sm text-[#667b72] dark:text-[#a5b9af]">
						Preparing your kitchen...
					</output>
				) : stepIndex === -1 ? (
					<PrepScreen
						recipe={recipe}
						checkedItemIds={checkedItemIds}
						onToggle={toggleChecklistItem}
						onStart={goNext}
						canStart={totalSteps > 0}
					/>
				) : currentStep ? (
					<StepScreen
						recipe={recipe}
						stepIndex={stepIndex}
						timeLeft={timeLeft}
						isTimerPaused={isTimerPaused}
						timerFinished={timerFinished}
						onToggleTimer={() => setIsTimerPaused((paused) => !paused)}
						onResetTimer={resetTimer}
						onBack={goBack}
						onNext={goNext}
					/>
				) : (
					<CompleteScreen
						onExit={exitCookMode}
						onShare={() => router.push("/new-story")}
					/>
				)}
			</main>
		</div>
	);
}

function PrepScreen({
	recipe,
	checkedItemIds,
	onToggle,
	onStart,
	canStart,
}: {
	recipe: PublicRecipe;
	checkedItemIds: Set<string>;
	onToggle: (id: string) => void;
	onStart: () => void;
	canStart: boolean;
}) {
	return (
		<section className="flex w-full flex-col overflow-y-auto">
			<div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
				<div className="mb-10 max-w-xl">
					<div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#e1f4ea] text-[#06715f] dark:bg-[#1b4638] dark:text-[#51de96]">
						<ChefHat size={23} />
					</div>
					<p className="mb-2 text-sm font-medium tracking-[0.12em] text-[#06715f] uppercase dark:text-[#51de96]">
						Before you start
					</p>
					<h2 className="text-3xl font-semibold sm:text-4xl">
						Get your kitchen ready.
					</h2>
					<p className="mt-3 text-base leading-7 text-[#5d7168] dark:text-[#a5b9af]">
						Check off what you have nearby. Your progress stays in this browser
						until you finish cooking.
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					<Checklist
						title="Ingredients"
						icon={<UtensilsCrossed size={19} />}
						items={recipe.ingredients}
						checkedItemIds={checkedItemIds}
						onToggle={onToggle}
					/>
					<Checklist
						title="Equipment"
						icon={<ChefHat size={19} />}
						items={recipe.equipments}
						checkedItemIds={checkedItemIds}
						onToggle={onToggle}
					/>
				</div>
			</div>
			<div className="sticky bottom-0 mt-auto border-t border-[#dce8e1] bg-white/95 px-5 py-4 backdrop-blur sm:px-8 dark:border-white/10 dark:bg-[#0b211b]/95">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
					<p className="hidden text-sm text-[#667b72] sm:block">
						{recipe.totalTimeReq > 0
							? `${recipe.totalTimeReq} minutes total`
							: "Follow each step at your pace"}
					</p>
					<button
						type="button"
						onClick={onStart}
						disabled={!canStart}
						className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#06715f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#045c4d] disabled:cursor-not-allowed disabled:bg-[#b7c8c0] dark:bg-[#51de96] dark:text-[#092016] dark:hover:bg-[#77e7aa] dark:disabled:bg-[#315242]"
					>
						Start cooking <ArrowRight size={17} />
					</button>
				</div>
			</div>
		</section>
	);
}

function Checklist({
	title,
	icon,
	items,
	checkedItemIds,
	onToggle,
}: {
	title: string;
	icon: React.ReactNode;
	items: PublicRecipe["ingredients"];
	checkedItemIds: Set<string>;
	onToggle: (id: string) => void;
}) {
	return (
		<section className="rounded-2xl border border-[#dce8e1] bg-white p-5 dark:border-white/10 dark:bg-[#0b211b]">
			<div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#285346] dark:text-[#a7d9bf]">
				{icon}
				<h3>{title}</h3>
			</div>
			{items.length ? (
				<ul className="space-y-2">
					{items.map((item) => {
						const isChecked = checkedItemIds.has(item.id);
						return (
							<li key={item.id}>
								<button
									type="button"
									onClick={() => onToggle(item.id)}
									className="group flex w-full cursor-pointer items-start gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-colors hover:border-[#cfe2d7] hover:bg-[#f4f9f6] dark:hover:border-white/10 dark:hover:bg-white/5"
									aria-pressed={isChecked}
								>
									<span
										className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isChecked ? "border-[#06715f] bg-[#06715f] text-white dark:border-[#51de96] dark:bg-[#51de96] dark:text-[#092016]" : "border-[#97aea3] text-transparent dark:border-[#769287]"}`}
									>
										<Check size={14} strokeWidth={3} />
									</span>
									<span
										className={`text-sm leading-6 ${isChecked ? "text-[#82968c] line-through dark:text-[#71877d]" : "text-[#263a31] dark:text-[#e2f0e8]"}`}
									>
										{item.name}
										{item.detail ? ` - ${item.detail}` : ""}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			) : (
				<p className="text-sm leading-6 text-[#667b72] dark:text-[#a5b9af]">
					No separate {title.toLowerCase()} listed for this recipe.
				</p>
			)}
		</section>
	);
}

function StepScreen({
	recipe,
	stepIndex,
	timeLeft,
	isTimerPaused,
	timerFinished,
	onToggleTimer,
	onResetTimer,
	onBack,
	onNext,
}: {
	recipe: PublicRecipe;
	stepIndex: number;
	timeLeft: number;
	isTimerPaused: boolean;
	timerFinished: boolean;
	onToggleTimer: () => void;
	onResetTimer: () => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const step = recipe.steps[stepIndex];
	const hasTimer = Boolean(step.timeReq && step.timeReq > 0);
	const isFinalStep = stepIndex === recipe.steps.length - 1;
	const image = step.image || recipe.mainImage;

	return (
		<section className="flex h-full w-full flex-col lg:flex-row">
			<div className="relative h-[34dvh] shrink-0 bg-[#17342a] lg:h-auto lg:w-[46%]">
				{image ? (
					<Image
						src={image}
						alt={`${recipe.name}, step ${stepIndex + 1}`}
						fill
						priority
						className="object-cover"
						loader={imageloader}
					/>
				) : (
					<div className="flex h-full items-center justify-center text-[#b8d3c4]">
						<ChefHat size={42} />
					</div>
				)}
			</div>
			<div className="flex min-h-0 flex-1 flex-col bg-[#f7faf8] dark:bg-[#071713]">
				<div className="overflow-y-auto px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
					<div className="mb-7 flex items-center justify-between gap-4">
						<p className="text-sm font-medium tracking-[0.1em] text-[#06715f] uppercase dark:text-[#51de96]">
							Step {stepIndex + 1} of {recipe.steps.length}
						</p>
						{recipe.totalTimeReq > 0 && (
							<span className="text-sm text-[#667b72] dark:text-[#a5b9af]">
								{recipe.totalTimeReq} min recipe
							</span>
						)}
					</div>
					<h2 className="max-w-2xl text-3xl leading-tight font-semibold sm:text-4xl">
						{step.name}
					</h2>
					{step.detail && (
						<p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-8 text-[#465b52] dark:text-[#c2d4cb]">
							{step.detail}
						</p>
					)}
					{hasTimer && (
						<div className="mt-9 max-w-md rounded-2xl border border-[#dce8e1] bg-white p-5 dark:border-white/10 dark:bg-[#0b211b]">
							<div className="flex items-start justify-between gap-5">
								<div>
									<div className="flex items-center gap-2 text-sm font-medium text-[#52685e] dark:text-[#a5b9af]">
										<Clock3 size={17} /> Step timer
									</div>
									<p
										className="mt-2 font-mono text-4xl font-semibold tabular-nums"
										aria-live="polite"
									>
										{formatTime(timeLeft)}
									</p>
									<p
										className={`mt-1 text-sm ${timerFinished ? "text-[#a34d3f] dark:text-[#ff9e8c]" : "text-[#667b72] dark:text-[#a5b9af]"}`}
									>
										{timerFinished
											? "Timer finished"
											: isTimerPaused
												? "Timer paused"
												: "Timer running"}
									</p>
								</div>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={onResetTimer}
										className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#dce8e1] text-[#426056] transition-colors hover:bg-[#edf4f0] dark:border-white/10 dark:text-[#b3c9bf] dark:hover:bg-white/10"
										aria-label="Reset timer"
										title="Reset timer"
									>
										<TimerReset size={18} />
									</button>
									<button
										type="button"
										onClick={onToggleTimer}
										className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#06715f] text-white transition-colors hover:bg-[#045c4d] dark:bg-[#51de96] dark:text-[#092016] dark:hover:bg-[#77e7aa]"
										aria-label={isTimerPaused ? "Start timer" : "Pause timer"}
										title={isTimerPaused ? "Start timer" : "Pause timer"}
									>
										{isTimerPaused ? (
											<Play size={18} fill="currentColor" />
										) : (
											<Pause size={18} fill="currentColor" />
										)}
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
				<div className="mt-auto flex items-center gap-3 border-t border-[#dce8e1] bg-white px-5 py-4 sm:px-10 dark:border-white/10 dark:bg-[#0b211b]">
					<button
						type="button"
						onClick={onBack}
						className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-[#dce8e1] text-[#426056] transition-colors hover:bg-[#edf4f0] dark:border-white/10 dark:text-[#b3c9bf] dark:hover:bg-white/10"
						aria-label="Previous step"
						title="Previous step"
					>
						<ArrowLeft size={19} />
					</button>
					<button
						type="button"
						onClick={onNext}
						className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#06715f] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#045c4d] dark:bg-[#51de96] dark:text-[#092016] dark:hover:bg-[#77e7aa]"
					>
						{isFinalStep ? "Finish cooking" : "Next step"}{" "}
						<ArrowRight size={17} />
					</button>
				</div>
			</div>
		</section>
	);
}

function CompleteScreen({
	onExit,
	onShare,
}: {
	onExit: () => void;
	onShare: () => void;
}) {
	return (
		<section className="flex w-full flex-col items-center justify-center px-5 text-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e1f4ea] text-[#06715f] dark:bg-[#1b4638] dark:text-[#51de96]">
				<CheckCircle2 size={30} />
			</div>
			<p className="mt-7 text-sm font-medium tracking-[0.12em] text-[#06715f] uppercase dark:text-[#51de96]">
				Cooking complete
			</p>
			<h2 className="mt-2 text-4xl font-semibold">Enjoy your meal.</h2>
			<p className="mt-4 max-w-md text-base leading-7 text-[#5d7168] dark:text-[#a5b9af]">
				Your Cook Mode progress has been cleared. You can always start it again
				from the recipe.
			</p>
			<div className="mt-8 flex flex-col gap-3 sm:flex-row">
				<button
					type="button"
					onClick={onExit}
					className="cursor-pointer rounded-full border border-[#cfe2d7] px-5 py-3 text-sm font-semibold text-[#174234] transition-colors hover:bg-[#edf4f0] dark:border-white/15 dark:text-[#d9eee2] dark:hover:bg-white/10"
				>
					Back to recipe
				</button>
				<button
					type="button"
					onClick={onShare}
					className="cursor-pointer rounded-full bg-[#06715f] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#045c4d] dark:bg-[#51de96] dark:text-[#092016] dark:hover:bg-[#77e7aa]"
				>
					Share a story
				</button>
			</div>
		</section>
	);
}
