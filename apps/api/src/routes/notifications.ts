import { Hono } from "hono";
import { z } from "zod";
import {
  authGuard,
  type AuthVariables,
} from "../middleware/auth.js";
import {
  listNotifications,
  markAsRead,
  getUnreadCount,
  markAllRead,
  archiveNotification,
  deleteNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../services/notification.service.js";

// ---------------------------------------------------------------------------
// Notifications router — full CRUD + preferences
// ---------------------------------------------------------------------------

const notificationsRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET /api/notifications — paginated list (filter by unread optional)
// ---------------------------------------------------------------------------

notificationsRouter.get("/api/notifications", authGuard, async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 50);
  const unreadOnly = c.req.query("unread") === "true";

  if (page < 1 || isNaN(page)) {
    return c.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid page number" },
      },
      422
    );
  }

  // Pass unreadOnly filter to service
  const result = await listNotifications(user.id, page, limit, unreadOnly);
  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// GET /api/notifications/count — unread count (polling endpoint)
// ---------------------------------------------------------------------------

notificationsRouter.get(
  "/api/notifications/count",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const count = await getUnreadCount(user.id);
    return c.json({ success: true, data: { count } });
  }
);

// Note: /api/notifications/count must be mounted BEFORE /api/notifications/:id
// to avoid :id matching "count" — Hono routes in order.

// ---------------------------------------------------------------------------
// GET /api/notifications/unread-count — alias for backward compat
// ---------------------------------------------------------------------------

notificationsRouter.get(
  "/api/notifications/unread-count",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const count = await getUnreadCount(user.id);
    return c.json({ success: true, data: { count } });
  }
);

// ---------------------------------------------------------------------------
// PATCH /api/notifications/:id/read — mark as read
// ---------------------------------------------------------------------------

notificationsRouter.patch(
  "/api/notifications/:id/read",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const notificationId = c.req.param("id");

    const updated = await markAsRead(notificationId, user.id);
    if (!updated) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Notification not found" },
        },
        404
      );
    }

    return c.json({ success: true, data: updated });
  }
);

// Keep backward compat — PUT /api/notifications/:id/read
notificationsRouter.put(
  "/api/notifications/:id/read",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const notificationId = c.req.param("id");

    const updated = await markAsRead(notificationId, user.id);
    if (!updated) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Notification not found" },
        },
        404
      );
    }

    return c.json({ success: true, data: updated });
  }
);

// ---------------------------------------------------------------------------
// POST /api/notifications/read-all — mark all as read
// ---------------------------------------------------------------------------

notificationsRouter.post(
  "/api/notifications/read-all",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const count = await markAllRead(user.id);
    return c.json({ success: true, data: { markedRead: count } });
  }
);

// ---------------------------------------------------------------------------
// POST /api/notifications/:id/archive — archive a notification
// ---------------------------------------------------------------------------

notificationsRouter.post(
  "/api/notifications/:id/archive",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const updated = await archiveNotification(id, user.id);
    if (!updated) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "Notification not found" } },
        404
      );
    }

    return c.json({ success: true, data: updated });
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/notifications/:id — delete notification
// ---------------------------------------------------------------------------

notificationsRouter.delete(
  "/api/notifications/:id",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");

    const deleted = await deleteNotification(id, user.id);
    if (!deleted) {
      return c.json(
        { success: false, error: { code: "NOT_FOUND", message: "Notification not found" } },
        404
      );
    }

    return c.json({ success: true, data: { deleted: true } });
  }
);

// ---------------------------------------------------------------------------
// GET /api/users/me/notification-preferences
// ---------------------------------------------------------------------------

notificationsRouter.get(
  "/api/users/me/notification-preferences",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const prefs = await getNotificationPreferences(user.id);
    return c.json({ success: true, data: prefs });
  }
);

// ---------------------------------------------------------------------------
// PATCH /api/users/me/notification-preferences
// ---------------------------------------------------------------------------

const updatePrefsSchema = z.object({
  vaccinaProxima: z.boolean().optional(),
  turnoProximo: z.boolean().optional(),
  alertaPerdidos: z.boolean().optional(),
  comunidad: z.boolean().optional(),
  avistamiento: z.boolean().optional(),
});

notificationsRouter.patch(
  "/api/users/me/notification-preferences",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();

    const parsed = updatePrefsSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        422
      );
    }

    const updated = await updateNotificationPreferences(user.id, parsed.data);
    return c.json({ success: true, data: updated });
  }
);

export { notificationsRouter };
