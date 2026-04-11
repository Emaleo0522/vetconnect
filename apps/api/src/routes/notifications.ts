import { Hono } from "hono";
import {
  authGuard,
  type AuthVariables,
} from "../middleware/auth.js";
import {
  listNotifications,
  markAsRead,
  getUnreadCount,
} from "../services/notification.service.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Notifications router — list, mark read, unread count
// ---------------------------------------------------------------------------

const notificationsRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET /api/notifications — paginated list (unread first)
// ---------------------------------------------------------------------------

notificationsRouter.get("/api/notifications", authGuard, async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 50);

  if (page < 1 || isNaN(page)) {
    return c.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid page number" },
      },
      422
    );
  }

  const result = await listNotifications(user.id, page, limit);
  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// PUT /api/notifications/:id/read — mark as read
// ---------------------------------------------------------------------------

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
          error: {
            code: "NOT_FOUND",
            message: "Notification not found",
          },
        },
        404
      );
    }

    return c.json({ success: true, data: updated });
  }
);

// ---------------------------------------------------------------------------
// GET /api/notifications/unread-count — count of unread notifications
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

export { notificationsRouter };
