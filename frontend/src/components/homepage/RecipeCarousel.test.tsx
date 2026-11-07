import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import RecipeCarousel from "./RecipeCarousel";

test("prioritizes only the first visible recipe photo when requested", () => {
	const recipes = [
		{ id: "1", slug: "one", name: "One", mainImage: "" },
		{
			id: "2",
			slug: "two",
			name: "Two",
			mainImage: "https://res.cloudinary.com/demo/image/upload/two.jpg",
		},
		{
			id: "3",
			slug: "three",
			name: "Three",
			mainImage: "https://res.cloudinary.com/demo/image/upload/three.jpg",
		},
	];
	const html = renderToStaticMarkup(
		<RecipeCarousel title="Popular" recipes={recipes} prioritizeFirstImage />,
	);
	const images = html.match(/<img\b[^>]*>/g) || [];
	const firstPhoto = images.find((image) => image.includes('alt="Two"')) || "";
	assert.match(firstPhoto, /loading="eager"/i);
	assert.match(firstPhoto, /fetchPriority="high"/i);
	assert.equal(
		images.filter((image) => /fetchPriority="high"/i.test(image)).length,
		1,
	);
	const laterSection = renderToStaticMarkup(
		<RecipeCarousel title="Later" recipes={recipes} />,
	);
	assert.doesNotMatch(laterSection, /fetchPriority="high"/i);
	const noVisiblePhoto = renderToStaticMarkup(
		<RecipeCarousel
			title="Popular"
			recipes={[recipes[0], { ...recipes[1], mainImage: "" }, recipes[2]]}
			prioritizeFirstImage
		/>,
	);
	assert.doesNotMatch(noVisiblePhoto, /fetchPriority="high"/i);
});
