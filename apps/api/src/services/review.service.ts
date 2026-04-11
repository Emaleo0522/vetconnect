import { db } from "../db/client.js";
import { users } from "../db/schema/auth.js";
import { veterinaryReviews } from "../db/schema/reviews.js";
import { veterinarianProfiles } from "../db/schema/profiles.js";
import { eq, and, sql } from "drizzle-orm";
import type { CreateReviewInput, UpdateReviewInput } from "@vetconnect/shared";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewItem {
  id: string;
  vetId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerImage: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginatedReviews {
  items: ReviewItem[];
  nextCursor: string | null;
  avgRating: number | null;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// createReview — one review per owner per vet
// ---------------------------------------------------------------------------

export async function createReview(
  vetProfileId: string,
  reviewerId: string,
  input: CreateReviewInput
): Promise<ReviewItem> {
  // Resolve vetId (user_id of the vet) from the profile id
  const vetProfile = await db
    .select({ userId: veterinarianProfiles.userId })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.id, vetProfileId))
    .limit(1);

  if (vetProfile.length === 0) {
    throw new ReviewError("VET_NOT_FOUND", "Veterinarian not found");
  }

  const vetUserId = vetProfile[0].userId;

  // Prevent self-review
  if (vetUserId === reviewerId) {
    throw new ReviewError("SELF_REVIEW", "Cannot review yourself");
  }

  // Check for existing review (unique constraint will catch this too, but better UX)
  const existing = await db
    .select({ id: veterinaryReviews.id })
    .from(veterinaryReviews)
    .where(
      and(
        eq(veterinaryReviews.vetId, vetUserId),
        eq(veterinaryReviews.reviewerId, reviewerId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ReviewError(
      "ALREADY_REVIEWED",
      "You have already reviewed this veterinarian"
    );
  }

  const now = new Date();
  const id = nanoid();

  await db.insert(veterinaryReviews).values({
    id,
    vetId: vetUserId,
    reviewerId,
    rating: input.rating,
    comment: input.comment,
    createdAt: now,
    updatedAt: now,
  });

  // Fetch the created review with reviewer info
  return getReviewById(id);
}

// ---------------------------------------------------------------------------
// getReviewsByVet — paginated reviews for a vet
// ---------------------------------------------------------------------------

export async function getReviewsByVet(
  vetProfileId: string,
  cursor?: string,
  limit: number = 20
): Promise<PaginatedReviews> {
  // Resolve vet user id from profile id
  const vetProfile = await db
    .select({ userId: veterinarianProfiles.userId })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.id, vetProfileId))
    .limit(1);

  if (vetProfile.length === 0) {
    throw new ReviewError("VET_NOT_FOUND", "Veterinarian not found");
  }

  const vetUserId = vetProfile[0].userId;

  // Get aggregate stats
  const statsRows = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${veterinaryReviews.rating})::float8, 0)`,
      totalCount: sql<number>`COUNT(*)::int`,
    })
    .from(veterinaryReviews)
    .where(eq(veterinaryReviews.vetId, vetUserId));

  const stats = statsRows[0];
  const avgRating =
    stats.totalCount > 0 ? Math.round(stats.avgRating * 10) / 10 : null;

  // Build conditions
  const conditions = [eq(veterinaryReviews.vetId, vetUserId)];
  if (cursor) {
    conditions.push(sql`${veterinaryReviews.id} < ${cursor}`);
  }

  const rows = await db
    .select({
      id: veterinaryReviews.id,
      vetId: veterinaryReviews.vetId,
      reviewerId: veterinaryReviews.reviewerId,
      reviewerName: users.name,
      reviewerImage: users.image,
      rating: veterinaryReviews.rating,
      comment: veterinaryReviews.comment,
      createdAt: veterinaryReviews.createdAt,
      updatedAt: veterinaryReviews.updatedAt,
    })
    .from(veterinaryReviews)
    .innerJoin(users, eq(users.id, veterinaryReviews.reviewerId))
    .where(and(...conditions))
    .orderBy(sql`${veterinaryReviews.createdAt} DESC`)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: items.map((r) => ({
      ...r,
      reviewerImage: r.reviewerImage ?? null,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
    avgRating,
    totalCount: stats.totalCount,
  };
}

// ---------------------------------------------------------------------------
// updateReview — only the author can edit
// ---------------------------------------------------------------------------

export async function updateReview(
  reviewId: string,
  userId: string,
  input: UpdateReviewInput
): Promise<ReviewItem> {
  const review = await db
    .select({
      id: veterinaryReviews.id,
      reviewerId: veterinaryReviews.reviewerId,
    })
    .from(veterinaryReviews)
    .where(eq(veterinaryReviews.id, reviewId))
    .limit(1);

  if (review.length === 0) {
    throw new ReviewError("REVIEW_NOT_FOUND", "Review not found");
  }

  if (review[0].reviewerId !== userId) {
    throw new ReviewError("FORBIDDEN", "You can only edit your own reviews");
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.rating !== undefined) updateData.rating = input.rating;
  if (input.comment !== undefined) updateData.comment = input.comment;

  await db
    .update(veterinaryReviews)
    .set(updateData)
    .where(eq(veterinaryReviews.id, reviewId));

  return getReviewById(reviewId);
}

// ---------------------------------------------------------------------------
// deleteReview — author or admin
// ---------------------------------------------------------------------------

export async function deleteReview(
  reviewId: string,
  userId: string,
  userRole: string
): Promise<void> {
  const review = await db
    .select({
      id: veterinaryReviews.id,
      reviewerId: veterinaryReviews.reviewerId,
    })
    .from(veterinaryReviews)
    .where(eq(veterinaryReviews.id, reviewId))
    .limit(1);

  if (review.length === 0) {
    throw new ReviewError("REVIEW_NOT_FOUND", "Review not found");
  }

  // Only the author or an admin can delete
  if (review[0].reviewerId !== userId && userRole !== "admin") {
    throw new ReviewError("FORBIDDEN", "You can only delete your own reviews");
  }

  await db
    .delete(veterinaryReviews)
    .where(eq(veterinaryReviews.id, reviewId));
}

// ---------------------------------------------------------------------------
// getReviewById — internal helper
// ---------------------------------------------------------------------------

async function getReviewById(reviewId: string): Promise<ReviewItem> {
  const rows = await db
    .select({
      id: veterinaryReviews.id,
      vetId: veterinaryReviews.vetId,
      reviewerId: veterinaryReviews.reviewerId,
      reviewerName: users.name,
      reviewerImage: users.image,
      rating: veterinaryReviews.rating,
      comment: veterinaryReviews.comment,
      createdAt: veterinaryReviews.createdAt,
      updatedAt: veterinaryReviews.updatedAt,
    })
    .from(veterinaryReviews)
    .innerJoin(users, eq(users.id, veterinaryReviews.reviewerId))
    .where(eq(veterinaryReviews.id, reviewId))
    .limit(1);

  if (rows.length === 0) {
    throw new ReviewError("REVIEW_NOT_FOUND", "Review not found");
  }

  return {
    ...rows[0],
    reviewerImage: rows[0].reviewerImage ?? null,
  };
}

// ---------------------------------------------------------------------------
// ReviewError — typed error for route handlers
// ---------------------------------------------------------------------------

export class ReviewError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "ReviewError";
  }
}
