"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { tags, userInterests, users, postTags } from "~/server/db/schema/tables";
import { getSession } from "~/server/auth";
import { INTEREST_WEIGHTS } from "~/lib/recommendations/constants";
import { revalidatePath } from "next/cache";

/**
 * Save initial interests during onboarding
 */
export async function saveOnboardingInterests(tagIds: string[]) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db.transaction(async (tx) => {
    if (tagIds.length > 0) {
      await tx
        .insert(userInterests)
        .values(
          tagIds.map((tagId) => ({
            userProfileId: session.userProfileId,
            tagId,
            weight: INTEREST_WEIGHTS.INITIAL_SELECTION.toString(),
          }))
        )
        .onDuplicateKeyUpdate({
          set: {
            weight: sql`${userInterests.weight} + ${INTEREST_WEIGHTS.INITIAL_SELECTION}`,
          },
        });
    }

    await tx
      .update(users)
      .set({ onboardingCompleted: true })
      .where(eq(users.profileId, session.userProfileId));
  });

  revalidatePath("/");
}

/**
 * Skip onboarding without selecting interests
 */
export async function skipOnboarding() {
  const session = await getSession({});
  if (!session?.userProfileId) {
    throw new Error("Not authenticated");
  }

  await db
    .update(users)
    .set({ onboardingCompleted: true })
    .where(eq(users.profileId, session.userProfileId));

  revalidatePath("/");
}

/**
 * Update interest weights based on voting behavior
 * Call this after a user votes on a post
 * 
 * @param postId - The post being voted on
 * @param isUpvote - true for upvote, false for downvote
 * @param previousVoteWasUpvote - null if no previous vote, true/false for previous vote type
 */
export async function updateInterestsFromVote(
  postId: string,
  isUpvote: boolean,
  previousVoteWasUpvote: boolean | null
) {
  const session = await getSession({});
  if (!session?.userProfileId) {
    return;
  }

  // Get all tags for this post
  const postTagsResult = await db
    .select({ tagId: postTags.tagId })
    .from(postTags)
    .where(eq(postTags.postId, postId));

  if (postTagsResult.length === 0) {
    return; // Post has no tags, nothing to update
  }

  // Calculate weight delta
  let weightDelta = 0;
  
  if (previousVoteWasUpvote === null) {
    // New vote
    weightDelta = isUpvote ? INTEREST_WEIGHTS.UPVOTE : INTEREST_WEIGHTS.DOWNVOTE;
  } else if (previousVoteWasUpvote !== isUpvote) {
    // Changed vote (upvote to downvote or vice versa)
    weightDelta = isUpvote 
      ? INTEREST_WEIGHTS.UPVOTE - INTEREST_WEIGHTS.DOWNVOTE  // +1.0
      : INTEREST_WEIGHTS.DOWNVOTE - INTEREST_WEIGHTS.UPVOTE; // -1.0
  } else {
    // Same vote, no change
    return;
  }

  // Update weights for all tags on this post
  await db.transaction(async (tx) => {
    for (const { tagId } of postTagsResult) {
      await tx
        .insert(userInterests)
        .values({
          userProfileId: session.userProfileId,
          tagId,
          weight: Math.max(INTEREST_WEIGHTS.MIN_WEIGHT, weightDelta).toString(),
        })
        .onDuplicateKeyUpdate({
          set: {
            weight: sql`GREATEST(${INTEREST_WEIGHTS.MIN_WEIGHT}, LEAST(${INTEREST_WEIGHTS.MAX_WEIGHT}, ${userInterests.weight} + ${weightDelta}))`,
          },
        });
    }
  });
}

/**
 * Get user's current interests with weights
 */
export async function getUserInterests() {
  const session = await getSession({});
  if (!session?.userProfileId) {
    return [];
  }

  return db
    .select({
      tagId: userInterests.tagId,
      tagName: tags.name,
      weight: userInterests.weight,
    })
    .from(userInterests)
    .innerJoin(tags, eq(tags.id, userInterests.tagId))
    .where(eq(userInterests.userProfileId, session.userProfileId))
    .orderBy(sql`${userInterests.weight} DESC`);
}