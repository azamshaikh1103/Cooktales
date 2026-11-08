import Script from "next/script";

export default function JsonLd({ data }: { data: any }) {
	return (
		<Script
			id="json-ld"
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be inline; '<' is escaped below so data cannot close the script tag
			dangerouslySetInnerHTML={{
				__html: JSON.stringify(data).replace(/</g, "\\u003c"),
			}}
		/>
	);
}
