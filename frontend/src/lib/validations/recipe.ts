// lib/validations/recipe.ts
import { z } from "zod";
import { RECIPE_CATEGORIES } from "@/lib/recipeCategories";

const RegionalNameSchema = z.object({
	region: z.string(),
	name: z.string(),
});

const EquipmentSchema = z.object({
	name: z.string().trim().min(1, "Equipment name required").max(120),
	detail: z.string().trim().max(240).nullable(),
	image: z.string().url().nullable().or(z.literal("")),
	link: z.string().url().nullable().or(z.literal("")),
	regionalName: RegionalNameSchema.nullable().optional(),
});

const IngredientSchema = z.object({
	name: z.string().trim().min(1, "Ingredient name required").max(120),
	detail: z.string().trim().max(240).nullable(),
	image: z.string().url().nullable().or(z.literal("")),
	link: z.string().url().nullable().or(z.literal("")),
	regionalName: RegionalNameSchema.nullable().optional(),
});

const StepSchema = z.object({
	name: z.string().trim().min(1, "Step name required").max(120),
	detail: z.string().trim().max(2000).nullable(),
	timeReq: z.number().int().positive().nullable(),
	videoUrl: z.string().url().nullable().or(z.literal("")),
	image: z.string().url().nullable().or(z.literal("")),
	link: z.string().url().nullable().or(z.literal("")),
});

const FAQSchema = z.object({
	question: z.string().trim().min(5, "Question too short").max(180),
	answer: z.string().trim().min(10, "Answer too short").max(1000),
});

const RecipeMediaSchema = z.object({
	publicId: z.string().min(1).max(255),
	url: z.string().url(),
	resourceType: z.enum(["IMAGE", "VIDEO", "RAW"]).default("IMAGE"),
	kind: z.enum(["MAIN", "GALLERY", "STEP", "VIDEO"]),
	position: z.number().int().min(0).max(1000).optional(),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional(),
	bytes: z.number().int().positive().optional(),
	format: z.string().max(20).optional(),
});

const RecipeCategorySchema = z.enum(RECIPE_CATEGORIES);

export const RecipePublishSchema = z.object({
	expectedVersion: z.number().int().positive().optional(),
	name: z
		.string()
		.trim()
		.min(3, "Recipe name must be at least 3 characters")
		.max(90),
	about: z.string().trim().max(1200).nullable(),
	mainImage: z.string().url("Valid cover image required"),
	mainImagePublicId: z.string().min(1).max(255).nullable(),
	moreImages: z.array(z.string().url()).max(12).default([]),
	totalTimeReq: z.number().int().positive("Time must be positive"),
	yield: z.number().int().positive().max(100).nullable(),
	calories: z.number().int().positive().max(5000).nullable(),
	diet: z
		.enum(["Vegan", "Vegetarian", "Pescatarian", "Omnivore", "Carnivore"])
		.nullable(),
	cuisine: z.string().trim().max(60).default("NA"),
	recipeCategory: RecipeCategorySchema,
	difficulty: z.enum(["Easy", "Medium", "Hard", "Expert"]).nullable(),
	equipments: z.array(EquipmentSchema).max(40).default([]),
	ingredients: z
		.array(IngredientSchema)
		.min(1, "Add at least one ingredient")
		.max(80),
	steps: z.array(StepSchema).min(1, "Add at least one step").max(60),
	tipsAndTricks: z.string().trim().max(1500).nullable(),
	storingFreezing: z.string().trim().max(1500).nullable(),
	faqs: z.array(FAQSchema).max(20).default([]),
	tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
	media: z.array(RecipeMediaSchema).max(30).default([]),
});

export const CreateRecipeSchema = RecipePublishSchema.extend({
	authorId: z.string().uuid(),
});

export type CreateRecipeInput = z.infer<typeof CreateRecipeSchema>;
export type RecipePublishInput = z.infer<typeof RecipePublishSchema>;
