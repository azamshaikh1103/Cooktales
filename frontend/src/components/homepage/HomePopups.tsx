"use client";

import dynamic from "next/dynamic";

const WelcomePopup = dynamic(() => import("@/components/popUps/WelcomePopup"), {
	ssr: false,
});
export default function HomePopups() {
	return <WelcomePopup />;
}
