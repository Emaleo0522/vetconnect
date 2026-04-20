import { db } from "../db/client.js";
import { notifications, notificationPreferences } from "../db/schema/notifications.js";
import { pushTokens } from "../db/schema/notifications.js";
import { eq, and, desc, sql, gte, not } from "drizzle-orm";

// ---------------------------------------------------------------------------
// createNotification — inserts a notification for a user
// ---------------------------------------------------------------------------

export async function createNotification(input: {
  userId: string;
  type: "vaccine_reminder" | "appointment" | "lost_pet" | "sighting" | "community" | "general";
  title: string;
  body: string;
  data?: Record<string, unknown>;
  link?: string;
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
      link: input.link ?? null,
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
  limit: number = 20,
  unreadOnly: boolean = false
) {
  const offset = (page - 1) * limit;

  const conditions = [
    eq(notifications.userId, userId),
    eq(notifications.isArchived, false),
  ];

  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const whereClause = and(...conditions);

  const results = await db
    .select()
    .from(notifications)
    .where(whereClause)
    .orderBy(notifications.isRead, desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(whereClause);

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

// ---------------------------------------------------------------------------
// markAllRead — marks all unread notifications as read for a user
// ---------------------------------------------------------------------------

export async function markAllRead(userId: string): Promise<number> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      )
    )
    .returning({ id: notifications.id });

  return result.length;
}

// ---------------------------------------------------------------------------
// archiveNotification — sets isArchived = true
// ---------------------------------------------------------------------------

export async function archiveNotification(id: string, userId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ isArchived: true })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      )
    )
    .returning();

  return updated ?? null;
}

// ---------------------------------------------------------------------------
// deleteNotification — hard delete
// ---------------------------------------------------------------------------

export async function deleteNotification(id: string, userId: string): Promise<boolean> {
  const deleted = await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      )
    )
    .returning({ id: notifications.id });

  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// getNotificationPreferences
// ---------------------------------------------------------------------------

export async function getNotificationPreferences(userId: string) {
  const rows = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (rows.length > 0) return rows[0];

  // Return defaults if not set yet
  return {
    userId,
    vaccinaProxima: true,
    turnoProximo: true,
    alertaPerdidos: true,
    comunidad: true,
    avistamiento: true,
    updatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// updateNotificationPreferences
// ---------------------------------------------------------------------------

export async function updateNotificationPreferences(
  userId: string,
  prefs: Partial<{
    vaccinaProxima: boolean;
    turnoProximo: boolean;
    alertaPerdidos: boolean;
    comunidad: boolean;
    avistamiento: boolean;
  }>
) {
  // Upsert
  const [updated] = await db
    .insert(notificationPreferences)
    .values({
      userId,
      vaccinaProxima: prefs.vaccinaProxima ?? true,
      turnoProximo: prefs.turnoProximo ?? true,
      alertaPerdidos: prefs.alertaPerdidos ?? true,
      comunidad: prefs.comunidad ?? true,
      avistamiento: prefs.avistamiento ?? true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: {
        ...(prefs.vaccinaProxima !== undefined && { vaccinaProxima: prefs.vaccinaProxima }),
        ...(prefs.turnoProximo !== undefined && { turnoProximo: prefs.turnoProximo }),
        ...(prefs.alertaPerdidos !== undefined && { alertaPerdidos: prefs.alertaPerdidos }),
        ...(prefs.comunidad !== undefined && { comunidad: prefs.comunidad }),
        ...(prefs.avistamiento !== undefined && { avistamiento: prefs.avistamiento }),
        updatedAt: new Date(),
      },
    })
    .returning();

  return updated;
}
