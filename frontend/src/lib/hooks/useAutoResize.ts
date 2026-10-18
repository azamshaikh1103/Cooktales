import { useCallback } from "react";

export const useAutoResize = () => {
	return useCallback((textarea: HTMLTextAreaElement | null) => {
		if (!textarea) return;
		textarea.style.height = "auto";
		textarea.style.height = `${textarea.scrollHeight}px`;
	}, []);
};
