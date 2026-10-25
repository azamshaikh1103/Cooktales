"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import {
	FaClock,
	FaStar,
	FaCheck,
	FaShare,
	FaArrowLeft,
	FaTimes,
	FaChevronLeft,
	FaChevronRight,
	FaHashtag,
	FaFire,
	FaSearchPlus,
	FaShoppingCart,
	FaExternalLinkAlt,
	FaUser,
} from "react-icons/fa";
import imageLoader from "@/lib/loader";
import { toast } from "sonner";
import AdUnit from "@/components/AdUnit";
import { useDispatch } from "react-redux";
import { setProfilePopup } from "@/lib/Slices/ProfileMenuPopup";
import { setTab } from "@/lib/Slices/tabSlice";
import ReviewModal from "@/components/popUps/ReviewModal";
import ReviewItem from "./ReviewItem";
import RecipeComments from "./RecipeComments";
import ShareModal from "@/components/popUps/ShareModal";
import {
	recipeClient,
	type PublicRecipe,
	type RecipeReview,
} from "@/lib/api/recipeClient";
import { useAuth } from "@/lib/auth/AuthContext";

export const RecipeDetailClient = ({
	recipe,
	isPremium = false,
}: {
	recipe: PublicRecipe;
	isPremium?: boolean;
}) => {
	const { status, user } = useAuth();
	const [isLiked, setIsLiked] = useState(false);
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [likesCount, setLikesCount] = useState(recipe.likes || 0);
	const [reviews, setReviews] = useState<RecipeReview[]>(recipe.reviews || []);
	const [reviewPage, setReviewPage] = useState(1);
	const [reviewTotal, setReviewTotal] = useState(
		recipe._count?.reviews || recipe.reviews.length,
	);
	const [loadingReviews, setLoadingReviews] = useState(false);
	const [showReviewModal, setShowReviewModal] = useState(false);
	const [reviewSort, setReviewSort] = useState<
		"newest" | "highest" | "lowest" | "helpful"
	>("newest");
	const [myReview, setMyReview] = useState<Pick<
		RecipeReview,
		"id" | "stars" | "text" | "createdAt" | "editedAt"
	> | null>(null);
	const router = useRouter();
	const [isLightboxOpen, setIsLightboxOpen] = useState(false);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [isShareOpen, setIsShareOpen] = useState(false);
	const stepImages = recipe.steps
		.map((s) => s.image)
		.filter((img): img is string => !!img);

	const allImages = [
		recipe.mainImage,
		...(recipe.moreImages || []),
		...stepImages,
	];
	const hasCountedView = useRef(false);

	useEffect(() => {
		if (status !== "authenticated") {
			setIsLiked(false);
			setIsBookmarked(false);
			setMyReview(null);
			return;
		}
		void recipeClient
			.viewerState(recipe.id)
			.then((state) => {
				setIsLiked(state.liked);
				setIsBookmarked(state.bookmarked);
				setLikesCount(state.likes);
				setMyReview(state.myReview);
			})
			.catch(() => {
				// A stale session should not stop the public recipe from rendering.
			});
	}, [recipe.id, status]);

	useEffect(() => {
		setReviews(recipe.reviews || []);
		setReviewPage(1);
		setReviewTotal(recipe._count?.reviews || recipe.reviews.length);
	}, [recipe.reviews, recipe._count?.reviews]);

	const refreshReviews = async (sort = reviewSort) => {
		const result = await recipeClient.listReviews(recipe.slug, 1, 10, sort);
		setReviews(result.reviews);
		setReviewPage(1);
		setReviewTotal(result.total);
	};

	const loadMoreReviews = async () => {
		setLoadingReviews(true);
		try {
			const nextPage = reviewPage + 1;
			const result = await recipeClient.listReviews(
				recipe.slug,
				nextPage,
				10,
				reviewSort,
			);
			setReviews((current) => [...current, ...result.reviews]);
			setReviewPage(nextPage);
			setReviewTotal(result.total);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Could not load reviews",
			);
		} finally {
			setLoadingReviews(false);
		}
	};

	useEffect(() => {
		const navEntry = window.performance.getEntriesByType(
			"navigation",
		)[0] as PerformanceNavigationTiming;
		if (navEntry && navEntry.type === "reload") {
			return;
		}

		const STORAGE_KEY = `cooktale-view-${recipe.id}`;
		const lastViewTime = localStorage.getItem(STORAGE_KEY);
		const COOLDOWN_TIME = 30 * 60 * 1000;

		if (lastViewTime && Date.now() - parseInt(lastViewTime) < COOLDOWN_TIME) {
			return;
		}

		let timer: NodeJS.Timeout;

		const handleScroll = () => {
			if (hasCountedView.current) return;

			const scrollPercentage =
				(window.scrollY + window.innerHeight) / document.body.scrollHeight;

			if (scrollPercentage > 0.4) {
				if (!timer) {
					timer = setTimeout(async () => {
						if (hasCountedView.current) return;
						try {
							await recipeClient.recordView(recipe.id);
							hasCountedView.current = true;
							localStorage.setItem(STORAGE_KEY, Date.now().toString());
						} catch {
							// View tracking must never interrupt reading the recipe.
						}
					}, 10000);
				}
			}
		};

		window.addEventListener("scroll", handleScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
			clearTimeout(timer);
		};
	}, [recipe.id]);

	const openLightbox = (index: number) => {
		setCurrentImageIndex(index);
		setIsLightboxOpen(true);
	};

	const handleImageClick = (imgSrc: string) => {
		const index = allImages.indexOf(imgSrc);
		if (index !== -1) openLightbox(index);
	};

	useEffect(() => {
		window.scrollTo(0, 0);
	}, []);

	const handleLike = async () => {
		if (status !== "authenticated") {
			router.push("/auth");
			return;
		}
		setIsLiked(!isLiked);
		setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
		try {
			const state = isLiked
				? await recipeClient.unlike(recipe.id)
				: await recipeClient.like(recipe.id);
			setIsLiked(state.liked);
			setLikesCount(state.likes);
		} catch (error) {
			setIsLiked(!isLiked);
			setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
			toast.error(
				error instanceof Error ? error.message : "Could not update like",
			);
		}
	};

	const handleBookmark = async () => {
		if (status !== "authenticated") {
			router.push("/auth");
			return;
		}
		setIsBookmarked(!isBookmarked);
		try {
			const state = isBookmarked
				? await recipeClient.unbookmark(recipe.id)
				: await recipeClient.bookmark(recipe.id);
			setIsBookmarked(state.bookmarked);
			toast.success(
				state.bookmarked ? "Saved to library" : "Removed from library",
			);
		} catch (error) {
			setIsBookmarked(!isBookmarked);
			toast.error(
				error instanceof Error ? error.message : "Could not update bookmark",
			);
		}
	};

	const dispatch = useDispatch();

	const handleWriteReview = () => {
		if (status !== "authenticated") {
			dispatch(setProfilePopup(false));
			dispatch(setTab("login"));
			router.push("/auth");
			return;
		}
		if (user?.id === recipe.author.id) {
			toast.error("You cannot rate or review your own recipe");
			return;
		}
		setShowReviewModal(true);
	};

	const handleRequireAuthForComment = () => {
		dispatch(setProfilePopup(false));
		dispatch(setTab("login"));
	};

	const handleReviewSortChange = (
		sort: "newest" | "highest" | "lowest" | "helpful",
	) => {
		setReviewSort(sort);
		void refreshReviews(sort).catch((error) => {
			toast.error(
				error instanceof Error ? error.message : "Could not sort reviews",
			);
		});
	};

	const handleReviewDeleted = async () => {
		setMyReview(null);
		await refreshReviews();
		router.refresh();
	};

	const handleReviewSubmitted = async () => {
		await refreshReviews();
		const state = await recipeClient.viewerState(recipe.id);
		setMyReview(state.myReview);
		router.refresh();
	};

	return (
		<div className="min-h-screen bg-[#fafafa] pb-20 transition-colors duration-500 dark:bg-[#0d1f1c]">
			<div className="relative h-[40vh] w-full lg:h-[60vh]">
				<div className="absolute inset-0 z-10 bg-black/30" />
				<Image
					src={recipe.mainImage}
					alt={recipe.name}
					fill
					loader={imageLoader}
					className="object-cover"
					priority
				/>
				<div className="absolute top-24 left-0 z-20 flex w-full items-center justify-between px-6 text-white lg:px-24">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-md transition-all hover:bg-white/30"
					>
						<FaArrowLeft /> <span className="hidden lg:inline">Back</span>
					</button>
					<div className="flex gap-3">
						<button
							onClick={() => setIsShareOpen(true)}
							aria-label="Share recipe"
							type="button"
							className="rounded-full bg-white/20 p-3 backdrop-blur-md transition-all hover:bg-white/30"
						>
							<FaShare />
						</button>
						<button
							onClick={handleBookmark}
							aria-label="Bookmark recipe"
							type="button"
							className="rounded-full bg-white/20 p-3 backdrop-blur-md transition-all hover:bg-white/30"
						>
							{isBookmarked ? (
								<BsBookmarkFill aria-label="Bookmarked" />
							) : (
								<BsBookmark aria-label="Bookmark" />
							)}
						</button>
						<button
							onClick={handleLike}
							aria-label="Like recipe"
							type="button"
							className="flex items-center gap-2 rounded-full bg-white p-3 text-red-500 shadow-lg transition-transform hover:scale-110"
						>
							{isLiked ? (
								<AiFillHeart aria-label="Liked" />
							) : (
								<AiOutlineHeart aria-label="Like" />
							)}
							<span className="text-xs font-bold">{likesCount}</span>
						</button>
					</div>
				</div>
			</div>

			<div className="relative z-30 mx-2 -mt-20 min-h-[500px] rounded-[2.5rem] bg-white shadow-xl transition-colors duration-500 lg:mx-24 dark:border dark:border-white/5 dark:bg-[#152a26] dark:shadow-none">
				<div className="border-b border-gray-100 px-4 py-5 lg:px-16 lg:py-14 dark:border-white/5">
					<div className="mb-6 flex flex-wrap gap-2">
						{recipe.diet && (
							<span className="rounded-full bg-[#006C5E]/10 px-3 py-1 text-xs font-bold tracking-wider text-[#006C5E] uppercase dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]">
								{recipe.diet}
							</span>
						)}
						{recipe.cuisine && recipe.cuisine !== "NA" && (
							<span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold tracking-wider text-orange-600 uppercase dark:bg-orange-500/10 dark:text-orange-400">
								{recipe.cuisine}
							</span>
						)}
						{recipe.recipeCategory && (
							<span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold tracking-wider text-purple-600 uppercase dark:bg-purple-500/10 dark:text-purple-400">
								{recipe.recipeCategory}
							</span>
						)}
						{recipe.difficulty && (
							<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold tracking-wider text-blue-600 uppercase dark:bg-blue-500/10 dark:text-blue-400">
								{recipe.difficulty}
							</span>
						)}
						{recipe.calories && (
							<span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold tracking-wider text-red-600 uppercase dark:bg-red-500/10 dark:text-red-400">
								{recipe.calories} cal
							</span>
						)}
					</div>

					<h1 className="mb-6 text-2xl leading-tight font-black text-gray-900 lg:text-5xl dark:text-white">
						{recipe.name}
					</h1>

					<div className="flex flex-col gap-8 font-medium text-gray-500 lg:flex-row lg:items-center dark:text-gray-500">
						<div className="flex items-center gap-3">
							<div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
								{recipe.author?.image && (
									<Image
										src={recipe.author.image}
										fill
										alt=""
										loader={imageLoader}
										className="object-cover"
									/>
								)}
							</div>
							<span className="font-bold text-gray-900 dark:text-white">
								{recipe.author?.name}
							</span>
						</div>
						<div className="hidden h-6 w-px bg-gray-200 lg:block dark:bg-white/10" />

						<button
							onClick={handleWriteReview}
							className="flex items-center gap-2 transition-transform hover:scale-105"
						>
							<FaStar className="text-lg text-yellow-400" />
							<span className="font-bold text-gray-900 dark:text-white">
								{recipe.ratings?.toFixed(1) || "New"}
							</span>
							<span className="text-sm">
								({recipe.ratingCount || 0} reviews)
							</span>
						</button>

						<div className="hidden h-6 w-px bg-gray-200 lg:block dark:bg-white/10" />
						<div className="flex items-center gap-2">
							<FaClock /> {recipe.totalTimeReq} mins
						</div>
					</div>

					{recipe.about && (
						<p className="mt-8 max-w-4xl text-sm leading-relaxed text-gray-600 lg:text-lg dark:text-gray-300">
							{recipe.about}
						</p>
					)}

					<button
						type="button"
						onClick={() => router.push(`/cook/${recipe.slug}`)}
						className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#006C5E] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
					>
						<FaFire /> Start cooking
					</button>

					<AdUnit type="banner" isPremium={isPremium} slot="1268984670" />

					{recipe.tags && recipe.tags.length > 0 && (
						<div className="mt-4 flex flex-wrap items-center gap-2">
							<FaHashtag className="text-[#006C5E] dark:text-[#4ADE80]" />
							{recipe.tags.map((tag, idx) => (
								<button
									key={idx}
									onClick={() => router.push(`/recipe?tag=${tag}`)}
									className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 transition-colors hover:bg-[#006C5E] hover:text-white dark:bg-white/5 dark:text-gray-300 dark:hover:bg-[#4ADE80] dark:hover:text-black"
								>
									{tag}
								</button>
							))}
						</div>
					)}
				</div>

				<div className="flex flex-col lg:flex-row-reverse">
					<div className="flex w-full flex-col gap-8 rounded-br-[2.5rem] bg-[#f8f9fa] lg:w-1/3 dark:bg-[#112220]">
						{/* 1. Ingredients Card (Scrolls naturally) */}
						<div className="border border-gray-100 bg-[#f8f9fa] p-4 lg:p-8 dark:border-white/5 dark:bg-[#112220]">
							<h3 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
								Ingredients
								<span className="rounded-full bg-gray-200 px-2 py-0.5 font-sans text-sm text-gray-600 dark:bg-white/10 dark:text-gray-300">
									{recipe.ingredients.length}
								</span>
							</h3>

							<div className="mb-6 flex items-center justify-between rounded-xl bg-white p-3 text-sm font-bold text-gray-500 shadow-sm dark:bg-white/5 dark:text-gray-400">
								<span>Yields: {recipe.yield || 4} servings</span>
							</div>

							<ul className="space-y-4">
								{recipe.ingredients.map((ing) => (
									<ListItem key={ing.id} item={ing} />
								))}
							</ul>
						</div>

						{/* AD PLACEMENT 2: Mid-Sidebar (Scrolls away) */}
						<AdUnit type="box" isPremium={isPremium} slot="5838785076" />

						{/* 2. Tools Card (Scrolls naturally) */}
						{recipe.equipments.length > 0 && (
							<div className="border border-gray-100 bg-[#f8f9fa] p-4 lg:p-8 dark:border-white/5 dark:bg-[#112220]">
								<h3 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
									Tools Needed
									<span className="rounded-full bg-gray-200 px-2 py-0.5 font-sans text-sm text-gray-600 dark:bg-white/10 dark:text-gray-300">
										{recipe.equipments.length}
									</span>
								</h3>
								<ul className="space-y-4">
									{recipe.equipments.map((eq) => (
										<ListItem key={eq.id} item={eq} />
									))}
								</ul>
							</div>
						)}

						{/* AD PLACEMENT 3 */}
						<div className="z-10 hidden pt-6 lg:sticky lg:top-24 lg:block">
							<AdUnit type="box" isPremium={isPremium} slot="1234567890" />
						</div>
					</div>

					<div className="rounded-[2.5rem] bg-white p-4 lg:w-2/3 lg:p-16 dark:bg-[#152a26]">
						<h3 className="mb-10 text-3xl font-bold text-gray-900 dark:text-white">
							Instructions
						</h3>
						<div className="space-y-12">
							{recipe.steps.map((step, idx) => (
								<InstructionStep
									key={step.id}
									index={idx + 1}
									step={step}
									onImageClick={handleImageClick}
								/>
							))}
						</div>

						<AdUnit type="banner" isPremium={isPremium} slot="2390494657" />

						{recipe.tipsAndTricks && (
							<div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50 p-4 lg:p-8 dark:border-amber-500/20 dark:bg-amber-900/10">
								<h4 className="mb-4 flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
									💡 Chef's Tips
								</h4>
								<p className="leading-relaxed whitespace-pre-line text-amber-900/80 dark:text-amber-200/80">
									{recipe.tipsAndTricks}
								</p>
							</div>
						)}

						{recipe.storingFreezing && (
							<div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 lg:p-8 dark:border-blue-500/20 dark:bg-blue-900/10">
								<h4 className="mb-4 flex items-center gap-2 font-bold text-blue-800 dark:text-blue-400">
									🧊 Storing
								</h4>
								<p className="leading-relaxed whitespace-pre-line text-blue-900/80 dark:text-blue-200/80">
									{recipe.storingFreezing}
								</p>
							</div>
						)}

						{recipe.faqs && recipe.faqs.length > 0 && (
							<div className="mt-16 border-t border-gray-100 pt-10 dark:border-white/5">
								<h4 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
									FAQ
								</h4>
								<div className="space-y-4">
									{recipe.faqs.map((faq) => (
										<div
											key={faq.id}
											className="rounded-2xl bg-gray-50 p-4 lg:p-8 dark:bg-white/5"
										>
											<p className="mb-2 font-bold text-gray-900 dark:text-white">
												{faq.question}
											</p>
											<p className="text-gray-600 dark:text-gray-500">
												{faq.answer}
											</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* AD PLACEMENT: FOOTER BANNER */}
						<AdUnit type="banner" isPremium={isPremium} slot="1234567890" />

						{/* REVIEWS SECTION */}
						<div className="mt-16 border-t border-gray-100 pt-10 dark:border-white/5">
							<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<h4 className="text-3xl font-black text-gray-900 dark:text-white">
										Reviews
									</h4>
									<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
										{reviewTotal}
									</span>
								</div>

								<div className="flex items-center gap-3">
									<label className="sr-only" htmlFor="review-sort">
										Sort reviews
									</label>
									<select
										id="review-sort"
										value={reviewSort}
										onChange={(event) =>
											handleReviewSortChange(
												event.target.value as typeof reviewSort,
											)
										}
										className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#006C5E] dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:focus:border-[#4ADE80]"
									>
										<option value="newest">Newest</option>
										<option value="helpful">Most helpful</option>
										<option value="highest">Highest rated</option>
										<option value="lowest">Lowest rated</option>
									</select>
									<button
										onClick={handleWriteReview}
										className="cursor-pointer rounded-lg bg-[#006C5E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e] dark:bg-[#4ADE80] dark:text-[#0d1f1c] dark:hover:bg-[#3ccb74]"
									>
										{myReview ? "Edit your review" : "Write a review"}
									</button>
								</div>
							</div>
							<div className="space-y-8">
								{reviews.map((review) => (
									<ReviewItem
										key={review.id}
										review={review}
										recipeId={recipe.id}
										isRecipeAuthor={user?.id === recipe.author.id}
										isOwnReview={user?.id === review.user.id}
										onEdit={() => setShowReviewModal(true)}
										onDeleted={handleReviewDeleted}
									/>
								))}
								{reviews.length < reviewTotal && (
									<button
										type="button"
										onClick={loadMoreReviews}
										disabled={loadingReviews}
										className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-gray-200"
									>
										{loadingReviews ? "Loading..." : "Load more reviews"}
									</button>
								)}
							</div>
						</div>

						<RecipeComments
							recipeId={recipe.id}
							slug={recipe.slug}
							userId={user?.id}
							isAuthenticated={status === "authenticated"}
							onRequireAuth={handleRequireAuthForComment}
						/>

						{/* --- MOUNT THE MODAL --- */}
						<ReviewModal
							isOpen={showReviewModal}
							onClose={() => setShowReviewModal(false)}
							recipeId={recipe.id}
							recipeName={recipe.name}
							existingReview={myReview}
							onSubmitted={handleReviewSubmitted}
						/>
					</div>
				</div>
			</div>

			{recipe.author && (
				<div className="mx-auto mt-12 max-w-4xl px-6">
					<div className="flex flex-col items-center gap-8 rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm md:flex-row md:text-left dark:border-white/5 dark:bg-[#152a26]">
						<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#006C5E]/10 dark:border-[#4ADE80]/10">
							{recipe.author.image && (
								<Image
									src={recipe.author.image}
									fill
									alt=""
									loader={imageLoader}
									className="object-cover"
								/>
							)}
						</div>
						<div className="flex-1">
							<div className="mb-1 text-xs font-bold tracking-wider text-[#006C5E] uppercase dark:text-[#4ADE80]">
								Recipe By
							</div>
							<h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
								{recipe.author.name}
							</h3>
							<p className="mx-auto max-w-lg text-sm text-gray-500 md:mx-0 dark:text-gray-500">
								{recipe.author.about ||
									"Passionate about sharing delicious recipes with the world."}
							</p>
						</div>
						<button
							onClick={() => router.push(`/profile/${recipe.author.username}`)}
							className="cursor-pointer rounded-full bg-black px-8 py-3 font-bold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
						>
							View Profile
						</button>
					</div>
				</div>
			)}

			{isLightboxOpen && (
				<div className="animate-fade-in fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
					<button
						aria-label="Close lightbox"
						type="button"
						onClick={() => setIsLightboxOpen(false)}
						className="absolute top-6 right-6 cursor-pointer rounded-full bg-white/10 p-3 text-white/70 transition-all hover:text-white"
					>
						<FaTimes size={24} />
					</button>
					<div className="relative flex h-[80vh] w-full max-w-5xl items-center justify-center px-4">
						<Image
							src={allImages[currentImageIndex]}
							alt=""
							fill
							loader={imageLoader}
							className="object-contain"
							priority
						/>
					</div>
					<button
						aria-label="Previous image"
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setCurrentImageIndex((prev) =>
								prev === 0 ? allImages.length - 1 : prev - 1,
							);
						}}
						className="absolute left-4 cursor-pointer rounded-full bg-white/10 p-4 text-white/70 transition-all hover:bg-white/20 hover:text-white md:left-10"
					>
						<FaChevronLeft size={24} />
					</button>
					<button
						aria-label="Next image"
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setCurrentImageIndex((prev) =>
								prev === allImages.length - 1 ? 0 : prev + 1,
							);
						}}
						className="absolute right-4 cursor-pointer rounded-full bg-white/10 p-4 text-white/70 transition-all hover:bg-white/20 hover:text-white md:right-10"
					>
						<FaChevronRight size={24} />
					</button>
				</div>
			)}
			<ShareModal
				isOpen={isShareOpen}
				onClose={() => setIsShareOpen(false)}
				url={typeof window !== "undefined" ? window.location.href : ""}
				title={recipe.name}
			/>
		</div>
	);
};

const ListItem = ({ item }: { item: any }) => {
	const [checked, setChecked] = useState(false);

	return (
		<li
			onClick={() => setChecked(!checked)}
			className={`group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200 ${
				checked
					? "bg-[#006C5E]/5 dark:bg-[#4ADE80]/10"
					: "hover:bg-white hover:shadow-sm dark:hover:bg-white/5"
			}`}
		>
			<div
				className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
					checked
						? "border-[#006C5E] bg-[#006C5E] dark:border-[#4ADE80] dark:bg-[#4ADE80]"
						: "border-gray-300 group-hover:border-[#006C5E] dark:border-white/20 dark:group-hover:border-[#4ADE80]"
				}`}
			>
				{checked && (
					<FaCheck className="text-[10px] text-white dark:text-[#0d1f1c]" />
				)}
			</div>

			<div
				className={`flex-1 leading-snug ${checked ? "line-through decoration-gray-400 opacity-50" : ""}`}
			>
				<span className="font-bold text-gray-900 dark:text-gray-200">
					{item.name}
				</span>
				{item.detail && (
					<span className="ml-1 text-sm font-medium text-gray-500 dark:text-gray-500">
						({item.detail})
					</span>
				)}
			</div>

			{item.link && (
				<a
					href={item.link}
					target="_blank"
					rel="noopener noreferrer"
					onClick={(e) => e.stopPropagation()}
					className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1.5 text-[10px] font-bold tracking-wide text-gray-500 uppercase transition-all hover:bg-[#006C5E] hover:text-white dark:bg-white/10 dark:text-gray-400 dark:hover:bg-[#4ADE80] dark:hover:text-black"
				>
					<FaExternalLinkAlt className="text-xs" />
					<span className="hidden sm:inline">Source</span>
				</a>
			)}
		</li>
	);
};

const InstructionStep = ({
	index,
	step,
	onImageClick,
}: {
	index: number;
	step: any;
	onImageClick: (img: string) => void;
}) => {
	return (
		<div className="group flex gap-4 lg:gap-6">
			{/* Number Column */}
			<div className="flex shrink-0 flex-col items-center">
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xl font-black text-[#006C5E] transition-colors group-hover:bg-[#006C5E] group-hover:text-white lg:h-12 lg:w-12 dark:bg-white/10 dark:text-[#4ADE80] dark:group-hover:bg-[#4ADE80] dark:group-hover:text-black">
					{index}
				</div>
				<div className="my-2 w-0.5 flex-1 bg-gray-100 group-last:hidden dark:bg-white/10" />
			</div>

			{/* Content Column */}
			<div className="min-w-0 flex-1 pb-10">
				<h4 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
					{step.name}
				</h4>
				<p className="text-base leading-relaxed whitespace-pre-line text-gray-600 lg:text-lg dark:text-gray-300">
					{step.detail}
				</p>

				{step.image && (
					<div
						onClick={() => onImageClick(step.image)}
						className="relative mt-6 h-64 w-full cursor-zoom-in overflow-hidden rounded-3xl border border-gray-100 bg-gray-50 transition-all hover:border-[#006C5E]/30 md:h-80 dark:border-white/10 dark:bg-black/20 dark:hover:border-[#4ADE80]/30"
					>
						{/* The Image (Contained) */}
						<Image
							src={step.image}
							fill
							alt={`Step ${index}`}
							className="object-contain lg:p-2" // p-2 gives it a little breathing room
							loader={imageLoader}
						/>

						{/* Zoom Overlay Hint */}
						<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/5 dark:group-hover:bg-white/5">
							<div className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-bold text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
								<FaSearchPlus /> Zoom
							</div>
						</div>
					</div>
				)}

				{step.timeReq && (
					<div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-bold text-gray-500 dark:bg-white/5 dark:text-gray-400">
						<FaClock /> {step.timeReq} mins
					</div>
				)}
			</div>
		</div>
	);
};
