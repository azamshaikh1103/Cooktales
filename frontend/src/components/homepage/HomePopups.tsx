"use client";

import dynamic from "next/dynamic";

const WelcomePopup = dynamic(() => import("@/components/popUps/WelcomePopup"), {
	ssr: false,
});
const PremiumWelcome = dynamic(
	() => import("@/components/popUps/PremiumWelcome"),
	{
		ssr: false,
	},
);

export default function HomePopups() {
	return (
		<>
			<WelcomePopup />
			<PremiumWelcome />
		</>
	);
}
