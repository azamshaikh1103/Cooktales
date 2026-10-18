import RecipeCarousel from "./RecipeCarousel";

const SeasonalPick = ({ recipes }: { recipes: any[] }) => (
	<RecipeCarousel
		title="Seasonal Pick"
		subtitle="Fresh summer recipes to brighten your table"
		recipes={recipes}
	/>
);

const TodaysPick = ({ recipes }: { recipes: any[] }) => (
	<RecipeCarousel
		title="Today's Pick"
		subtitle="Trending dishes loved by our community"
		recipes={recipes}
	/>
);

const PopularRecipes = ({ recipes }: { recipes: any[] }) => (
	<RecipeCarousel
		title="Popular Recipes"
		subtitle="Discover amazing recipes tailored to your taste"
		recipes={recipes}
	/>
);

export { SeasonalPick, TodaysPick, PopularRecipes };
