import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Frequently Asked Questions",
	description:
		"Answers about CookTale, recipes, creator earnings, accounts, and support.",
	alternates: { canonical: "/faq" },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
	return children;
}
