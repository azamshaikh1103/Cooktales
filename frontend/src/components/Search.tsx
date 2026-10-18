"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BsArrowReturnLeft } from "react-icons/bs";
import { CiFaceFrown, CiSearch } from "react-icons/ci";
import { PiBookOpenText, PiCookingPot } from "react-icons/pi";
import { useDispatch, useSelector } from "react-redux";
import { type SearchResult, searchClient } from "@/lib/api/searchClient";
import imageLoader from "@/lib/loader";
import { setSearchTab } from "@/lib/Slices/searchTabSlice";
import type { RootState } from "@/lib/store";

const SearchTab = () => {
	const dispatch = useDispatch();
	const router = useRouter();
	const isSearchTabActive = useSelector(
		(state: RootState) => state.searchTab.isSearchTabActive,
	);

	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);

	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);
	const suggestionRequest = useRef<AbortController | null>(null);

	// --- EFFECT 1: HANDLE OPEN/CLOSE & RESET ---
	// Only runs when isSearchTabActive changes
	useEffect(() => {
		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
			suggestionRequest.current?.abort();
		};
	}, []);

	useEffect(() => {
		if (isSearchTabActive) {
			// Open: Focus input
			setTimeout(() => inputRef.current?.focus(), 50);
		} else {
			// Close: Reset everything
			setSearchQuery("");
			setResults([]);
			setSelectedIndex(-1);
			setIsLoading(false);
		}
	}, [isSearchTabActive]);

	// --- NAVIGATION HANDLERS (Defined before Effect 2) ---
	const handleResultClick = useCallback(
		(result: SearchResult) => {
			if (result.type === "recipe") {
				router.push(result.slug ? `/recipe/${result.slug}` : "/recipe");
			} else if (result.type === "story") {
				router.push(`/stories/${result.slug || result.id}`);
			} else {
				router.push(`/profile/${result.slug || result.id}`);
			}
			dispatch(setSearchTab(false));
		},
		[router, dispatch],
	);

	const handleFullSearch = useCallback(() => {
		if (!searchQuery.trim()) return;
		dispatch(setSearchTab(false));
		router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
	}, [searchQuery, router, dispatch]);

	// --- EFFECT 2: KEYBOARD EVENTS ---
	// Runs when dependencies change to keep state fresh in event listener
	useEffect(() => {
		if (!isSearchTabActive) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((prev) =>
					prev < results.length - 1 ? prev + 1 : prev,
				);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (selectedIndex >= 0 && results[selectedIndex]) {
					handleResultClick(results[selectedIndex]);
				} else {
					handleFullSearch();
				}
			} else if (e.key === "Escape") {
				dispatch(setSearchTab(false));
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isSearchTabActive,
		results,
		selectedIndex,
		handleResultClick,
		handleFullSearch,
		dispatch,
	]);

	// --- SEARCH LOGIC ---
	const handleSearch = useCallback((query: string) => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		suggestionRequest.current?.abort();

		if (!query.trim()) {
			setResults([]);
			setSelectedIndex(-1);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		debounceTimer.current = setTimeout(async () => {
			const controller = new AbortController();
			suggestionRequest.current = controller;
			try {
				const response = await searchClient.suggestions(
					{
						q: query,
						type: "all",
						limit: 8,
					},
					controller.signal,
				);
				setResults(response.suggestions);
				setSelectedIndex(-1);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}
				console.error("Search error:", error);
				setResults([]);
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		}, 400);
	}, []);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
		handleSearch(e.target.value);
	};

	return (
		<AnimatePresence>
			{isSearchTabActive && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					onClick={() => dispatch(setSearchTab(false))}
					className="fixed inset-0 z-100 flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-md dark:bg-black/80"
				>
					<motion.div
						initial={{ scale: 0.95, y: -20 }}
						animate={{ scale: 1, y: 0 }}
						exit={{ scale: 0.95, y: -20 }}
						onClick={(e) => e.stopPropagation()}
						className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-colors dark:border-white/10 dark:bg-[#152a26]"
					>
						{/* INPUT */}
						<div className="flex items-center gap-4 border-b border-gray-100 p-4 dark:border-white/5">
							<CiSearch className="text-2xl text-gray-500 dark:text-gray-500" />
							<input
								ref={inputRef}
								onChange={handleSearchChange}
								value={searchQuery}
								placeholder="Search recipes, stories, or chefs..."
								className="h-12 flex-1 bg-transparent text-xl font-bold text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-600"
							/>
							<div className="hidden items-center gap-2 md:flex">
								<kbd className="hidden rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-500 sm:inline-block dark:border-white/5 dark:bg-white/10 dark:text-gray-500">
									ESC
								</kbd>
							</div>
						</div>

						{/* RESULTS LIST */}
						<div
							ref={listRef}
							className="custom-scrollbar max-h-[60vh] min-h-[100px] flex-1 overflow-y-auto p-2"
						>
							{isLoading && (
								<div className="flex animate-pulse flex-col items-center py-10 text-center text-gray-500 dark:text-gray-600">
									<div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-[#006C5E] border-t-transparent dark:border-[#4ADE80]"></div>
									<span className="text-xs font-bold tracking-widest uppercase">
										Searching...
									</span>
								</div>
							)}

							{!isLoading && searchQuery && results.length === 0 && (
								<div className="py-12 text-center text-gray-500 dark:text-gray-500">
									<CiFaceFrown className="mx-auto mb-2 text-4xl opacity-50" />
									<p className="font-medium">No results found.</p>
									<button
										type="button"
										onClick={handleFullSearch}
										className="mt-4 text-sm text-[#006C5E] hover:underline dark:text-[#4ADE80]"
									>
										View all results
									</button>
								</div>
							)}

							{!isLoading && results.length > 0 && (
								<div className="space-y-1">
									<div className="px-3 py-2 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
										Top Results
									</div>
									{results.map((result, index) => (
										<SearchResultItem
											key={`${result.type}-${result.id}`}
											result={result}
											active={index === selectedIndex}
											onClick={() => handleResultClick(result)}
										/>
									))}
								</div>
							)}
						</div>

						{/* FOOTER */}
						<div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500 dark:border-white/5 dark:bg-black/20 dark:text-gray-500">
							<div className="flex gap-4">
								<span className="flex items-center gap-1">
									<BsArrowReturnLeft className="text-[10px]" />
									<span className="hidden sm:inline">to select</span>
								</span>
								<span className="flex items-center gap-1">
									<span className="text-[10px]">↑↓</span>{" "}
									<span className="hidden sm:inline">to navigate</span>
								</span>
							</div>
							<div>
								Press{" "}
								<span className="font-bold text-gray-600 dark:text-gray-300">
									Enter
								</span>{" "}
								to see all
							</div>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default SearchTab;

// --- SUB COMPONENT ---

interface SearchResultItemProps {
	result: SearchResult;
	active: boolean;
	onClick: () => void;
}

const SearchResultItem = ({
	result,
	active,
	onClick,
}: SearchResultItemProps) => {
	const ref = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (active) {
			ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
	}, [active]);

	return (
		<button
			type="button"
			ref={ref}
			onClick={onClick}
			className={`flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-all duration-200 ${
				active
					? "border-[#006C5E] bg-[#006C5E]/10 dark:border-[#4ADE80] dark:bg-[#4ADE80]/10"
					: "border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
			}`}
		>
			{/* Image / Icon */}
			<div
				className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
					result.image
						? ""
						: active
							? "bg-[#006C5E] text-white"
							: "bg-gray-100 text-gray-500 dark:bg-white/10"
				}`}
			>
				{result.image ? (
					<Image
						src={result.image}
						alt=""
						width={40}
						height={40}
						className="h-full w-full object-cover"
						loader={imageLoader}
					/>
				) : result.type === "recipe" ? (
					<PiCookingPot />
				) : result.type === "story" ? (
					<PiBookOpenText />
				) : (
					<span className="text-sm font-semibold">@</span>
				)}
			</div>

			{/* Text */}
			<div className="min-w-0 flex-1">
				<h4
					className={`truncate font-bold transition-colors ${
						active
							? "text-[#006C5E] dark:text-[#4ADE80]"
							: "text-gray-900 dark:text-white"
					}`}
				>
					{result.title}
				</h4>
				<p className="truncate text-xs text-gray-500 dark:text-gray-500">
					{result.type === "recipe"
						? `Recipe${result.authorName ? ` • by ${result.authorName}` : ""}`
						: result.type === "story"
							? `Story${result.authorName ? ` • by ${result.authorName}` : ""}`
							: `Chef${result.authorUsername ? ` • @${result.authorUsername}` : ""}`}
				</p>
			</div>

			{/* Meta */}
			{(result.totalTime || result.type === "story") && (
				<span
					className={`text-xs font-medium ${
						active ? "text-[#006C5E] dark:text-[#4ADE80]" : "text-gray-500"
					}`}
				>
					{result.totalTime ? `${result.totalTime} min` : "Story"}
				</span>
			)}

			{/* Active Indicator */}
			{active && (
				<BsArrowReturnLeft className="mr-2 animate-pulse text-sm text-[#006C5E] dark:text-[#4ADE80]" />
			)}
		</button>
	);
};
