export const RECIPE_CATEGORIES = [
	"Breakfast & Brunch",
	"Appetizer",
	"Main Course",
	"Side Dish",
	"Soup",
	"Salad",
	"Sandwich & Wrap",
	"Pasta & Noodles",
	"Pizza & Flatbread",
	"Rice & Grains",
	"Snack",
	"Dessert",
	"Baked Good",
	"Drink",
	"Sauce & Condiment",
	"Preserve & Pantry",
	"Other",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
