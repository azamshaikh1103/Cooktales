import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import NewStory from '@/components/newStory/NewStory';

export async function generateMetadata() {
  return {
    title: 'Create New Story',
    description:
      'Create and manage your favorite recipes with ease. Discover delicious dishes and step-by-step cooking guides tailored to your preferences.',
    keywords: 'stories, cooktale, food writing, kitchen stories, create story',
    author: 'Cooktale Team',
    openGraph: {
      title: 'Create New Story | Cooktale',
      description:
        'Create and manage your favorite recipes with ease. Discover delicious dishes and step-by-step cooking guides tailored to your preferences.',
      url: 'https://cooktale.theazam.com/new-recipe',
      type: 'website',
      images: [
        {
          url: 'https://cooktale.theazam.com/assets/recipe-thumbnail.jpg',
          alt: 'Cooktale New Story Thumbnail',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Create New Story | Cooktale',
      description: 'Discover how easy it is to create and manage your recipes with cooktale.',
      image: 'https://cooktale.theazam.com/assets/recipe-thumbnail.jpg',
    },
  };
}

const NewStoryPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="min-h-screen bg-white dark:bg-[#0d1f1c]" />}>
        <NewStory />
      </Suspense>
    </>
  );
};

export default NewStoryPage;
