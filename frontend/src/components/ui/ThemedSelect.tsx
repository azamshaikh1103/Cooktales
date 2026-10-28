"use client";

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

interface ThemedSelectProps {
	label: string;
	name: string;
	value: string;
	options: readonly string[];
	onChange: (value: string) => void;
}

export function ThemedSelect({
	label,
	name,
	value,
	options,
	onChange,
}: ThemedSelectProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className="relative rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-3 dark:border-white/10 dark:bg-[#0d1f1c]">
			<input type="hidden" name={name} value={value} />
			<span className="mb-2 block text-sm font-bold">{label}</span>
			<button
				type="button"
				onClick={() => setOpen((current) => !current)}
				onBlur={() => setOpen(false)}
				onKeyDown={(event) => {
					if (event.key === "Escape") setOpen(false);
				}}
				aria-expanded={open}
				aria-haspopup="listbox"
				className="flex w-full cursor-pointer items-center justify-between gap-3 text-left text-sm text-gray-900 outline-none dark:text-white"
			>
				<span>{value}</span>
				<FaChevronDown
					className={`shrink-0 text-xs text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>
			{open && (
				<div
					role="listbox"
					aria-label={label}
					className="absolute top-[calc(100%+8px)] right-0 left-0 z-30 max-h-64 overflow-auto rounded-2xl border border-gray-100 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0d1f1c]"
				>
					{options.map((option) => (
						<button
							key={option}
							type="button"
							role="option"
							aria-selected={value === option}
							onMouseDown={(event) => event.preventDefault()}
							onClick={() => {
								onChange(option);
								setOpen(false);
							}}
							className={`w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors ${value === option ? "bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80]" : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"}`}
						>
							{option}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
