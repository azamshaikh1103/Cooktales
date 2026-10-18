import Navbar from "@/components/Navbar";
import StoryFooter from "@/components/stories/StoryFooter";

export default function StoriesLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex min-h-screen flex-col bg-white dark:bg-[#0d1f1c]">
			<Navbar />
			<div className="flex-1">{children}</div>
			<StoryFooter />
		</div>
	);
}
