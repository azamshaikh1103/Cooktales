import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

interface PrimaryActionLinkProps extends LinkProps {
	children: ReactNode;
	className?: string;
	variant?: "primary" | "secondary";
}

export function PrimaryActionLink({
	children,
	className = "",
	variant = "primary",
	...props
}: PrimaryActionLinkProps) {
	const variantClassName =
		variant === "secondary"
			? "bg-[#007d6d] text-white hover:bg-[#006c5e] dark:bg-[#245149] dark:text-white dark:hover:bg-[#2d6258]"
			: "bg-[#006c5e] text-white hover:bg-[#005a4f] dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#73e99d]";

	return (
		<Link
			{...props}
			className={`inline-flex w-fit items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006c5e] focus-visible:ring-offset-2 dark:focus-visible:ring-[#4ade80] dark:focus-visible:ring-offset-[#0d1f1c] ${variantClassName} ${className}`}
		>
			{children}
		</Link>
	);
}
