import { ImageResponse } from "next/og";

export const runtime = "edge";

export default async function Image({ params }: { params: { slug: string } }) {
	const username = params.slug;

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#0d1f1c",
				backgroundImage:
					"radial-gradient(circle at 25px 25px, #ffffff 2%, transparent 0%), radial-gradient(circle at 75px 75px, #ffffff 2%, transparent 0%)",
				backgroundSize: "100px 100px",
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "150px",
					height: "150px",
					borderRadius: "50%",
					background: "#006C5E",
					color: "white",
					fontSize: "80px",
					fontWeight: "bold",
					marginBottom: "40px",
					boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
				}}
			>
				{username.toUpperCase()}
			</div>

			<div
				style={{
					fontSize: 60,
					fontWeight: 900,
					color: "white",
					letterSpacing: "-2px",
				}}
			>
				{username}
			</div>

			<div
				style={{
					fontSize: 30,
					color: "#4ADE80",
					marginTop: 20,
					fontWeight: "bold",
					letterSpacing: "4px",
				}}
			>
				COOKTALE CHEF
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}
