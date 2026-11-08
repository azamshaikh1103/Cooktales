import type { Metadata } from "next";

// Moderator tools: never indexed.
export const metadata: Metadata = {
	title: "Moderation",
	robots: { index: false, follow: false },
};

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
