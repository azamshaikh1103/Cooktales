"use client";

import { Check, ChevronDown, Hash } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type TopicSelectProps = {
	value: string;
	options: readonly string[];
	onChange: (value: string) => void;
};

export function TopicSelect({ value, options, onChange }: TopicSelectProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
	const listId = useId();

	useEffect(() => {
		if (!open) return;
		const close = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener("pointerdown", close);
		optionRefs.current[Math.max(options.indexOf(value), 0)]?.focus();
		return () => document.removeEventListener("pointerdown", close);
	}, [open, options, value]);

	const focusOption = (index: number) => {
		const count = options.length;
		optionRefs.current[(index + count) % count]?.focus();
	};

	const choose = (option: string) => {
		onChange(option);
		setOpen(false);
		triggerRef.current?.focus();
	};

	return (
		<div ref={rootRef} className="relative w-fit">
			<button
				ref={triggerRef}
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				onClick={() => setOpen((current) => !current)}
				onKeyDown={(event) => {
					if (event.key === "ArrowDown") {
						event.preventDefault();
						setOpen(true);
					}
				}}
				className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-300 bg-white py-2 pr-3 pl-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006C5E] dark:border-white/15 dark:bg-white/[0.03] dark:text-white dark:hover:bg-white/10 dark:focus-visible:outline-[#4ADE80]"
			>
				<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]">
					<Hash size={14} strokeWidth={2.5} />
				</span>
				{value}
				<ChevronDown
					size={16}
					className={`text-gray-500 transition-transform dark:text-gray-400 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div
					id={listId}
					role="listbox"
					aria-label="Choose a topic"
					className="absolute z-30 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#152a26]"
				>
					{options.map((option, index) => (
						<button
							key={option}
							ref={(node) => {
								optionRefs.current[index] = node;
							}}
							type="button"
							role="option"
							aria-selected={option === value}
							onClick={() => choose(option)}
							onKeyDown={(event) => {
								if (event.key === "ArrowDown") {
									event.preventDefault();
									focusOption(index + 1);
								} else if (event.key === "ArrowUp") {
									event.preventDefault();
									focusOption(index - 1);
								} else if (event.key === "Escape") {
									event.preventDefault();
									setOpen(false);
									triggerRef.current?.focus();
								}
							}}
							className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-none ${
								option === value
									? "bg-[#006C5E]/10 text-[#006C5E] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80]"
									: "text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10 dark:focus-visible:bg-white/10"
							}`}
						>
							{option}
							{option === value && <Check size={16} />}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
