import { notFound } from 'next/navigation';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import JsonLd from '@/components/seo/JsonLd';
import type { PublicRecipe } from '@/lib/api/recipeClient';
import { RecipeDetailClient } from './Client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

async function getRecipe(slug: string): Promise<PublicRecipe | null> {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Recipe API returned ${response.status}`);
  return ((await response.json()) as { recipe: PublicRecipe }).recipe;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.name,
    image: [recipe.mainImage, ...(recipe.moreImages || [])],
    author: { '@type': 'Person', name: recipe.author.name },
    datePublished: recipe.publishedAt || recipe.createdAt,
    description: recipe.about,
    totalTime: `PT${recipe.totalTimeReq}M`,
    keywords: recipe.tags?.join(', '),
    recipeYield: recipe.yield ? `${recipe.yield} servings` : undefined,
    recipeCuisine: recipe.cuisine !== 'NA' ? recipe.cuisine : undefined,
    recipeCategory: recipe.recipeCategory || undefined,
    nutrition: recipe.calories
      ? { '@type': 'NutritionInformation', calories: `${recipe.calories} calories` }
      : undefined,
    aggregateRating:
      recipe.ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: recipe.ratings,
            ratingCount: recipe.ratingCount,
          }
        : undefined,
    recipeIngredient: recipe.ingredients.map((item) =>
      [item.name, item.detail].filter(Boolean).join(' '),
    ),
    recipeInstructions: recipe.steps.map((step, index) => ({
      '@type': 'HowToStep',
      name: step.name,
      text: step.detail,
      url: `${process.env.FRONTEND_URL || 'https://cooktale.in'}/recipe/${recipe.slug}#step-${index + 1}`,
      image: step.image || undefined,
    })),
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
      <JsonLd data={jsonLd} />
      <Navbar />
      <main className="grow">
        <RecipeDetailClient recipe={recipe} isPremium={recipe.isPremium} />
      </main>
      <div className="bg-[#fafafa] transition-colors duration-500 dark:bg-[#0d1f1c]">
        <Footer />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  if (!recipe) return { title: 'Recipe Not Found' };

  const description = recipe.about || `Learn how to make ${recipe.name} on CookTale.`;
  const url = `https://cooktale.in/recipe/${recipe.slug}`;
  return {
    title: recipe.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: recipe.name,
      description,
      url,
      siteName: 'CookTale',
      images: [{ url: recipe.mainImage, width: 1200, height: 630, alt: recipe.name }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: recipe.name,
      description,
      images: [recipe.mainImage],
    },
  };
}
