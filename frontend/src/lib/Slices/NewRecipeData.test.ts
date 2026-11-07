import assert from "node:assert/strict";
import recipeReducer, {
	removeRecipeGalleryImage,
	setNewRecipeData,
} from "./NewRecipeData";

const galleryUrl = "https://res.cloudinary.com/cooktale/gallery-image.webp";
const legacyGalleryUrl =
	"https://res.cloudinary.com/cooktale/legacy-gallery.webp";

const initial = recipeReducer(
	undefined,
	setNewRecipeData([
		{
			draftId: "recipe-1",
			clientDraftId: null,
			version: 1,
			serverUpdatedAt: null,
			name: "Test recipe",
			about: null,
			images: ["https://example.com/main.webp", galleryUrl, legacyGalleryUrl],
			imageUrls: [
				"https://example.com/main.webp",
				galleryUrl,
				legacyGalleryUrl,
			],
			media: [
				{
					publicId: "gallery-image",
					url: galleryUrl,
					resourceType: "IMAGE",
					kind: "GALLERY",
					position: 0,
				},
			],
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
	]),
);

const result = recipeReducer(
	initial,
	removeRecipeGalleryImage({
		index: 0,
		publicId: "gallery-image",
		url: galleryUrl,
	}),
);

assert.equal(result.NewRecipeData[0].media.length, 0);
assert(!result.NewRecipeData[0].images.includes(galleryUrl));
assert(!result.NewRecipeData[0].imageUrls.includes(galleryUrl));

const legacyResult = recipeReducer(
	result,
	removeRecipeGalleryImage({ index: 0, url: legacyGalleryUrl }),
);

assert(!legacyResult.NewRecipeData[0].images.includes(legacyGalleryUrl));
assert(!legacyResult.NewRecipeData[0].imageUrls.includes(legacyGalleryUrl));

console.log("gallery image removal: PASS");
