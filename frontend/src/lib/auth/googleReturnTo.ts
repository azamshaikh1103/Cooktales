const GOOGLE_RETURN_TO_KEY = "cooktale.google-return-to";

function isSafeReturnTo(value: string | null): value is string {
	return Boolean(
		value?.startsWith("/") &&
		!value.startsWith("//") &&
		!value.startsWith("/auth"),
	);
}

export function rememberGoogleReturnTo() {
	try {
		const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

		if (isSafeReturnTo(currentPath)) {
			window.sessionStorage.setItem(GOOGLE_RETURN_TO_KEY, currentPath);
		}
	} catch {
		// Sign-in still works when browser storage is unavailable.
	}
}

export function consumeGoogleReturnTo() {
	try {
		const returnTo = window.sessionStorage.getItem(GOOGLE_RETURN_TO_KEY);
		window.sessionStorage.removeItem(GOOGLE_RETURN_TO_KEY);

		return isSafeReturnTo(returnTo) ? returnTo : "/";
	} catch {
		return "/";
	}
}
