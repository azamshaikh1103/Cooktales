import { useCallback, useRef, useState } from "react";

interface ListItem {
	[key: string]: any;
}

export const useListManager = <T extends ListItem>(initialItem: T) => {
	const [list, setList] = useState<T[]>([initialItem]);
	const refs = useRef<Map<number, HTMLElement | HTMLTextAreaElement>>(
		new Map(),
	);

	const addItem = useCallback(
		(index: number) => {
			setList((prev) => {
				const newList = [...prev];
				newList.splice(index + 1, 0, initialItem);
				return newList;
			});

			setTimeout(() => {
				refs.current.get(index + 1)?.focus();
			}, 0);
		},
		[initialItem],
	);

	const removeItem = useCallback(
		(index: number) => {
			setList((prev) => {
				const newList = prev.filter((_, i) => i !== index);
				return newList.length === 0 ? [initialItem] : newList;
			});
		},
		[initialItem],
	);

	const updateItem = useCallback((index: number, updates: Partial<T>) => {
		setList((prev) => {
			const newList = [...prev];
			newList[index] = { ...newList[index], ...updates };
			return newList;
		});
	}, []);

	const setRef = useCallback(
		(index: number, el: HTMLElement | HTMLTextAreaElement | null) => {
			if (el) refs.current.set(index, el);
		},
		[],
	);

	return { list, setList, addItem, removeItem, updateItem, setRef, refs };
};
