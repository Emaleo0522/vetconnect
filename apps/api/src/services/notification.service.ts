import { db } from "../db/client.js";
import { notifications } from "../db/schema/notifications.js";
import { pushTokens } from "../db/schema/notifications.js";
import { eq, and, desc, sql, gte } from "drizzle-orm";

// ---------------------------------------------------------------------------
// createNotification — inserts a notification for a user
// ---------------------------------------------------------------------------

export async function createNotification(input: {
  userId: string;
  type: "vaccine_reminder" | "appointment" | "general";
  title: string;
  body: string;
  data?: Record<string, unknown>;
}) {
  const id = crypto.randomUUID();

  const [notification] = await db
    .insert(notifications)
    .values({
      id,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
    })
    .returning();

  return notification;
}

// ---------------------------------------------------------------------------
// listNotifications — paginated, unread first, then by date desc
// ---------------------------------------------------------------------------

export async function listNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const results = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.isRead, desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(eq(notifications.userId, userId));

  const total = countResult[0]?.count ?? 0;

  return {
    items: results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ---------------------------------------------------------------------------
// markAsRead — sets isRead = true
// ---------------------------------------------------------------------------

export async function markAsRead(notificationId: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return updated ?? null;
}

// ---------------------------------------------------------------------------
// getUnreadCount — count of unread notifications for a user
// ---------------------------------------------------------------------------

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    );

  return result[0]?.count ?? 0;
}

// ---------------------------------------------------------------------------
// hasRecentAlert — checks if a vaccine_reminder notification exists
// for a specific vaccination within the last N days (de-duplication)
// ---------------------------------------------------------------------------

export async function hasRecentAlert(
  userId: string,
  vaccinationId: string,
  withinDays: number = 7
): Promise<boolean> {
  const since = new Date(
    Date.now() - withinDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "vaccine_reminder"),
        gte(notifications.createdAt, new Date(since)),
        sql`${notifications.data}->>'vaccinationId' = ${vaccinationId}`
      )
    );

  return (result[0]?.count ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// getUserPushTokens — get all push tokens for a user
// ---------------------------------------------------------------------------

export async function getUserPushTokens(userId: string) {
  return db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
}
