import Navbar from "@/components/Navbar";
import NewRecipeForm from "@/components/newRecipe/NewRecipeForm";

export const metadata = {
	title: "Edit Recipe | CookTale",
	description: "Edit and publish your CookTale recipe.",
};

export default async function EditRecipePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<>
			<Navbar />
			<NewRecipeForm recipeId={id} />
		</>
	);
}
