import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function StoriesLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<div className="flex min-h-screen flex-col bg-white dark:bg-[#0d1f1c]">
			<Navbar />
			<div className="flex-1">{children}</div>
			<Footer />
		</div>
	);
}
