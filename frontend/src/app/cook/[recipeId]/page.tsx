import { notFound } from 'next/navigation';
import type { PublicRecipe } from '@/lib/api/recipeClient';
import CookModeClient from './CookModeClient';

interface PageProps {
  params: Promise<{ recipeId: string }>;
}

const API_URL =
  process.env.SERVER_API_URL ||
  process.env.NEXT_SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api/v1';

async function getCookRecipe(slug: string) {
  const response = await fetch(`${API_URL}/recipes/${encodeURIComponent(slug)}/cook`, {
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Recipe API returned ${response.status}`);
  return ((await response.json()) as { recipe: PublicRecipe }).recipe;
}

export default async function CookModePage({ params }: PageProps) {
  const { recipeId: slug } = await params;
  const recipe = await getCookRecipe(slug);
  if (!recipe) notFound();
  return <CookModeClient recipe={recipe} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { recipeId: slug } = await params;
  const recipe = await getCookRecipe(slug);
  if (!recipe) return { title: 'Recipe Not Found' };
  return {
    title: `Cook ${recipe.name}`,
    description: `Step-by-step cook mode for ${recipe.name}.`,
    robots: { index: false, follow: false },
  };
}
