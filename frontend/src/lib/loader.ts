'use client';

const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // 1. Cloudinary (Our Main Image Host) - Optimize this!
  if (src.includes('res.cloudinary.com')) {
    const resized = `w_${width},c_limit`;

    if (src.includes('/upload/f_auto/q_auto/')) {
      return src.replace('/upload/f_auto/q_auto/', `/upload/${resized}/f_auto/q_auto/`);
    }

    return src.replace('/upload/', `/upload/${resized}/f_auto/q_auto/`);
  }

  // 2. Unsplash - Optimize this!
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', (quality || 75).toString());
    url.searchParams.set('fmt', 'webp');
    return url.href;
  }

  // 3. DiceBear / DummyJSON / Others - RETURN AS IS (Don't optimize)
  // But append a useless query param so Next.js *thinks* we used width
  if (src.includes('api.dicebear.com') || src.includes('cdn.dummyjson.com')) {
    return `${src}&w=${width}`;
  }

  // 4. Default fallback
  return src;
};

export default imageLoader;
