"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { type RecipeResponse, recipeClient } from "@/lib/api/recipeClient";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCloudinaryUpload } from "@/lib/hooks/useCloudinaryUpload";
import {
	commitRecipeUpload,
	type NewRecipe,
	type RecipeMediaAsset,
	resetRecipeData,
	setNewRecipeData,
	updateRecipeDraftMeta,
	updateRecipeField,
} from "@/lib/Slices/NewRecipeData";
import { setProfilePopup } from "@/lib/Slices/ProfileMenuPopup";
import { setTab } from "@/lib/Slices/tabSlice";
import type { RootState } from "@/lib/store";
import { RecipePublishSchema } from "@/lib/validations/recipe";
import {
	BasicInfoEditor,
	FAQEditor,
	GalleryUpload,
	HeaderImageUpload,
	IngredientsEditor,
	MetaDetailsEditor,
	StepsEditor,
	TagEditor,
} from "./RecipeComponents";

const LOCAL_DRAFT_KEY = "cooktale:new-recipe-draft";
const SERVER_SAVE_DELAY_MS = 2500;

const getDraftStorageKey = (userId: string, recipeId?: string) =>
	`${LOCAL_DRAFT_KEY}:${userId}:${recipeId || "new"}`;

const recipeFromServer = (server: RecipeResponse["recipe"]): NewRecipe => {
	const urls = [server.mainImage, ...(server.moreImages || [])].filter(
		(url): url is string => Boolean(url),
	);
	return {
		draftId: server.id,
		clientDraftId: server.clientDraftId || null,
		version: server.version,
		serverUpdatedAt: server.updatedAt || server.lastEditedAt || null,
		name: server.name || "",
		about: server.about || null,
		images: urls,
		imageUrls: urls,
		media: (server.media || []) as RecipeMediaAsset[],
		totalTimeReq: server.totalTimeReq || null,
		yield: server.yield || null,
		calories: server.calories || null,
		diet: server.diet || null,
		cuisine: server.cuisine || "NA",
		difficulty: server.difficulty || null,
		equipments: (server.equipments || []).map((item) => ({
			name: item.name,
			detail: item.detail || null,
			image: item.image || null,
			link: item.link || null,
			regionalName: null,
		})),
		ingredients: (server.ingredients || []).map((item) => ({
			name: item.name,
			detail: item.detail || null,
			image: item.image || null,
			link: item.link || null,
			regionalName: null,
		})),
		steps: (server.steps || []).map((step) => ({
			name: step.name,
			detail: step.detail || null,
			timeReq: step.timeReq || null,
			videoUrl: step.videoUrl || null,
			image: step.image || null,
			link: step.link || null,
		})),
		tipsAndTricks: server.tipsAndTricks || null,
		storingFreezing: server.storingFreezing || null,
		faqs: server.faqs || [],
		tags: server.tags || [],
	};
};

type SaveStatus = "idle" | "local" | "creating" | "saving" | "saved" | "error";
type GuideKey =
	| "cover"
	| "title"
	| "about"
	| "gallery"
	| "meta"
	| "time"
	| "yield"
	| "calories"
	| "difficulty"
	| "cuisine"
	| "diet"
	| "ingredients"
	| "equipment"
	| "steps"
	| "faq"
	| "tags"
	| "tips"
	| "storage";

const RECIPE_FIELD_GUIDES: Record<
	GuideKey,
	{
		eyebrow: string;
		title: string;
		body: string;
		tips?: string[];
		example?: string;
	}
> = {
	cover: {
		eyebrow: "Cover image",
		title: "Make the first photo do the selling",
		body: "Use a clean, bright final-dish image. Avoid heavy text, dark plates on dark backgrounds, and messy counters.",
		tips: ["Landscape works best", "Aim for 1600px+", "Final dish first"],
	},
	title: {
		eyebrow: "Title & intro",
		title: "Make the recipe searchable and clear",
		body: "Use the actual dish name first. Avoid vague titles like 'my best recipe' because search and readers both need specifics.",
		example: "Creamy Garlic Paneer Pasta",
	},
	about: {
		eyebrow: "Recipe story",
		title: "Explain why this dish is worth cooking",
		body: "Describe taste, texture, occasion, skill level, and any personal note that helps readers understand the recipe quickly.",
		tips: ["Taste", "Texture", "Occasion"],
	},
	gallery: {
		eyebrow: "Gallery",
		title: "Show proof, process, and texture",
		body: "Use extra photos for process shots, close-ups, serving ideas, or texture. Do not repeat the same angle.",
		tips: ["Process", "Close-up", "Serving shot"],
	},
	meta: {
		eyebrow: "Recipe facts",
		title: "Facts should feel trustworthy",
		body: "These fields help readers plan before cooking. Keep them practical and honest.",
		tips: ["Planning", "Serving", "Diet filters"],
	},
	time: {
		eyebrow: "Time",
		title: "Use total hands-on + cooking time",
		body: "Enter the full time in minutes, including prep, cooking, resting, cooling, or marination when it matters.",
		example: "45 means roughly 15 min prep + 30 min cook",
	},
	yield: {
		eyebrow: "Yield",
		title: "Tell readers how much this makes",
		body: "Use realistic servings or pieces. This helps people scale ingredients and plan portions.",
		example: "4 servings, 12 cookies, or 2 jars",
	},
	calories: {
		eyebrow: "Calories",
		title: "Only add calories if you can estimate honestly",
		body: "Calories should be per serving. If you are unsure, leave it empty instead of guessing wildly.",
		tips: ["Per serving", "Optional", "Avoid fake precision"],
	},
	difficulty: {
		eyebrow: "Difficulty",
		title: "Rate the effort, not the taste",
		body: "Easy means beginner-friendly. Expert means timing, technique, or judgment matters a lot.",
		tips: ["Easy", "Medium", "Hard", "Expert"],
	},
	cuisine: {
		eyebrow: "Cuisine",
		title: "Pick the closest food tradition",
		body: "Cuisine helps browsing and filtering. Choose the closest fit; use Other only when nothing fits.",
		tips: ["Discovery", "Filtering", "Closest fit"],
	},
	diet: {
		eyebrow: "Diet",
		title: "Choose the diet people can rely on",
		body: "Only mark Vegan, Vegetarian, or similar when the whole recipe fits that diet, including toppings and swaps.",
		tips: ["Be accurate", "Check ingredients", "Avoid misleading tags"],
	},
	ingredients: {
		eyebrow: "Ingredients",
		title: "Use ingredients readers can follow",
		body: "Write one ingredient per row. Include quantities in the name or detail and keep optional swaps clear.",
		example: "200g paneer, cubed",
	},
	equipment: {
		eyebrow: "Equipment",
		title: "Only list tools that matter",
		body: "Add tools that change the result or help readers prepare. Skip obvious basics unless they are important.",
		tips: ["Pan size", "Mixer/blender", "Special tools"],
	},
	steps: {
		eyebrow: "Cooking steps",
		title: "One action per step",
		body: "Each step should tell the reader what to do, what to look for, and roughly how long it takes.",
		tips: ["Action", "Heat", "Visual cue"],
	},
	faq: {
		eyebrow: "Reader help",
		title: "Answer problems before they happen",
		body: "Use FAQs for substitutions, make-ahead notes, spice levels, storage, or common mistakes.",
		tips: ["Substitutions", "Make-ahead", "Troubleshooting"],
	},
	tags: {
		eyebrow: "Tags",
		title: "Use tags people would search",
		body: "Add short, useful tags for ingredients, cuisine, meal type, occasion, or diet. Avoid stuffing random keywords.",
		example: "paneer, dinner, high protein, indian",
	},
	tips: {
		eyebrow: "Chef tips",
		title: "Share the small details that prevent failure",
		body: "Use this for heat control, substitutions, texture cues, common mistakes, or what you personally learned while making it.",
		tips: ["Mistakes", "Substitutions", "Texture cues"],
	},
	storage: {
		eyebrow: "Storage",
		title: "Help readers after the meal",
		body: "Mention fridge/freezer life, reheating, whether the texture changes, and what should not be frozen.",
		tips: ["Fridge", "Freezer", "Reheat"],
	},
};

const toApiResourceType = (
	resourceType: string,
): RecipeMediaAsset["resourceType"] => {
	if (resourceType === "video") return "VIDEO";
	if (resourceType === "raw") return "RAW";
	return "IMAGE";
};

const hasMeaningfulRecipeContent = (recipe: NewRecipe) =>
	Boolean(
		recipe.name?.trim() ||
			recipe.about?.trim() ||
			recipe.imageUrls?.length ||
			recipe.ingredients?.some((item) => item.name?.trim()) ||
			recipe.equipments?.some((item) => item.name?.trim()) ||
			recipe.steps?.some((step) => step.name?.trim()) ||
			recipe.tags?.length,
	);

const normalizeRecipePayload = (recipe: NewRecipe) => {
	const mainMedia = recipe.media?.find((media) => media.kind === "MAIN");
	const name = recipe.name?.trim();

	return {
		expectedVersion: recipe.version || undefined,
		...(name && name.length >= 3 ? { name } : {}),
		about: recipe.about?.trim() || null,
		...(recipe.imageUrls?.[0]
			? {
					mainImage: recipe.imageUrls[0],
					mainImagePublicId: mainMedia?.publicId || null,
				}
			: {}),
		moreImages: recipe.imageUrls?.slice(1) || [],
		...(recipe.totalTimeReq ? { totalTimeReq: recipe.totalTimeReq } : {}),
		yield: recipe.yield || null,
		calories: recipe.calories || null,
		diet: recipe.diet || null,
		cuisine: recipe.cuisine || "NA",
		difficulty: recipe.difficulty || null,
		tipsAndTricks: recipe.tipsAndTricks?.trim() || null,
		storingFreezing: recipe.storingFreezing?.trim() || null,
		tags: (recipe.tags || [])
			.map((tag) => tag.trim().toLowerCase())
			.filter(Boolean)
			.slice(0, 12),
		equipments:
			recipe.equipments
				?.filter((equipment) => equipment.name?.trim())
				.map(({ regionalName, ...equipment }) => ({
					...equipment,
					name: equipment.name.trim(),
					detail: equipment.detail?.trim() || null,
					link: equipment.link?.trim() || null,
				})) || [],
		ingredients:
			recipe.ingredients
				?.filter((ingredient) => ingredient.name?.trim())
				.map(({ regionalName, ...ingredient }) => ({
					...ingredient,
					name: ingredient.name.trim(),
					detail: ingredient.detail?.trim() || null,
					link: ingredient.link?.trim() || null,
				})) || [],
		steps:
			recipe.steps
				?.filter((step) => step.name?.trim())
				.map((step) => ({
					...step,
					name: step.name.trim(),
					detail: step.detail?.trim() || null,
					link: step.link?.trim() || null,
					timeReq: step.timeReq || null,
				})) || [],
		faqs:
			recipe.faqs
				?.filter(
					(faq) =>
						faq.question?.trim().length >= 5 && faq.answer?.trim().length >= 10,
				)
				.map((faq) => ({
					question: faq.question.trim(),
					answer: faq.answer.trim(),
				})) || [],
		media: recipe.media || [],
	};
};

const getSaveLabel = (status: SaveStatus, lastSavedAt: string | null) => {
	if (status === "creating") return "Creating draft...";
	if (status === "saving") return "Saving to CookTale...";
	if (status === "error") return "Saved locally. Server save failed.";
	if (status === "saved" && lastSavedAt) {
		return `Saved to CookTale at ${new Date(lastSavedAt).toLocaleTimeString(
			[],
			{
				hour: "2-digit",
				minute: "2-digit",
			},
		)}`;
	}
	if (status === "local") return "Local backup saved. Syncing shortly...";
	return "Draft ready";
};

function RecipeFieldGuide({
	guide,
}: {
	guide: (typeof RECIPE_FIELD_GUIDES)[GuideKey];
}) {
	return (
		<aside className="hidden lg:sticky lg:top-36 lg:col-span-3 lg:block lg:self-start">
			<div className="rounded-3xl border border-gray-100 bg-white p-6 dark:border-white/5 dark:bg-[#152a26]">
				<p className="text-xs font-bold tracking-[0.22em] text-[#006C5E] uppercase dark:text-[#4ADE80]">
					{guide.eyebrow}
				</p>
				<h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
					{guide.title}
				</h3>
				<p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
					{guide.body}
				</p>
				{guide.example ? (
					<div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
						<p className="text-[11px] font-bold tracking-[0.18em] text-gray-400 uppercase">
							Example
						</p>
						<p className="mt-2 whitespace-pre-line text-sm font-medium text-gray-700 dark:text-gray-200">
							{guide.example}
						</p>
					</div>
				) : null}
				{guide.tips?.length ? (
					<div className="mt-5 flex flex-wrap gap-2">
						{guide.tips.map((tip) => (
							<span
								key={tip}
								className="rounded-full border border-gray-100 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-gray-400"
							>
								{tip}
							</span>
						))}
					</div>
				) : null}
			</div>
		</aside>
	);
}

export default function NewRecipeForm({ recipeId }: { recipeId?: string }) {
	const dispatch = useDispatch();
	const router = useRouter();
	const { status, user: authUser } = useAuth();
	const { uploadFile } = useCloudinaryUpload();
	const isPublishingRef = useRef(false);
	const initialRecipeRef = useRef<NewRecipe | null>(null);
	const hasLoadedLocalDraftRef = useRef(false);
	const isCreatingDraftRef = useRef(false);
	const lastServerPayloadRef = useRef<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [lastServerSavedAt, setLastServerSavedAt] = useState<string | null>(
		null,
	);
	const [activeGuideKey, setActiveGuideKey] = useState<GuideKey>("cover");
	const [draftLoadError, setDraftLoadError] = useState<string | null>(null);

	const recipe = useSelector(
		(state: RootState) => state.NewRecipeData.NewRecipeData[0],
	);
	if (!initialRecipeRef.current) initialRecipeRef.current = recipe;

	const updateField = useCallback(
		<K extends keyof NewRecipe>(field: K, value: NewRecipe[K]) => {
			dispatch(updateRecipeField({ index: 0, field, value }));
		},
		[dispatch],
	);

	const handleGuide = useCallback((key: string) => {
		if (key in RECIPE_FIELD_GUIDES) setActiveGuideKey(key as GuideKey);
	}, []);

	const bindGuide = useCallback(
		(key: GuideKey) => ({
			onFocus: () => setActiveGuideKey(key),
			onMouseEnter: () => setActiveGuideKey(key),
		}),
		[],
	);

	useEffect(() => {
		if (status !== "authenticated" || !authUser?.id) return;
		if (hasLoadedLocalDraftRef.current) return;
		let cancelled = false;
		const storageKey = getDraftStorageKey(authUser.id, recipeId);

		const resolveDraft = async () => {
			let localRecipe: NewRecipe | null = null;
			let localSavedAt: string | null = null;
			try {
				const saved = window.localStorage.getItem(storageKey);
				if (saved) {
					const parsed = JSON.parse(saved) as
						| NewRecipe
						| { savedAt: string; recipe: NewRecipe };
					localRecipe = "recipe" in parsed ? parsed.recipe : parsed;
					localSavedAt = "recipe" in parsed ? parsed.savedAt : null;
				}
			} catch {
				window.localStorage.removeItem(storageKey);
			}

			let serverRecipe: RecipeResponse["recipe"] | null = null;
			if (recipeId) {
				serverRecipe = await recipeClient
					.getManage(recipeId)
					.then((result) => result.recipe)
					.catch(() => null);
				if (!serverRecipe) {
					if (!cancelled) {
						setDraftLoadError(
							"This recipe could not be found or you do not own it.",
						);
						hasLoadedLocalDraftRef.current = true;
					}
					return;
				}
			} else if (localRecipe?.draftId) {
				serverRecipe = await recipeClient
					.getManage(localRecipe.draftId)
					.then((result) => result.recipe)
					.catch(() => null);
			} else {
				const latest = await recipeClient
					.listMine("DRAFT", 1, 1)
					.catch(() => null);
				if (latest?.recipes[0]) {
					serverRecipe = await recipeClient
						.getManage(latest.recipes[0].id)
						.then((result) => result.recipe)
						.catch(() => null);
				}
			}

			if (cancelled) return;
			const serverSavedAt =
				serverRecipe?.updatedAt || serverRecipe?.lastEditedAt || null;
			const localMatchesRecipe = !recipeId || localRecipe?.draftId === recipeId;
			const useServer =
				serverRecipe &&
				(!localRecipe ||
					!localMatchesRecipe ||
					!localSavedAt ||
					Boolean(
						serverSavedAt && new Date(serverSavedAt) > new Date(localSavedAt),
					));
			const resolved =
				useServer && serverRecipe
					? recipeFromServer(serverRecipe)
					: localRecipe
						? {
								...localRecipe,
								clientDraftId: localRecipe.clientDraftId || crypto.randomUUID(),
								version: localRecipe.version || serverRecipe?.version || null,
							}
						: {
								...(initialRecipeRef.current as NewRecipe),
								clientDraftId: crypto.randomUUID(),
							};
			dispatch(setNewRecipeData([resolved]));
			hasLoadedLocalDraftRef.current = true;
		};

		void resolveDraft();
		return () => {
			cancelled = true;
		};
	}, [authUser?.id, dispatch, recipeId, status]);

	useEffect(() => {
		if (
			!hasLoadedLocalDraftRef.current ||
			status !== "authenticated" ||
			!authUser?.id
		)
			return;

		const timeout = window.setTimeout(() => {
			try {
				window.localStorage.setItem(
					getDraftStorageKey(authUser.id, recipeId),
					JSON.stringify({ savedAt: new Date().toISOString(), recipe }),
				);
				setSaveStatus((current) =>
					current === "saving" || current === "creating" ? current : "local",
				);
			} catch {
				// Storage can fail when base64 previews become too large. Publishing still uses Cloudinary URLs.
			}
		}, 500);

		return () => window.clearTimeout(timeout);
	}, [authUser?.id, recipe, recipeId, status]);

	useEffect(() => {
		if (status !== "authenticated") return;
		if (!hasLoadedLocalDraftRef.current) return;
		if (recipe.draftId) return;
		if (isCreatingDraftRef.current) return;
		if (!hasMeaningfulRecipeContent(recipe)) return;

		isCreatingDraftRef.current = true;
		setSaveStatus("creating");

		recipeClient
			.createDraft({
				name: recipe.name?.trim().length >= 3 ? recipe.name.trim() : undefined,
				clientDraftId: recipe.clientDraftId || undefined,
			})
			.then((response) => {
				dispatch(
					updateRecipeDraftMeta({
						index: 0,
						draftId: response.recipe.id,
						clientDraftId:
							response.recipe.clientDraftId || recipe.clientDraftId,
						version: response.recipe.version,
						serverUpdatedAt:
							response.recipe.updatedAt ||
							response.recipe.lastEditedAt ||
							new Date().toISOString(),
					}),
				);
				setLastServerSavedAt(new Date().toISOString());
				setSaveStatus("saved");
			})
			.catch((error) => {
				console.error("Draft creation failed:", error);
				setSaveStatus("error");
			})
			.finally(() => {
				isCreatingDraftRef.current = false;
			});
	}, [dispatch, recipe, status]);

	useEffect(() => {
		if (status !== "authenticated") return;
		if (!recipe.draftId) return;
		if (isPublishingRef.current) return;
		if (!hasMeaningfulRecipeContent(recipe)) return;

		const payload = normalizeRecipePayload(recipe);
		const payloadKey = JSON.stringify(payload);
		if (lastServerPayloadRef.current === payloadKey) return;

		const timeout = window.setTimeout(() => {
			setSaveStatus("saving");
			recipeClient
				.update(recipe.draftId as string, payload)
				.then((response) => {
					lastServerPayloadRef.current = payloadKey;
					const savedAt =
						response.recipe.updatedAt ||
						response.recipe.lastEditedAt ||
						new Date().toISOString();
					setLastServerSavedAt(savedAt);
					setSaveStatus("saved");
					dispatch(
						updateRecipeDraftMeta({
							index: 0,
							serverUpdatedAt: savedAt,
							version: response.recipe.version,
						}),
					);
				})
				.catch(async (error) => {
					console.error("Recipe autosave failed:", error);
					if (error?.statusCode === 409 && authUser?.id) {
						window.localStorage.setItem(
							`${getDraftStorageKey(authUser.id, recipeId)}:conflict:${Date.now()}`,
							JSON.stringify({ savedAt: new Date().toISOString(), recipe }),
						);
						const latest = await recipeClient
							.getManage(recipe.draftId as string)
							.catch(() => null);
						if (latest)
							dispatch(setNewRecipeData([recipeFromServer(latest.recipe)]));
						toast.error(
							"A newer edit was found. We loaded it and kept your local copy.",
						);
					}
					if (error?.statusCode === 404 || error?.statusCode === 403) {
						lastServerPayloadRef.current = null;
						dispatch(
							updateRecipeDraftMeta({
								index: 0,
								draftId: null,
								version: null,
								serverUpdatedAt: null,
							}),
						);
					}
					setSaveStatus("error");
				});
		}, SERVER_SAVE_DELAY_MS);

		return () => window.clearTimeout(timeout);
	}, [authUser?.id, dispatch, recipe, recipeId, status]);

	const handleImageUpload = async (file: File, isMain: boolean = false) => {
		setIsUploading(true);
		const loadingId = toast.loading("Uploading to cloud...");

		try {
			const res = await uploadFile({
				file,
				context: "TEMP",
				resourceType: file.type.startsWith("video/") ? "video" : "image",
			});
			if (res) {
				const currentMedia = recipe.media || [];
				const asset: RecipeMediaAsset = {
					url: res.publicUrl,
					publicId: res.publicId,
					resourceType: toApiResourceType(res.resourceType),
					kind: isMain ? "MAIN" : "GALLERY",
					position: isMain
						? 0
						: currentMedia.filter((media) => media.kind === "GALLERY").length +
							1,
					width: res.width,
					height: res.height,
					bytes: res.bytes,
					format: res.format,
				};

				dispatch(commitRecipeUpload({ index: 0, asset, isMain }));
				toast.success("Uploaded!", { id: loadingId });
			}
		} catch (error) {
			console.error(error);
			toast.error("Upload failed", { id: loadingId });
		} finally {
			setIsUploading(false);
		}
	};

	const handlePublish = async () => {
		if (isPublishingRef.current) return;

		if (status !== "authenticated") {
			dispatch(setTab("signup"));
			dispatch(setProfilePopup(false));
			return toast.error("Create an account to publish recipes.");
		}

		if (!recipe.name?.trim())
			return toast.error("Give your masterpiece a name!");
		if (!recipe.imageUrls?.[0]) return toast.error("Cover image is missing.");
		if (!recipe.ingredients?.length)
			return toast.error("Add at least one ingredient.");
		if (!recipe.steps?.length)
			return toast.error("Tell us how to cook it (Add steps).");
		if (!recipe.totalTimeReq) return toast.error("Add total time required.");

		isPublishingRef.current = true;
		const loadingId = toast.loading("Publishing your recipe...");

		try {
			const payload = normalizeRecipePayload(recipe);

			const validation = RecipePublishSchema.safeParse(payload);
			if (!validation.success) {
				throw new Error(
					validation.error.errors[0]?.message ||
						"Please check your recipe details.",
				);
			}

			let draftId: string | null = recipe.draftId;
			let createdDuringPublish = false;
			try {
				if (!draftId) {
					const draft = await recipeClient.createDraft({
						name: validation.data.name,
						clientDraftId: recipe.clientDraftId || crypto.randomUUID(),
					});
					draftId = draft.recipe.id;
					createdDuringPublish = true;
					dispatch(
						updateRecipeDraftMeta({
							index: 0,
							draftId,
							clientDraftId: draft.recipe.clientDraftId || recipe.clientDraftId,
							version: draft.recipe.version,
							serverUpdatedAt:
								draft.recipe.updatedAt ||
								draft.recipe.lastEditedAt ||
								new Date().toISOString(),
						}),
					);
				}

				await recipeClient.update(draftId, validation.data);
				const published = await recipeClient.publish(draftId);

				toast.success("Recipe published!", { id: loadingId });
				if (authUser?.id) {
					window.localStorage.removeItem(
						getDraftStorageKey(authUser.id, recipeId),
					);
				}
				dispatch(resetRecipeData());
				router.push(`/recipe/${published.recipe.slug || published.recipe.id}`);
			} catch (error) {
				if (draftId && createdDuringPublish) {
					await recipeClient.delete(draftId).catch(() => null);
				}
				throw error;
			}
		} catch (error: unknown) {
			console.error("Publish error:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to publish.",
				{
					id: loadingId,
				},
			);
		} finally {
			isPublishingRef.current = false;
		}
	};

	if (status === "loading") {
		return (
			<div className="min-h-screen bg-[#fafafa] pt-32 dark:bg-[#0d1f1c]">
				<div className="container mx-auto px-6">
					<div className="h-24 animate-pulse rounded-3xl bg-gray-100 dark:bg-white/5" />
				</div>
			</div>
		);
	}

	if (status === "unauthenticated") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 pt-20 dark:bg-[#0d1f1c]">
				<div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 text-center dark:border-white/10 dark:bg-[#152a26]">
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
						Share your recipes with CookTale.
					</h1>
					<p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
						Create an account or sign in to publish recipes, upload photos, and
						manage your kitchen.
					</p>
					<div className="mt-6 grid gap-3">
						<button
							type="button"
							onClick={() => {
								dispatch(setTab("signup"));
								dispatch(setProfilePopup(false));
							}}
							className="cursor-pointer rounded-xl bg-[#006C5E] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#005a4e]"
						>
							Sign Up
						</button>
						<button
							type="button"
							onClick={() => {
								dispatch(setTab("login"));
								dispatch(setProfilePopup(false));
							}}
							className="cursor-pointer rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
						>
							Log In
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (draftLoadError) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 pt-20 dark:bg-[#0d1f1c]">
				<div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#152a26]">
					<h1 className="text-xl font-semibold text-gray-900 dark:text-white">
						Recipe unavailable
					</h1>
					<p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
						{draftLoadError}
					</p>
					<button
						type="button"
						onClick={() => router.replace("/studio/content")}
						className="mt-6 cursor-pointer rounded-md bg-[#006C5E] px-5 py-3 text-sm font-semibold text-white"
					>
						Back to content
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#fafafa] pb-32 transition-colors duration-500 dark:bg-[#0d1f1c]">
			{/* HEADER */}
			<div className="relative top-16 z-20 border-b border-gray-200 bg-white/90 px-6 py-4 backdrop-blur-md transition-colors dark:border-white/5 dark:bg-[#0d1f1c]/90">
				<div className="container mx-auto flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={() => router.back()}
							className="cursor-pointer rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
							aria-label="Go back"
						>
							<FaArrowLeft className="text-gray-500 dark:text-gray-500" />
						</button>
						<div>
							<h1 className="text-lg leading-none font-black text-gray-900 lg:text-xl dark:text-white">
								{recipe.name || "Untitled Recipe"}
							</h1>
							<p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-500">
								{getSaveLabel(saveStatus, lastServerSavedAt)}
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={handlePublish}
						disabled={isPublishingRef.current || isUploading}
						className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#006C5E] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#005a4e] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#4ADE80] dark:text-black dark:hover:bg-[#3ccb74]"
					>
						{isPublishingRef.current ? (
							<BiLoaderAlt className="animate-spin" />
						) : (
							<FaPaperPlane />
						)}
						<span>Publish</span>
					</button>
				</div>
			</div>

			<div className="container mx-auto mt-24 grid grid-cols-1 gap-10 px-4 lg:grid-cols-12 lg:px-16 xl:px-24">
				{/* LEFT: FORM AREA */}
				<div className="space-y-12 lg:col-span-8">
					{/* 1. Cover Image */}
					<section {...bindGuide("cover")}>
						<h2 className="mb-4 ml-1 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
							Cover Image
						</h2>
						<HeaderImageUpload
							currentImage={recipe.images?.[0]}
							onImageSelect={(file: File, base64: string) => {
								updateField("images", [
									base64,
									...(recipe.images?.slice(1) || []),
								]);
								handleImageUpload(file, true);
							}}
						/>
					</section>

					{/* 2. Story & Basics */}
					<section {...bindGuide("title")}>
						<BasicInfoEditor
							name={recipe.name}
							about={recipe.about}
							onChange={updateField}
							onGuide={handleGuide}
						/>
					</section>

					{/* 3. Gallery */}
					<section {...bindGuide("gallery")}>
						<h2 className="mb-4 ml-1 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
							Gallery
						</h2>
						<GalleryUpload
							images={recipe.images?.slice(1) || []}
							onAdd={(files: FileList) => {
								Array.from(files).forEach((file) => {
									const reader = new FileReader();
									reader.onloadend = () => {
										const current = recipe.images || [];
										updateField("images", [
											...current,
											reader.result as string,
										]);
									};
									reader.readAsDataURL(file);
									handleImageUpload(file, false);
								});
							}}
						/>
					</section>

					{/* 4. Meta Details */}
					<section {...bindGuide("meta")}>
						<MetaDetailsEditor
							totalTimeReq={recipe.totalTimeReq}
							yield={recipe.yield}
							calories={recipe.calories}
							difficulty={recipe.difficulty}
							diet={recipe.diet}
							cuisine={recipe.cuisine}
							onChange={updateField}
							onGuide={handleGuide}
						/>
					</section>

					{/* 5. Ingredients & Equipment */}
					<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
						<section {...bindGuide("ingredients")}>
							<IngredientsEditor
								title="Ingredients"
								placeholder="e.g. 200g Flour"
								items={recipe.ingredients || []}
								onChange={(list: NewRecipe["ingredients"]) =>
									updateField("ingredients", list)
								}
							/>
						</section>
						<section {...bindGuide("equipment")}>
							<IngredientsEditor
								title="Equipment"
								placeholder="e.g. 9-inch Pan"
								items={recipe.equipments || []}
								onChange={(list: NewRecipe["equipments"]) =>
									updateField("equipments", list)
								}
							/>
						</section>
					</div>

					{/* 6. Steps */}
					<section {...bindGuide("steps")}>
						<StepsEditor
							steps={recipe.steps || []}
							onChange={(list: NewRecipe["steps"]) =>
								updateField("steps", list)
							}
						/>
					</section>

					{/* 7. FAQ */}
					<section {...bindGuide("faq")}>
						<h2 className="mb-4 ml-1 text-xs font-bold tracking-widest text-gray-500 uppercase dark:text-gray-500">
							Help Your Readers
						</h2>
						<FAQEditor
							faqs={recipe.faqs || []}
							onChange={(list: NewRecipe["faqs"]) => updateField("faqs", list)}
						/>
					</section>

					{/* 8. Finishing Touches */}
					<div
						{...bindGuide("tags")}
						className="space-y-8 rounded-4xl border border-gray-100 bg-white p-8 dark:border-white/5 dark:bg-[#152a26]"
					>
						<TagEditor
							tags={recipe.tags || []}
							onChange={(tags: string[]) => updateField("tags", tags)}
							onGuide={handleGuide}
						/>

						<div {...bindGuide("tips")}>
							<h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
								Chef's Tips
							</h3>
							<textarea
								value={recipe.tipsAndTricks || ""}
								maxLength={1500}
								onFocus={() => setActiveGuideKey("tips")}
								onChange={(e) => updateField("tipsAndTricks", e.target.value)}
								placeholder="Share your secrets..."
								className="min-h-[120px] w-full resize-none rounded-2xl bg-gray-50 p-4 text-gray-900 transition-all outline-none focus:ring-2 focus:ring-[#006C5E]/20 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:ring-[#4ADE80]/20"
							/>
							<p className="mt-2 text-right text-xs text-gray-400 dark:text-gray-600">
								{recipe.tipsAndTricks?.length || 0}/1500
							</p>
						</div>

						<div {...bindGuide("storage")}>
							<h3 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
								Storing & Freezing
							</h3>
							<textarea
								value={recipe.storingFreezing || ""}
								maxLength={1500}
								onFocus={() => setActiveGuideKey("storage")}
								onChange={(e) => updateField("storingFreezing", e.target.value)}
								placeholder="How to store leftovers or freeze for later..."
								className="min-h-[120px] w-full resize-none rounded-2xl bg-gray-50 p-4 text-gray-900 transition-all outline-none focus:ring-2 focus:ring-[#006C5E]/20 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-600 dark:focus:ring-[#4ADE80]/20"
							/>
							<p className="mt-2 text-right text-xs text-gray-400 dark:text-gray-600">
								{recipe.storingFreezing?.length || 0}/1500
							</p>
						</div>
					</div>
				</div>

				<RecipeFieldGuide guide={RECIPE_FIELD_GUIDES[activeGuideKey]} />
			</div>
		</div>
	);
}
