import { MdVerified } from "react-icons/md";

/** Marks a CookTale official account or a paid member, not an identity check. */
export default function VerifiedBadge({ verified }: { verified?: boolean }) {
	if (!verified) return null;
	return (
		<span
			role="img"
			aria-label="CookTale official account or paid member"
			title="CookTale official account or paid member"
			className="inline-flex shrink-0 align-middle text-[#006C5E] dark:text-[#4ADE80]"
		>
			<MdVerified aria-hidden="true" className="h-[1em] w-[1em]" />
		</span>
	);
}
