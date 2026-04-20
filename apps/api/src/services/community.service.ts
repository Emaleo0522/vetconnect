import { db } from "../db/client.js";
import { posts, postLikes, postReports, postHides, comments } from "../db/schema/community.js";
import { users } from "../db/schema/auth.js";
import { eq, and, desc, sql, not, inArray, lt, or } from "drizzle-orm";

// ---------------------------------------------------------------------------
// sanitize — basic XSS prevention (strip HTML tags server-side)
// ---------------------------------------------------------------------------

function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip all HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePostInput {
  content: string;
  photoUrl?: string;
  visibility?: "public" | "followers";
}

export interface CreateCommentInput {
  content: string;
  parentCommentId?: string;
}

export interface ListFeedQuery {
  filter?: "all" | "vets" | "owners";
  cursor?: string;
  limit?: number;
  userId: string;
}

// ---------------------------------------------------------------------------
// listFeed — cursor-based pagination, excludes hidden posts
// ---------------------------------------------------------------------------

export async function listFeed(query: ListFeedQuery) {
  const limit = Math.min(query.limit ?? 20, 50);
  const { cursor, userId } = query;

  // Get IDs of posts the user has hidden
  const hiddenRows = await db
    .select({ postId: postHides.postId })
    .from(postHides)
    .where(eq(postHides.userId, userId));
  const hiddenPostIds = hiddenRows.map((r) => r.postId);

  const conditions: any[] = [eq(posts.visibility, "public")];

  if (hiddenPostIds.length > 0) {
    conditions.push(not(inArray(posts.id, hiddenPostIds)));
  }

  if (cursor) {
    // cursor = createdAt ISO string of last fetched post
    const cursorDate = new Date(cursor);
    if (!isNaN(cursorDate.getTime())) {
      conditions.push(lt(posts.createdAt, cursorDate));
    }
  }

  // Filter by role if requested
  if (query.filter === "vets" || query.filter === "owners") {
    // Join users to filter by role — done in subquery approach below
    const targetRole = query.filter === "vets" ? "vet" : "owner";
    conditions.push(
      inArray(
        posts.authorId,
        db.select({ id: users.id }).from(users).where(eq(users.role, targetRole))
      )
    );
  }

  const rows = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      content: posts.content,
      photoUrl: posts.photoUrl,
      visibility: posts.visibility,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt,
      authorName: users.name,
      authorImage: users.image,
      authorRole: users.role,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit + 1); // fetch +1 to determine if there's a next page

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Check which posts the current user has liked
  const postIds = items.map((p) => p.id);
  let likedPostIds: string[] = [];

  if (postIds.length > 0) {
    const liked = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, userId),
          inArray(postLikes.postId, postIds)
        )
      );
    likedPostIds = liked.map((l) => l.postId);
  }

  const itemsWithLiked = items.map((p) => ({
    ...p,
    likedByMe: likedPostIds.includes(p.id),
  }));

  const nextCursor =
    hasMore && items.length > 0
      ? items[items.length - 1].createdAt?.toISOString()
      : null;

  return { items: itemsWithLiked, nextCursor };
}

// ---------------------------------------------------------------------------
// getPostById
// ---------------------------------------------------------------------------

export async function getPostById(id: string, userId: string) {
  const rows = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      content: posts.content,
      photoUrl: posts.photoUrl,
      visibility: posts.visibility,
      likesCount: posts.likesCount,
      commentsCount: posts.commentsCount,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      authorName: users.name,
      authorImage: users.image,
      authorRole: users.role,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const post = rows[0];

  // Check if user liked it
  const liked = await db
    .select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.postId, id), eq(postLikes.userId, userId)))
    .limit(1);

  return { ...post, likedByMe: liked.length > 0 };
}

// ---------------------------------------------------------------------------
// createPost
// ---------------------------------------------------------------------------

export async function createPost(authorId: string, input: CreatePostInput) {
  const sanitized = sanitizeText(input.content);

  if (!sanitized) {
    return { error: "EMPTY_CONTENT" };
  }

  const id = crypto.randomUUID();
  const [post] = await db
    .insert(posts)
    .values({
      id,
      authorId,
      content: sanitized,
      photoUrl: input.photoUrl ?? null,
      visibility: input.visibility ?? "public",
      likesCount: 0,
      commentsCount: 0,
    })
    .returning();

  return { data: post };
}

// ---------------------------------------------------------------------------
// toggleLike — idempotent like/unlike
// ---------------------------------------------------------------------------

export async function toggleLike(postId: string, userId: string) {
  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) return { error: "NOT_FOUND" };

  const existing = await db
    .select({ id: postLikes.id })
    .from(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));

    await db
      .update(posts)
      .set({ likesCount: sql`greatest(0, ${posts.likesCount} - 1)` })
      .where(eq(posts.id, postId));

    return { data: { liked: false } };
  } else {
    // Like
    await db.insert(postLikes).values({
      id: crypto.randomUUID(),
      postId,
      userId,
    });

    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, postId));

    return { data: { liked: true } };
  }
}

// ---------------------------------------------------------------------------
// reportPost
// ---------------------------------------------------------------------------

export async function reportPost(
  postId: string,
  reporterId: string,
  reason: "spam" | "inappropriate" | "other"
) {
  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) return { error: "NOT_FOUND" };

  // Check if already reported by this user
  const existing = await db
    .select({ id: postReports.id })
    .from(postReports)
    .where(
      and(
        eq(postReports.postId, postId),
        eq(postReports.reporterId, reporterId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { data: existing[0], already: true };
  }

  const [report] = await db
    .insert(postReports)
    .values({
      id: crypto.randomUUID(),
      postId,
      reporterId,
      reason,
    })
    .returning();

  return { data: report };
}

// ---------------------------------------------------------------------------
// hidePost — personal hide
// ---------------------------------------------------------------------------

export async function hidePost(postId: string, userId: string) {
  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) return { error: "NOT_FOUND" };

  const existing = await db
    .select({ id: postHides.id })
    .from(postHides)
    .where(and(eq(postHides.postId, postId), eq(postHides.userId, userId)))
    .limit(1);

  if (existing.length > 0) return { data: existing[0], already: true };

  const [hide] = await db
    .insert(postHides)
    .values({ id: crypto.randomUUID(), postId, userId })
    .returning();

  return { data: hide };
}

// ---------------------------------------------------------------------------
// listComments
// ---------------------------------------------------------------------------

export async function listComments(postId: string) {
  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) return null;

  return db
    .select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      content: comments.content,
      parentCommentId: comments.parentCommentId,
      createdAt: comments.createdAt,
      authorName: users.name,
      authorImage: users.image,
      authorRole: users.role,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt);
}

// ---------------------------------------------------------------------------
// createComment
// ---------------------------------------------------------------------------

export async function createComment(
  postId: string,
  authorId: string,
  input: CreateCommentInput
) {
  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (post.length === 0) return { error: "POST_NOT_FOUND" };

  // Validate parent comment if provided
  if (input.parentCommentId) {
    const parent = await db
      .select({ id: comments.id })
      .from(comments)
      .where(
        and(
          eq(comments.id, input.parentCommentId),
          eq(comments.postId, postId)
        )
      )
      .limit(1);

    if (parent.length === 0) return { error: "PARENT_COMMENT_NOT_FOUND" };
  }

  const sanitized = sanitizeText(input.content);
  if (!sanitized) return { error: "EMPTY_CONTENT" };

  const id = crypto.randomUUID();
  const [comment] = await db
    .insert(comments)
    .values({
      id,
      postId,
      authorId,
      content: sanitized,
      parentCommentId: input.parentCommentId ?? null,
    })
    .returning();

  // Increment comment count
  await db
    .update(posts)
    .set({ commentsCount: sql`${posts.commentsCount} + 1` })
    .where(eq(posts.id, postId));

  return { data: comment };
}
