import type { ReactNode } from "react";

const inlinePattern =
	/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

function inlineNodes(value: string): ReactNode[] {
	return value.split(inlinePattern).map((part, index) => {
		const key = `${part}-${index}`;
		if (part.startsWith("**") && part.endsWith("**"))
			return <strong key={key}>{part.slice(2, -2)}</strong>;
		if (part.startsWith("_") && part.endsWith("_"))
			return <em key={key}>{part.slice(1, -1)}</em>;
		if (part.startsWith("`") && part.endsWith("`"))
			return (
				<code
					key={key}
					className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-800 dark:bg-white/10 dark:text-slate-100"
				>
					{part.slice(1, -1)}
				</code>
			);
		const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
		if (link)
			return (
				<a
					key={key}
					href={link[2]}
					target="_blank"
					rel="noreferrer"
					className="font-medium text-[#006c5e] underline decoration-[#006c5e]/30 underline-offset-4 hover:decoration-[#006c5e] dark:text-[#4ade80] dark:decoration-[#4ade80]/30"
				>
					{link[1]}
				</a>
			);
		return part;
	});
}

export function StoryRichText({ value }: { value: string }) {
	const lines = value.split("\n").filter(Boolean);
	const unordered =
		lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line));
	const ordered =
		lines.length > 0 && lines.every((line) => /^\d+[.)]\s+/.test(line));
	if (unordered)
		return (
			<ul className="list-disc space-y-2 pl-6">
				{lines.map((line) => (
					<li key={line}>{inlineNodes(line.replace(/^[-*]\s+/, ""))}</li>
				))}
			</ul>
		);
	if (ordered)
		return (
			<ol className="list-decimal space-y-2 pl-6">
				{lines.map((line) => (
					<li key={line}>{inlineNodes(line.replace(/^\d+[.)]\s+/, ""))}</li>
				))}
			</ol>
		);
	return (
		<>
			{value.split("\n").map((line, index) => (
				<span key={line}>
					{inlineNodes(line)}
					{index < value.split("\n").length - 1 && <br />}
				</span>
			))}
		</>
	);
}
