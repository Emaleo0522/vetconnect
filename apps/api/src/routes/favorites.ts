import { Hono } from "hono";
import { z } from "zod";
import { authGuard, type AuthVariables } from "../middleware/auth.js";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
} from "../services/favorites.service.js";

// ---------------------------------------------------------------------------
// Favorites router
// ---------------------------------------------------------------------------

const favoritesRouter = new Hono<{ Variables: AuthVariables }>();

const addFavoriteSchema = z.object({
  vetProfileId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// GET /api/users/me/favorites
// ---------------------------------------------------------------------------

favoritesRouter.get("/api/users/me/favorites", authGuard, async (c) => {
  const user = c.get("user");
  const items = await listFavorites(user.id);
  return c.json({ success: true, data: items });
});

// ---------------------------------------------------------------------------
// POST /api/users/me/favorites
// ---------------------------------------------------------------------------

favoritesRouter.post("/api/users/me/favorites", authGuard, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const parsed = addFavoriteSchema.safeParse(body);
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

  const result = await addFavorite(user.id, parsed.data.vetProfileId);

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: "Veterinarian not found" } },
      404
    );
  }

  return c.json(
    { success: true, data: result.data },
    result.already ? 200 : 201
  );
});

// ---------------------------------------------------------------------------
// DELETE /api/users/me/favorites/:vetId
// ---------------------------------------------------------------------------

favoritesRouter.delete("/api/users/me/favorites/:vetId", authGuard, async (c) => {
  const user = c.get("user");
  const vetProfileId = c.req.param("vetId");

  const deleted = await removeFavorite(user.id, vetProfileId);

  if (!deleted) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Favorite not found" } },
      404
    );
  }

  return c.json({ success: true, data: { deleted: true } });
});

export { favoritesRouter };
