"use client";

import {
	AlertTriangle,
	BookOpenText,
	ChefHat,
	LogOut,
	ScrollText,
	Settings,
	UserRound,
	X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { FaMoon, FaPenNib, FaSun } from "react-icons/fa";
import { IoCloseOutline, IoMenuOutline } from "react-icons/io5";
import { MdAccountCircle } from "react-icons/md";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/lib/auth/AuthContext";
import imageLoader from "@/lib/loader";
import { setNewRecipePopup } from "@/lib/Slices/NewRecipeSlice";
import { setProfilePopup } from "@/lib/Slices/ProfileMenuPopup";
import { setSettingsPopup } from "@/lib/Slices/SettingsSlice";
import { setSearchTab } from "@/lib/Slices/searchTabSlice";
import type { RootState } from "@/lib/store";
import { setTab } from "../lib/Slices/tabSlice";
import NotificationInbox from "./NotificationInbox";
// Assets
import AuthTab from "./popUps/AuthTab";
import SettingsModal from "./popUps/Settings";
import SearchTab from "./Search";

const Navbar = ({ alwaysVisible = false }: { alwaysVisible?: boolean }) => {
	const pathname = usePathname();
	const dispatch = useDispatch();
	const { status, user } = useAuth();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

	// --- SCROLL LOGIC ---
	const [isVisible, setIsVisible] = useState(true);
	const [lastScrollY, setLastScrollY] = useState(0);

	const toggleTheme = () => {
		const isDark = document.documentElement.classList.contains("dark");
		if (isDark) {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		} else {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		}
	};

	useEffect(() => {
		const handleScroll = () => {
			const currentScrollY = window.scrollY;
			if (currentScrollY < 10) {
				setIsVisible(true);
				setLastScrollY(currentScrollY);
				return;
			}
			setIsVisible(currentScrollY <= lastScrollY);
			setLastScrollY(currentScrollY);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [lastScrollY]);

	// Redux Selectors
	const currentTab = useSelector((state: RootState) => state.tab.currentTab);
	const isNewRecipePopupActive = useSelector(
		(state: RootState) => state.newRecipePopup.isNewRecipePopupActive,
	);
	const isSearchTabActive = useSelector(
		(state: RootState) => state.searchTab.isSearchTabActive,
	);
	const isSettingsPopupActive = useSelector(
		(state: RootState) => state.settings.isSettingsPopupActive,
	);

	const handleCloseModals = useCallback(() => {
		dispatch(setTab("none"));
		dispatch(setSearchTab(false));
		dispatch(setNewRecipePopup(false));
		dispatch(setProfilePopup(false));
		dispatch(setSettingsPopup(false));
		setIsMobileMenuOpen(false);
		setIsCreateMenuOpen(false);
		setIsLogoutConfirmOpen(false);
	}, [dispatch]);

	useEffect(() => {
		const anyModalOpen =
			currentTab !== "none" ||
			isSearchTabActive ||
			isSettingsPopupActive ||
			isNewRecipePopupActive ||
			isCreateMenuOpen ||
			isLogoutConfirmOpen ||
			isMobileMenuOpen;
		document.body.style.overflow = anyModalOpen ? "hidden" : "auto";
		return () => {
			document.body.style.overflow = "auto";
		};
	}, [
		currentTab,
		isSearchTabActive,
		isSettingsPopupActive,
		isNewRecipePopupActive,
		isCreateMenuOpen,
		isLogoutConfirmOpen,
		isMobileMenuOpen,
	]);

	useEffect(() => {
		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleCloseModals();
			if ((e.ctrlKey || e.metaKey) && e.key === "k") {
				e.preventDefault();
				dispatch(setSearchTab(true));
			}
		};
		window.addEventListener("keydown", handleEscapeKey);
		return () => {
			window.removeEventListener("keydown", handleEscapeKey);
		};
	}, [dispatch, handleCloseModals]);

	const isActive = (path: string) => pathname.startsWith(path);

	return (
		<>
			<AuthTab />
			<SearchTab />
			<SettingsModal />
			<CreateChoiceModal
				isOpen={isCreateMenuOpen}
				authStatus={status}
				onClose={() => setIsCreateMenuOpen(false)}
				onAuthAction={(mode) => dispatch(setTab(mode))}
			/>
			<ConfirmLogoutModal
				isOpen={isLogoutConfirmOpen}
				onClose={() => setIsLogoutConfirmOpen(false)}
			/>

			{/* Navbar Container */}
			<div
				className={`fixed top-0 z-40 flex w-screen items-center justify-between border-b px-4 py-3 backdrop-blur-xl transition-all duration-300 ease-in-out sm:px-5 lg:h-16 lg:px-24 lg:py-2 ${alwaysVisible || isVisible ? "translate-y-0" : "-translate-y-full"} border-gray-100 bg-white/80 text-gray-900 dark:border-white/5 dark:bg-[#0d1f1c]/90 dark:text-white`}
			>
				{/* --- LEFT: BRANDING --- */}
				<div className="flex items-center gap-5">
					<Link
						href="/"
						className="font-raleway cursor-pointer text-xl font-bold tracking-tight text-[#006C5E] sm:text-2xl lg:text-3xl dark:text-[#4ADE80]"
					>
						CookTale
					</Link>
				</div>

				{/* --- CENTER: NAVIGATION --- */}
				<div className="hidden items-center justify-center gap-10 text-xs font-bold tracking-wider lg:flex">
					<Link
						href="/recipe"
						className={`transition-colors duration-200 ${isActive("/recipe") ? "text-[#006C5E] dark:text-[#4ADE80]" : "text-gray-500 hover:text-[#006C5E] dark:text-gray-400 dark:hover:text-[#4ADE80]"}`}
					>
						RECIPES
					</Link>
					<Link
						href="/stories"
						className={`transition-colors duration-200 ${isActive("/stories") ? "text-[#006C5E] dark:text-[#4ADE80]" : "text-gray-500 hover:text-[#006C5E] dark:text-gray-400 dark:hover:text-[#4ADE80]"}`}
					>
						STORIES
					</Link>
					<Link
						href="/community"
						className={`transition-colors duration-200 ${isActive("/community") ? "text-[#006C5E] dark:text-[#4ADE80]" : "text-gray-500 hover:text-[#006C5E] dark:text-gray-400 dark:hover:text-[#4ADE80]"}`}
					>
						COMMUNITY
					</Link>
				</div>

				{/* --- RIGHT: ACTIONS --- */}
				<div className="flex items-center gap-1 sm:gap-2 lg:gap-5">
					{/* Search */}
					<button
						type="button"
						onClick={() => dispatch(setSearchTab(true))}
						className="group hidden cursor-pointer items-center gap-3 rounded-full border border-transparent bg-[#f1f7f6] px-4 py-2 transition-all hover:border-[#006C5E]/10 hover:bg-[#e2efec] lg:flex dark:bg-white/5 dark:hover:border-white/10 dark:hover:bg-white/10"
					>
						<CiSearch className="text-xl text-[#006C5E] dark:text-[#4ADE80]" />
						<span className="text-sm text-gray-500 group-hover:text-[#006C5E] dark:text-gray-400 dark:group-hover:text-[#4ADE80]">
							Search
						</span>
					</button>
					<button
						type="button"
						onClick={() => dispatch(setSearchTab(true))}
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-[#006C5E] transition-colors hover:bg-[#f1f7f6] lg:hidden dark:text-[#4ADE80] dark:hover:bg-white/10"
						aria-label="Open search"
					>
						<CiSearch className="text-2xl" />
					</button>

					{/* Create */}
					<button
						type="button"
						onClick={() => setIsCreateMenuOpen(true)}
						className="hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-all hover:border-[#006C5E] hover:text-[#006C5E] lg:flex dark:border-white/10 dark:hover:border-[#4ADE80] dark:hover:text-[#4ADE80]"
						title="Write something new"
						aria-label="Write something new"
					>
						<FaPenNib className="text-sm" />
					</button>

					{/* Theme Toggle */}
					<button
						type="button"
						onClick={toggleTheme}
						className="hidden cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 lg:block dark:text-yellow-400 dark:hover:bg-white/10"
						aria-label="Toggle theme"
					>
						<span className="dark:hidden">
							<FaMoon />
						</span>
						<span className="hidden dark:block">
							<FaSun />
						</span>
					</button>

					<div className="hidden lg:block">
						<NotificationInbox />
					</div>

					{/* Profile */}
					<button
						type="button"
						onClick={() => dispatch(setProfilePopup(true))}
						className="hidden h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent bg-transparent opacity-90 transition-opacity hover:opacity-100 lg:flex dark:border-white/10"
						aria-label="Open profile menu"
					>
						{user?.image ? (
							<Image
								src={user.image}
								alt={user.name || "Profile"}
								width={40}
								height={40}
								loader={imageLoader}
								className="h-full w-full object-cover"
							/>
						) : (
							<MdAccountCircle className="text-4xl text-[#2D2D2D] dark:text-white" />
						)}
					</button>

					{/* Mobile Menu Toggle */}
					<button
						type="button"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-2xl text-[#2D2D2D] transition-colors hover:bg-gray-100 lg:hidden dark:text-white dark:hover:bg-white/10"
						aria-label="Toggle Menu"
					>
						{isMobileMenuOpen ? <IoCloseOutline /> : <IoMenuOutline />}
					</button>

					<ProfilePopup onRequestLogout={() => setIsLogoutConfirmOpen(true)} />
					{isMobileMenuOpen && (
						<SmallWidthMenusPopup
							onClose={() => setIsMobileMenuOpen(false)}
							onToggleTheme={toggleTheme}
							onOpenSettings={() => dispatch(setSettingsPopup(true))}
						/>
					)}
				</div>
			</div>
		</>
	);
};

export default Navbar;

// --- SUB COMPONENTS ---

const ProfilePopup = ({ onRequestLogout }: { onRequestLogout: () => void }) => {
	const router = useRouter();
	const dispatch = useDispatch();
	const { user, status } = useAuth();
	const profilePopupRef = useRef<HTMLDivElement>(null);
	const isProfilePopupActive = useSelector(
		(state: RootState) => state.profilePopup.isProfilePopupActive,
	);

	const profileOptions = useMemo(() => {
		const username = user?.username;

		const opts = [
			{
				title: "My Kitchen",
				icon: ChefHat,
				onclick: () => {
					if (username) {
						router.push(`/profile/${username}`);
					} else {
						router.push("/");
					}
				},
			},
			{
				title: "New Recipe",
				icon: BookOpenText,
				onclick: () => router.push("/new-recipe"),
			},
			{
				title: "New Story",
				icon: ScrollText,
				onclick: () => router.push("/new-story"),
			},
			{
				title: "Settings",
				icon: Settings,
				onclick: () => dispatch(setSettingsPopup(true)),
			},
		];

		return opts;
	}, [router, dispatch, user]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				profilePopupRef.current &&
				!profilePopupRef.current.contains(e.target as Node)
			) {
				dispatch(setProfilePopup(false));
			}
		};
		if (isProfilePopupActive)
			document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isProfilePopupActive, dispatch]);

	if (!isProfilePopupActive) return null;

	return (
		<div
			ref={profilePopupRef}
			className="animate-fade-in-up fixed top-16 right-5 z-50 flex w-64 flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-2 text-sm shadow-2xl lg:right-12 dark:border-white/10 dark:bg-[#152a26]"
		>
			{status === "authenticated" ? (
				<>
					<div className="flex items-center gap-3 px-4 py-3">
						<div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f1f7f6] text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
							{user?.image ? (
								<Image
									src={user.image}
									alt={user.name || "Profile"}
									width={36}
									height={36}
									loader={imageLoader}
									className="h-full w-full object-cover"
								/>
							) : (
								<UserRound className="h-4 w-4" />
							)}
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-bold text-gray-900 dark:text-white">
								{user?.name || "CookTale"}
							</p>
							<p className="truncate text-xs text-gray-400">{user?.email}</p>
						</div>
					</div>
					{profileOptions.map((option) => (
						<button
							type="button"
							key={option.title}
							onClick={() => {
								option.onclick();
								dispatch(setProfilePopup(false));
							}}
							className="group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-[#f1f7f6] hover:text-[#006C5E] dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-[#4ADE80]"
						>
							<option.icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-[#006C5E] dark:group-hover:text-[#4ADE80]" />
							{option.title}
						</button>
					))}
					<div className="mx-4 my-1 h-px bg-gray-100 dark:bg-white/10"></div>
					<button
						type="button"
						onClick={() => {
							dispatch(setProfilePopup(false));
							onRequestLogout();
						}}
						className="group flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2.5 font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
					>
						<LogOut className="h-4 w-4 transition-colors group-hover:text-red-600" />
						Log Out
					</button>
				</>
			) : (
				<div className="flex flex-col gap-2 p-2">
					<div className="py-2 text-center text-sm text-gray-500 dark:text-gray-400">
						Join the kitchen!
					</div>
					<button
						type="button"
						onClick={() => {
							dispatch(setTab("login"));
							dispatch(setProfilePopup(false));
						}}
						className="w-full cursor-pointer rounded-xl border border-gray-200 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
					>
						Log In
					</button>
					<button
						type="button"
						onClick={() => {
							dispatch(setTab("signup"));
							dispatch(setProfilePopup(false));
						}}
						className="w-full cursor-pointer rounded-xl bg-[#006C5E] py-2.5 font-semibold text-white transition-colors hover:bg-[#005a4e]"
					>
						Sign Up
					</button>
				</div>
			)}
		</div>
	);
};

const CreateChoiceModal = ({
	isOpen,
	authStatus,
	onClose,
	onAuthAction,
}: {
	isOpen: boolean;
	authStatus: "loading" | "authenticated" | "unauthenticated";
	onClose: () => void;
	onAuthAction: (mode: "login" | "signup") => void;
}) => {
	const router = useRouter();

	if (!isOpen) return null;

	const goTo = (path: string) => {
		onClose();
		router.push(path);
	};

	const openAuth = (mode: "login" | "signup") => {
		onClose();
		onAuthAction(mode);
	};

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close create chooser"
				className="absolute inset-0 bg-black/20 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-[#152a26]">
				<button
					type="button"
					aria-label="Close"
					onClick={onClose}
					className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
				>
					<X className="h-4 w-4" />
				</button>
				{authStatus === "authenticated" ? (
					<>
						<div className="pr-8">
							<p className="text-xs font-bold uppercase tracking-[0.22em] text-[#006C5E] dark:text-[#4ADE80]">
								Create
							</p>
							<h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
								What are you writing today?
							</h2>
						</div>
						<div className="mt-6 grid gap-3">
							<button
								type="button"
								onClick={() => goTo("/new-recipe")}
								className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-colors hover:border-[#006C5E]/20 hover:bg-[#f1f7f6] dark:border-white/10 dark:hover:bg-white/5"
							>
								<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#006C5E] text-white transition-colors group-hover:bg-[#005a4e]">
									<BookOpenText className="h-5 w-5" />
								</span>
								<span>
									<span className="block font-semibold text-gray-900 transition-colors group-hover:text-[#006C5E] dark:text-white dark:group-hover:text-[#4ADE80]">
										New Recipe
									</span>
									<span className="text-sm text-gray-500">
										Ingredients, steps, timing, and photos.
									</span>
								</span>
							</button>
							<button
								type="button"
								onClick={() => goTo("/new-story")}
								className="group flex cursor-pointer items-center gap-4 rounded-xl border border-gray-100 p-4 text-left transition-colors hover:border-[#006C5E]/20 hover:bg-[#f1f7f6] dark:border-white/10 dark:hover:bg-white/5"
							>
								<span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101827] text-white transition-colors group-hover:bg-[#006C5E] dark:bg-white dark:text-[#101827] dark:group-hover:bg-[#4ADE80]">
									<ScrollText className="h-5 w-5" />
								</span>
								<span>
									<span className="block font-semibold text-gray-900 transition-colors group-hover:text-[#006C5E] dark:text-white dark:group-hover:text-[#4ADE80]">
										New Story
									</span>
									<span className="text-sm text-gray-500">
										Write a food memory, guide, or kitchen note.
									</span>
								</span>
							</button>
						</div>
					</>
				) : (
					<div className="text-center">
						<div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f1f7f6] text-[#006C5E] dark:bg-white/10 dark:text-[#4ADE80]">
							<FaPenNib className="text-base" />
						</div>
						<h2 className="mx-auto mt-4 max-w-[15rem] text-lg font-semibold leading-snug text-gray-900 dark:text-white">
							Ready to share something delicious?
						</h2>
						<p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500 dark:text-gray-400">
							Create an account to publish recipes, write stories, and keep your
							kitchen organized.
						</p>
						<div className="mt-5 grid gap-3">
							<button
								type="button"
								onClick={() => openAuth("signup")}
								className="cursor-pointer rounded-xl bg-[#006C5E] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e]"
							>
								Sign Up
							</button>
							<button
								type="button"
								onClick={() => openAuth("login")}
								className="cursor-pointer rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
							>
								Log In
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

const ConfirmLogoutModal = ({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) => {
	const { logout } = useAuth();

	if (!isOpen) return null;

	const handleLogout = async () => {
		await logout();
		onClose();
	};

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center p-4">
			<button
				type="button"
				aria-label="Close logout confirmation"
				className="absolute inset-0 bg-black/20 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-xl dark:border-white/10 dark:bg-[#152a26]">
				<button
					type="button"
					aria-label="Close"
					onClick={onClose}
					className="absolute top-4 right-4 cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
				>
					<X className="h-4 w-4" />
				</button>
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
					<AlertTriangle className="h-5 w-5" />
				</div>
				<h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
					Log out of CookTale?
				</h2>
				<p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
					You will need to sign in again to write, save, or manage your kitchen.
				</p>
				<div className="mt-6 grid grid-cols-2 gap-3">
					<button
						type="button"
						onClick={onClose}
						className="cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => void handleLogout()}
						className="cursor-pointer rounded-xl bg-[#9F1D1D] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7F1D1D]"
					>
						Log Out
					</button>
				</div>
			</div>
		</div>
	);
};

const SmallWidthMenusPopup = ({
	onClose,
	onToggleTheme,
	onOpenSettings,
}: {
	onClose: () => void;
	onToggleTheme: () => void;
	onOpenSettings: () => void;
}) => {
	const { status, user } = useAuth();

	return (
		<div className="absolute top-[4.5rem] right-3 left-3 z-50 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl lg:hidden dark:border-white/10 dark:bg-[#152a26]">
			<nav className="grid gap-1" aria-label="Mobile navigation">
				<Link
					href="/recipe"
					onClick={onClose}
					className="cursor-pointer rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-[#f1f7f6] dark:text-gray-200 dark:hover:bg-white/5"
				>
					Recipes
				</Link>
				<Link
					href="/stories"
					onClick={onClose}
					className="cursor-pointer rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-[#f1f7f6] dark:text-gray-200 dark:hover:bg-white/5"
				>
					Stories
				</Link>
				<Link
					href="/community"
					onClick={onClose}
					className="cursor-pointer rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-[#f1f7f6] dark:text-gray-200 dark:hover:bg-white/5"
				>
					Community
				</Link>
			</nav>

			<div className="my-3 h-px bg-gray-100 dark:bg-white/10" />
			<div className="grid gap-1">
				{status === "authenticated" && user?.username && (
					<>
						<Link
							href={`/profile/${user.username}`}
							onClick={onClose}
							className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
						>
							My kitchen
						</Link>
						<Link
							href="/notifications"
							onClick={onClose}
							className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
						>
							Notifications
						</Link>
						<button
							type="button"
							onClick={() => {
								onOpenSettings();
								onClose();
							}}
							className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
						>
							Settings
						</button>
					</>
				)}
				<button
					type="button"
					onClick={() => {
						onToggleTheme();
						onClose();
					}}
					className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
				>
					Theme
				</button>
			</div>
		</div>
	);
};
