"use client";

import {
	BookOpen,
	ChefHat,
	ChevronDown,
	Clock3,
	Search,
	UserRound,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
	type FormEvent,
	type MouseEvent,
	Suspense,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import {
	type SearchResult,
	type SearchSort,
	type SearchType,
	searchClient,
} from "@/lib/api/searchClient";
import imageLoader from "@/lib/loader";

const typeOptions: Array<{ value: SearchType; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "recipe", label: "Recipes" },
	{ value: "story", label: "Stories" },
	{ value: "chef", label: "Chefs" },
];

const sortOptions: Array<{ value: SearchSort; label: string }> = [
	{ value: "relevance", label: "Most relevant" },
	{ value: "latest", label: "Newest" },
	{ value: "popular", label: "Most popular" },
];

const timeOptions = [
	{ value: undefined, label: "Any time" },
	{ value: 20, label: "20 minutes or less" },
	{ value: 30, label: "30 minutes or less" },
	{ value: 45, label: "45 minutes or less" },
	{ value: 60, label: "1 hour or less" },
];

function resultHref(result: SearchResult) {
	if (result.type === "recipe") return `/recipe/${result.slug || result.id}`;
	if (result.type === "story") return `/stories/${result.slug || result.id}`;
	return `/profile/${result.slug || result.id}`;
}

function ResultIcon({ type }: { type: SearchResult["type"] }) {
	if (type === "recipe") return <ChefHat size={20} aria-hidden="true" />;
	if (type === "story") return <BookOpen size={20} aria-hidden="true" />;
	return <UserRound size={20} aria-hidden="true" />;
}

function ResultCard({ result }: { result: SearchResult }) {
	const label =
		result.type === "recipe"
			? "Recipe"
			: result.type === "story"
				? "Story"
				: "Chef";
	const metadata = [
		result.type === "recipe" && result.totalTime
			? `${result.totalTime} min`
			: null,
		result.type === "recipe" && result.cuisine && result.cuisine !== "NA"
			? result.cuisine
			: null,
		result.type === "chef" && result.authorUsername
			? `@${result.authorUsername}`
			: null,
	].filter(Boolean);

	return (
		<Link
			href={resultHref(result)}
			className="group flex min-h-36 gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-600/45 hover:bg-emerald-50/40 dark:border-white/10 dark:bg-[#102622] dark:hover:border-emerald-300/40 dark:hover:bg-white/5"
		>
			<div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
				{result.image ? (
					<Image
						src={result.image}
						alt=""
						fill
						sizes="80px"
						className="object-cover"
						loader={imageLoader}
					/>
				) : (
					<ResultIcon type={result.type} />
				)}
			</div>
			<div className="min-w-0 flex-1 py-0.5">
				<p className="mb-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
					{label}
				</p>
				<h2 className="line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-200">
					{result.title}
				</h2>
				{result.description && (
					<p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
						{result.description}
					</p>
				)}
				<div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
					{result.authorName && <span>by {result.authorName}</span>}
					{metadata.map((item) => (
						<span key={item}>{item}</span>
					))}
				</div>
			</div>
		</Link>
	);
}

function SearchPageContent() {
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";
	const [query, setQuery] = useState(initialQuery);
	const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
	const [type, setType] = useState<SearchType>("all");
	const [sort, setSort] = useState<SearchSort>("relevance");
	const [maxMinutes, setMaxMinutes] = useState<number | undefined>();
	const [page, setPage] = useState(1);
	const [results, setResults] = useState<SearchResult[]>([]);
	const [total, setTotal] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef<AbortController | null>(null);

	const canSearch = submittedQuery.length >= 2;
	const resultLabel = useMemo(() => {
		if (!canSearch) return "Search recipes, stories, and chefs";
		if (loading) return "Searching";
		return total === 1 ? "1 result" : `${total} results`;
	}, [canSearch, loading, total]);

	useEffect(() => {
		if (!canSearch) {
			setResults([]);
			setTotal(0);
			setHasMore(false);
			return;
		}
		requestRef.current?.abort();
		const controller = new AbortController();
		requestRef.current = controller;
		setLoading(true);
		setError(null);
		void searchClient
			.search(
				{ q: submittedQuery, type, sort, maxMinutes, page, limit: 12 },
				controller.signal,
			)
			.then((response) => {
				setResults(response.results);
				setTotal(response.total);
				setHasMore(response.hasMore);
			})
			.catch((requestError: unknown) => {
				if (
					requestError instanceof DOMException &&
					requestError.name === "AbortError"
				)
					return;
				setResults([]);
				setTotal(0);
				setHasMore(false);
				setError(
					requestError instanceof Error
						? requestError.message
						: "Search is unavailable right now.",
				);
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [canSearch, submittedQuery, type, sort, maxMinutes, page]);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmittedQuery(query.trim().replace(/\s+/g, " "));
		setPage(1);
	}

	function updateType(next: SearchType) {
		setType(next);
		setPage(1);
	}

	function chooseSort(next: SearchSort, event: MouseEvent<HTMLButtonElement>) {
		setSort(next);
		setPage(1);
		event.currentTarget.closest("details")?.removeAttribute("open");
	}

	function chooseTime(
		next: number | undefined,
		event: MouseEvent<HTMLButtonElement>,
	) {
		setMaxMinutes(next);
		setPage(1);
		event.currentTarget.closest("details")?.removeAttribute("open");
	}

	const sortLabel = sortOptions.find((option) => option.value === sort)?.label;
	const timeLabel = timeOptions.find(
		(option) => option.value === maxMinutes,
	)?.label;

	return (
		<div className="flex min-h-screen flex-col bg-[#f7faf8] text-slate-900 dark:bg-[#071a16] dark:text-white">
			<Navbar />
			<main className="min-h-[calc(100vh-5rem)] grow px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
				<div className="mx-auto max-w-6xl">
					<header className="max-w-3xl">
						<p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
							CookTale search
						</p>
						<h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
							Find something worth cooking.
						</h1>
						<p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
							Search recipes, kitchen stories, ingredients, cuisines, and chefs.
						</p>
					</header>

					<form
						onSubmit={submit}
						className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-300 bg-white p-2 dark:border-white/15 dark:bg-[#102622]"
					>
						<Search
							className="ml-2 shrink-0 text-slate-500 dark:text-slate-300"
							size={21}
							aria-hidden="true"
						/>
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Try chicken tikka, quick dinner, or a chef name"
							className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-slate-400 dark:placeholder:text-slate-400"
							aria-label="Search CookTale"
						/>
						{query && (
							<button
								type="button"
								onClick={() => {
									setQuery("");
									setSubmittedQuery("");
									setPage(1);
								}}
								className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white"
								aria-label="Clear search"
							>
								<X size={18} aria-hidden="true" />
							</button>
						)}
						<button
							type="submit"
							className="cursor-pointer rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
							disabled={query.trim().length < 2}
						>
							Search
						</button>
					</form>

					<div className="mt-5 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-5 dark:border-white/10">
						<fieldset className="flex flex-wrap gap-2">
							<legend className="sr-only">Search type</legend>
							{typeOptions.map((option) => (
								<button
									key={option.value}
									type="button"
									onClick={() => updateType(option.value)}
									className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors ${type === option.value ? "bg-emerald-700 text-white dark:bg-emerald-400 dark:text-emerald-950" : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-600 dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:border-emerald-300"}`}
								>
									{option.label}
								</button>
							))}
						</fieldset>
						<div className="ml-auto flex flex-wrap items-center gap-2">
							<details className="group relative">
								<summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-600 dark:border-white/15 dark:bg-[#102622] dark:text-slate-100 dark:hover:border-emerald-300 [&::-webkit-details-marker]:hidden">
									Sort: {sortLabel} <ChevronDown size={15} aria-hidden="true" />
								</summary>
								<div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#102622]">
									{sortOptions.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={(event) => chooseSort(option.value, event)}
											className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm ${sort === option.value ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"}`}
										>
											{option.label}
										</button>
									))}
								</div>
							</details>
							{type !== "story" && type !== "chef" && (
								<details className="group relative">
									<summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-emerald-600 dark:border-white/15 dark:bg-[#102622] dark:text-slate-100 dark:hover:border-emerald-300 [&::-webkit-details-marker]:hidden">
										{timeLabel} <ChevronDown size={15} aria-hidden="true" />
									</summary>
									<div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#102622]">
										{timeOptions.map((option) => (
											<button
												key={option.label}
												type="button"
												onClick={(event) => chooseTime(option.value, event)}
												className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm ${maxMinutes === option.value ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"}`}
											>
												{option.label}
											</button>
										))}
									</div>
								</details>
							)}
						</div>
					</div>

					<section className="mt-7" aria-live="polite">
						<div className="mb-4 flex items-center justify-between">
							<p className="text-sm text-slate-600 dark:text-slate-300">
								{resultLabel}
							</p>
							{maxMinutes && type !== "story" && type !== "chef" && (
								<Clock3
									size={17}
									className="text-slate-500"
									aria-label="Time filter active"
								/>
							)}
						</div>
						{error && (
							<p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-200">
								{error}
							</p>
						)}
						{loading && (
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
								{["one", "two", "three", "four", "five", "six"].map((key) => (
									<div
										key={key}
										className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
									/>
								))}
							</div>
						)}
						{!loading && !error && canSearch && results.length > 0 && (
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
								{results.map((result) => (
									<ResultCard
										key={`${result.type}-${result.id}`}
										result={result}
									/>
								))}
							</div>
						)}
						{!loading && !error && canSearch && results.length === 0 && (
							<div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-white/15">
								<Search
									className="mx-auto text-slate-400"
									size={28}
									aria-hidden="true"
								/>
								<p className="mt-4 font-medium">
									No matches found for “{submittedQuery}”.
								</p>
								<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
									Try a dish name, ingredient, cuisine, or chef name.
								</p>
							</div>
						)}
						{!loading && !error && !canSearch && (
							<div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 text-center dark:border-white/15">
								<div>
									<Search
										className="mx-auto text-emerald-700 dark:text-emerald-300"
										size={30}
										aria-hidden="true"
									/>
									<p className="mt-4 font-semibold">
										What are you looking for?
									</p>
									<p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
										Try a dish, ingredient, cuisine, or chef name.
									</p>
								</div>
							</div>
						)}
					</section>

					{!loading && !error && canSearch && (page > 1 || hasMore) && (
						<nav
							className="mt-8 flex items-center justify-center gap-3"
							aria-label="Search result pages"
						>
							<button
								type="button"
								onClick={() => setPage((current) => Math.max(1, current - 1))}
								disabled={page === 1}
								className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:hover:border-emerald-300"
							>
								Previous
							</button>
							<span className="text-sm text-slate-600 dark:text-slate-300">
								Page {page}
							</span>
							<button
								type="button"
								onClick={() => setPage((current) => current + 1)}
								disabled={!hasMore}
								className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:hover:border-emerald-300"
							>
								Next
							</button>
						</nav>
					)}
				</div>
			</main>
			<Footer />
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense
			fallback={<div className="min-h-screen bg-[#f7faf8] dark:bg-[#071a16]" />}
		>
			<SearchPageContent />
		</Suspense>
	);
}
