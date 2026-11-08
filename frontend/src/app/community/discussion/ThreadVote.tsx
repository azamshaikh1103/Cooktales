"use client";

import { communityClient } from "@/lib/api/communityClient";
import { Upvote } from "./Upvote";

/** Client wrapper so the (server-rendered) thread page can pass plain props only. */
export function ThreadVote({
	discussionId,
	initialCount,
}: {
	discussionId: string;
	initialCount: number;
}) {
	return (
		<Upvote
			variant="thread"
			label="thread"
			initialCount={initialCount}
			like={() => communityClient.like(discussionId)}
			unlike={() => communityClient.unlike(discussionId)}
			loadState={() => communityClient.discussionLikeState(discussionId)}
		/>
	);
}
