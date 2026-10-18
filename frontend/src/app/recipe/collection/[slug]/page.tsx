interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  return <div>Collection Page {slug}</div>;
}
