import { notFound, permanentRedirect } from 'next/navigation';
import JsonLd from '@/components/seo/JsonLd';
import { profileClient } from '@/lib/api/profileClient';
import { ProfileClient } from './ProfileClient';

// ... (Keep generateMetadata and getUsernameFromSlug helper) ...

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!slug) notFound();

  const result = await profileClient
    .getPublicProfile(slug, { cache: 'no-store' })
    .catch(() => null);

  if (!result?.profile) {
    notFound();
  }
  if (result.redirectedFrom && result.canonicalHandle !== slug) {
    permanentRedirect(`/profile/${encodeURIComponent(result.canonicalHandle)}`);
  }

  const profileData = result.profile;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profileData.name,
      alternateName: profileData.username,
      identifier: profileData.id,
      description: profileData.about,
      image: profileData.image,
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          userInteractionCount: profileData._count.followers,
        },
      ],
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <ProfileClient user={profileData} />
    </>
  );
}
