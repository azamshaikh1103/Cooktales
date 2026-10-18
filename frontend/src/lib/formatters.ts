export const formatters = {
	rating: (rating: number | null | undefined, decimals = 1): string => {
		if (!rating) return "0" + ".".padEnd(decimals + 1, "0");
		return rating.toFixed(decimals);
	},
};
