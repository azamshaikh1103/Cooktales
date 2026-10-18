"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { FaCheck, FaUserPlus } from "react-icons/fa";
import { toast } from "sonner";
import { profileClient } from "@/lib/api/profileClient";
import { useAuth } from "@/lib/auth/AuthContext";

interface FollowButtonProps {
	targetUserId: string;
	initialIsFollowing: boolean;
	variant?: "default" | "compact" | "icon";
	className?: string;
	onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
	targetUserId,
	initialIsFollowing,
	variant = "default",
	className = "",
	onFollowChange,
}: FollowButtonProps) {
	const { status, user } = useAuth();
	const router = useRouter();
	const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
	const [isLoading, setIsLoading] = useState(false);

	const handleFollowToggle = async (e: React.MouseEvent) => {
		e.preventDefault(); // Prevent parent link clicks
		e.stopPropagation();

		// 1. Auth Check
		if (status !== "authenticated") {
			toast.error("Please login to follow chefs!");
			router.push("/auth");
			return;
		}

		// 2. Optimistic Update (Instant feedback)
		const previousState = isFollowing;
		const newState = !isFollowing;
		setIsFollowing(newState);
		setIsLoading(true);

		try {
			if (newState) {
				await profileClient.follow(targetUserId);
			} else {
				await profileClient.unfollow(targetUserId);
			}

			// 4. Success handling
			onFollowChange?.(newState);
			if (newState) {
				toast.success("You are now following this chef!");
			} else {
				toast.message("Unfollowed successfully.");
			}

			router.refresh();
		} catch (error: unknown) {
			console.error("Follow error:", error);
			// 5. Revert on failure
			setIsFollowing(previousState);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// --- STYLES CONFIG ---
	const baseStyles =
		"relative flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed";

	// Compact: Used in headers or tight spaces
	const compactStyles = `rounded-full px-5 py-2 text-sm font-bold shadow-sm cursor-pointer ${
		isFollowing
			? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-red-500" // Hover turns red for "Unfollow" hint
			: "bg-[#006C5E] text-white hover:bg-[#005a4e] shadow-[#006C5E]/20"
	}`;

	// Default: Used in cards or sidebars
	const defaultStyles = `w-full rounded-xl py-3 font-bold text-sm tracking-wide cursor-pointer ${
		isFollowing
			? "bg-gray-100 text-gray-600 hover:bg-gray-200"
			: "bg-[#006C5E] text-white hover:bg-[#005349] shadow-md shadow-[#006C5E]/20"
	}`;

	const selectedStyle = variant === "compact" ? compactStyles : defaultStyles;

	if (user?.id === targetUserId) return null;

	return (
		<button
			type="button"
			onClick={handleFollowToggle}
			disabled={isLoading}
			className={`${baseStyles} ${selectedStyle} ${className}`}
			aria-label={isFollowing ? "Unfollow" : "Follow"}
		>
			{isLoading && (
				<div className="w-auto px-10 absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit rounded-xl cursor-not-allowed">
					<CgSpinner className="animate-spin text-lg" />
				</div>
			)}

			<span
				className={`w-auto px-10 flex items-center gap-2 ${
					isLoading ? "opacity-0" : "opacity-100"
				}`}
			>
				{isFollowing ? (
					<>
						<FaCheck className="text-xs" />
						<span>Following</span>
					</>
				) : (
					<>
						<FaUserPlus className="text-xs" />
						<span>Follow</span>
					</>
				)}
			</span>
		</button>
	);
}
