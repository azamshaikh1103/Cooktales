import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryActionButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
}

export function PrimaryActionButton({
	children,
	className = "",
	...props
}: PrimaryActionButtonProps) {
	return (
		<button
			{...props}
			className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#006c5e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#005a4f] focus-visible:ring-2 focus-visible:ring-[#006c5e] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#4ade80] dark:text-[#092019] dark:hover:bg-[#73e99d] dark:focus-visible:ring-[#4ade80] dark:focus-visible:ring-offset-[#0d1f1c] ${className}`}
		>
			{children}
		</button>
	);
}
