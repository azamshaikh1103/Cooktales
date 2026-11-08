"use client";

import { ChefHat, ImagePlus } from "lucide-react";
import { RichTextEditor, ToolButton } from "@/components/ui/RichTextEditor";

type DiscussionEditorProps = {
	value: string;
	onChange: (value: string) => void;
	onAttachImage: () => void;
	onAttachContent: () => void;
	onBlur?: () => void;
	maxLength?: number;
	placeholder?: string;
};

/** The discussion composer: the full rich editor plus image and recipe/story attach buttons. */
export function DiscussionEditor({
	value,
	onChange,
	onAttachImage,
	onAttachContent,
	onBlur,
	maxLength = 12000,
	placeholder = "Share your question, tip, or food story...",
}: DiscussionEditorProps) {
	return (
		<RichTextEditor
			value={value}
			onChange={onChange}
			onBlur={onBlur}
			variant="full"
			ariaLabel="Discussion details"
			maxLength={maxLength}
			placeholder={placeholder}
			leadingTools={
				<>
					<ToolButton label="Add image" onClick={onAttachImage}>
						<ImagePlus size={18} />
					</ToolButton>
					<ToolButton
						label="Attach a recipe or story"
						onClick={onAttachContent}
					>
						<ChefHat size={18} />
					</ToolButton>
				</>
			}
		/>
	);
}
