import type { Metadata } from "next";
import NotificationCenter from "./NotificationCenter";

export const metadata: Metadata = {
	title: "Notifications",
	description: "Updates from your CookTale kitchen.",
	robots: { index: false, follow: false },
};

export default function NotificationsPage() {
	return <NotificationCenter />;
}
