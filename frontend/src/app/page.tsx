import Footer from "@/components/Footer";
import Heroarea from "@/components/homepage/Heroarea";
import {
	PopularRecipes,
	SeasonalPick,
	TodaysPick,
} from "@/components/homepage/HomeComponents";
import HomePopups from "@/components/homepage/HomePopups";
import RegionalPick from "@/components/homepage/RegionalPick";
import Stepsarea from "@/components/homepage/Stepsarea";
import Navbar from "@/components/Navbar";
import { getAllRecipesAction } from "@/lib/actions/recipe.actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
	const [popular, todaysPick, seasonal] = await Promise.all([
		getAllRecipesAction({ limit: 8, sortBy: "popular" }),
		getAllRecipesAction({ limit: 8, sortBy: "rating" }),
		getAllRecipesAction({ limit: 8, sortBy: "latest" }),
	]);
	const popularRecipes = popular.success && popular.data ? popular.data : [];
	const todayRecipes =
		todaysPick.success && todaysPick.data ? todaysPick.data : [];
	const seasonalRecipes =
		seasonal.success && seasonal.data ? seasonal.data : [];

	return (
		<div className="min-h-screen flex flex-col transition-colors duration-500 bg-[#fafafa] dark:bg-[#0d1f1c]">
			<Navbar />
			<HomePopups />
			<main className="grow">
				<Heroarea />

				<div className="relative z-10 flex flex-col gap-8 py-8 lg:gap-10 lg:py-10">
					<PopularRecipes recipes={popularRecipes} />
					<TodaysPick recipes={todayRecipes} />
					<SeasonalPick recipes={seasonalRecipes} />
				</div>

				<RegionalPick />

				<Stepsarea />
			</main>

			<Footer />
		</div>
	);
}
