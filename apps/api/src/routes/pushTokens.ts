import { Hono } from "hono";
import { z } from "zod";
import { authGuard, type AuthVariables } from "../middleware/auth.js";
import { db } from "../db/client.js";
import { pushTokens } from "../db/schema/notifications.js";
import { eq, and } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Push tokens router — register/unregister Expo push tokens
// ---------------------------------------------------------------------------

const pushTokensRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const registerTokenSchema = z.object({
  token: z.string().min(1).max(200),
  platform: z.enum(["ios", "android"]),
});

// ---------------------------------------------------------------------------
// POST /api/push-tokens — register a push token for the authenticated user
// ---------------------------------------------------------------------------

pushTokensRouter.post("/api/push-tokens", authGuard, async (c) => {
  const body = await c.req.json();
  const parsed = registerTokenSchema.safeParse(body);

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
      400
    );
  }

  const { token, platform } = parsed.data;
  const userId = c.get("user").id;

  // Upsert: if token already exists, update the userId (device may change user)
  // Using ON CONFLICT on the unique token column
  const id = crypto.randomUUID();

  await db
    .insert(pushTokens)
    .values({
      id,
      userId,
      token,
      platform,
    })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: {
        userId,
        platform,
      },
    });

  return c.json({ success: true, data: { token, platform } }, 201);
});

// ---------------------------------------------------------------------------
// DELETE /api/push-tokens — unregister all tokens for the authenticated user
// ---------------------------------------------------------------------------

pushTokensRouter.delete("/api/push-tokens", authGuard, async (c) => {
  const userId = c.get("user").id;

  await db.delete(pushTokens).where(eq(pushTokens.userId, userId));

  return c.json({ success: true, message: "All push tokens removed" });
});

export { pushTokensRouter };
