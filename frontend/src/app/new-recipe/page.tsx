import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import NewRecipeForm from "@/components/newRecipe/NewRecipeForm";
export async function generateMetadata() {
	return {
		title: "Create New Recipe",
		description:
			"Create and manage your favorite recipes with ease. Discover delicious dishes and step-by-step cooking guides tailored to your preferences.",
		keywords:
			"recipes, cooktale, new recipe, cooking, recipe management, create recipe, food blog",
		author: "Cooktale Team",
		openGraph: {
			title: "Create New Recipe",
			description:
				"Create and manage your favorite recipes with ease. Discover delicious dishes and step-by-step cooking guides tailored to your preferences.",
			url: "https://cooktale.theazam.com/new-recipe",
			type: "website",
			images: [
				{
					url: "https://cooktale.theazam.com/assets/recipe-thumbnail.jpg",
					alt: "cooktale New Recipe Thumbnail",
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: "Create New Recipe",
			description:
				"Discover how easy it is to create and manage your recipes with cooktale.",
			image: "https://cooktale.theazam.com/assets/recipe-thumbnail.jpg",
		},
	};
}

const NewRecipe = () => {
	return (
		<>
			<Navbar />
			<NewRecipeForm />
			<Footer />
		</>
	);
};

export default NewRecipe;
