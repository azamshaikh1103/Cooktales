import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RecipeCategory } from "@/lib/recipeCategories";

type RegionalName = {
	region: string;
	name: string;
};

interface Equipment {
	name: string;
	detail: string | null;
	image: string | null;
	link: string | null;
	regionalName: RegionalName | null;
}

interface Ingredient {
	name: string;
	detail: string | null;
	image: string | null;
	link: string | null;
	regionalName: RegionalName | null;
}
interface Step {
	name: string;
	detail: string | null;
	timeReq: number | null;
	videoUrl: string | null;
	image: string | null;
	link: string | null;
}

interface FAQ {
	question: string;
	answer: string;
}

export interface RecipeMediaAsset {
	url: string;
	publicId: string;
	resourceType: "IMAGE" | "VIDEO" | "RAW";
	kind: "MAIN" | "GALLERY" | "STEP" | "VIDEO";
	position: number;
	width?: number;
	height?: number;
	bytes?: number;
	format?: string;
}

export interface NewRecipe {
	draftId: string | null;
	clientDraftId: string | null;
	version: number | null;
	serverUpdatedAt: string | null;
	name: string;
	about: string | null;
	images: string[];
	imageUrls: string[];
	media: RecipeMediaAsset[];
	totalTimeReq: number | null;
	yield: number | null;
	calories: number | null;
	diet:
		| "Vegan"
		| "Vegetarian"
		| "Pescatarian"
		| "Omnivore"
		| "Carnivore"
		| null;
	cuisine: string;
	recipeCategory: RecipeCategory | null;
	difficulty: "Easy" | "Medium" | "Hard" | "Expert" | null;
	equipments: Equipment[];
	ingredients: Ingredient[];
	steps: Step[];
	tipsAndTricks: string | null;
	storingFreezing: string | null;
	faqs: FAQ[];
	tags: string[];
}

interface NewRecipeDataState {
	NewRecipeData: NewRecipe[];
}

const initialState: NewRecipeDataState = {
	NewRecipeData: [
		{
			draftId: null,
			clientDraftId: null,
			version: null,
			serverUpdatedAt: null,
			name: "",
			about: null,
			images: [],
			imageUrls: [],
			media: [],
			totalTimeReq: null,
			yield: null,
			calories: null,
			diet: null,
			cuisine: "NA",
			recipeCategory: null,
			difficulty: null,
			equipments: [],
			ingredients: [],
			steps: [],
			tipsAndTricks: null,
			storingFreezing: null,
			faqs: [],
			tags: [],
		},
	],
};
const NewRecipeDataSlice = createSlice({
	name: "NewRecipeData",
	initialState,
	reducers: {
		setNewRecipeData: (state, action: PayloadAction<NewRecipe[]>) => {
			state.NewRecipeData = action.payload;
		},

		updateRecipeField: <K extends keyof NewRecipe>(
			state: NewRecipeDataState,
			action: PayloadAction<{
				index: number;
				field: K;
				value: NewRecipe[K];
			}>,
		) => {
			const { index, field, value } = action.payload;
			if (state.NewRecipeData[index]) {
				state.NewRecipeData[index][field] = value;
			}
		},

		updateImageUrls: (
			state,
			action: PayloadAction<{ index: number; imageUrls: string[] }>,
		) => {
			const { index, imageUrls } = action.payload;
			if (state.NewRecipeData[index]) {
				state.NewRecipeData[index].imageUrls = imageUrls;
			}
		},

		updateRecipeMedia: (
			state,
			action: PayloadAction<{ index: number; media: RecipeMediaAsset[] }>,
		) => {
			const { index, media } = action.payload;
			if (state.NewRecipeData[index]) {
				state.NewRecipeData[index].media = media;
			}
		},

		commitRecipeUpload: (
			state,
			action: PayloadAction<{
				index: number;
				asset: RecipeMediaAsset;
				isMain: boolean;
			}>,
		) => {
			const { index, asset, isMain } = action.payload;
			const recipe = state.NewRecipeData[index];
			if (!recipe) return;

			if (isMain) {
				recipe.images = [asset.url, ...recipe.images.slice(1)];
				recipe.imageUrls = [asset.url, ...recipe.imageUrls.slice(1)];
				recipe.media = [
					asset,
					...recipe.media.filter((item) => item.kind !== "MAIN"),
				];
				return;
			}

			const previewIndex = recipe.images.findIndex((image) =>
				image.startsWith("data:"),
			);
			if (previewIndex >= 0) recipe.images[previewIndex] = asset.url;
			else recipe.images.push(asset.url);
			recipe.imageUrls.push(asset.url);
			recipe.media.push(asset);
		},

		updateRecipeDraftMeta: (
			state,
			action: PayloadAction<{
				index: number;
				draftId?: string | null;
				clientDraftId?: string | null;
				version?: number | null;
				serverUpdatedAt?: string | null;
			}>,
		) => {
			const { index, draftId, clientDraftId, version, serverUpdatedAt } =
				action.payload;
			if (state.NewRecipeData[index]) {
				if (draftId !== undefined) state.NewRecipeData[index].draftId = draftId;
				if (clientDraftId !== undefined) {
					state.NewRecipeData[index].clientDraftId = clientDraftId;
				}
				if (version !== undefined) state.NewRecipeData[index].version = version;
				if (serverUpdatedAt !== undefined) {
					state.NewRecipeData[index].serverUpdatedAt = serverUpdatedAt;
				}
			}
		},

		resetRecipeData: (state) => {
			state.NewRecipeData = initialState.NewRecipeData;
		},
	},
});

export const {
	setNewRecipeData,
	updateRecipeField,
	updateImageUrls,
	updateRecipeMedia,
	commitRecipeUpload,
	updateRecipeDraftMeta,
	resetRecipeData,
} = NewRecipeDataSlice.actions;

export default NewRecipeDataSlice.reducer;
