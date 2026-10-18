"use client";

import Image from "next/image";
import { useState } from "react";

type StoryImageProps = {
	src: string;
	alt: string;
	className?: string;
	priority?: boolean;
	sizes?: string;
};

export function StoryCoverImage({
	src,
	alt,
	className = "",
	priority = false,
	sizes,
}: StoryImageProps) {
	const [failed, setFailed] = useState(false);
	if (failed) return null;

	return (
		<Image
			src={src}
			alt={alt}
			fill
			unoptimized
			fetchPriority={priority ? "high" : "auto"}
			sizes={sizes}
			className={`absolute inset-0 h-full w-full ${className}`}
			onError={() => setFailed(true)}
		/>
	);
}

export function StoryInlineImage({
	src,
	alt,
}: Pick<StoryImageProps, "src" | "alt">) {
	const [failed, setFailed] = useState(false);
	if (failed) return null;

	return (
		<Image
			src={src}
			alt={alt}
			width={1200}
			height={675}
			unoptimized
			className="rounded-lg"
			onError={() => setFailed(true)}
		/>
	);
}
