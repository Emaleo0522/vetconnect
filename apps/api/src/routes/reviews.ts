import { Hono } from "hono";
import { createReviewSchema, updateReviewSchema } from "@vetconnect/shared";
import { authGuard, requireRole, type AuthVariables } from "../middleware/auth.js";
import {
  createReview,
  getReviewsByVet,
  updateReview,
  deleteReview,
  ReviewError,
} from "../services/review.service.js";

// ---------------------------------------------------------------------------
// Reviews router — CRUD for veterinary reviews
// ---------------------------------------------------------------------------

const reviewsRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helper — map ReviewError codes to HTTP status
// ---------------------------------------------------------------------------
function errorStatus(code: string): number {
  switch (code) {
    case "VET_NOT_FOUND":
    case "REVIEW_NOT_FOUND":
      return 404;
    case "ALREADY_REVIEWED":
      return 409;
    case "SELF_REVIEW":
    case "FORBIDDEN":
      return 403;
    default:
      return 400;
  }
}

// ---------------------------------------------------------------------------
// GET /api/vets/:id/reviews — list reviews for a vet (public)
// ---------------------------------------------------------------------------
reviewsRouter.get("/api/vets/:id/reviews", async (c) => {
  const vetProfileId = c.req.param("id");
  const cursor = c.req.query("cursor");
  const limitRaw = c.req.query("limit");
  const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 20, 1), 50) : 20;

  try {
    const result = await getReviewsByVet(vetProfileId, cursor, limit);
    return c.json({
      success: true,
      data: result.items,
      pagination: { nextCursor: result.nextCursor },
      meta: {
        avgRating: result.avgRating,
        totalCount: result.totalCount,
      },
    });
  } catch (err) {
    if (err instanceof ReviewError) {
      return c.json(
        { success: false, error: { code: err.code, message: err.message } },
        errorStatus(err.code) as any
      );
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /api/vets/:id/reviews — create review (auth: owner only)
// ---------------------------------------------------------------------------
reviewsRouter.post(
  "/api/vets/:id/reviews",
  authGuard,
  requireRole("owner"),
  async (c) => {
    const vetProfileId = c.req.param("id");
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = createReviewSchema.safeParse(body);

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

    try {
      const review = await createReview(vetProfileId, user.id, parsed.data);
      return c.json({ success: true, data: review }, 201);
    } catch (err) {
      if (err instanceof ReviewError) {
        return c.json(
          { success: false, error: { code: err.code, message: err.message } },
          errorStatus(err.code) as any
        );
      }
      throw err;
    }
  }
);

// ---------------------------------------------------------------------------
// PUT /api/vets/:id/reviews/:reviewId — update own review (auth: owner)
// ---------------------------------------------------------------------------
reviewsRouter.put(
  "/api/vets/:id/reviews/:reviewId",
  authGuard,
  requireRole("owner"),
  async (c) => {
    const reviewId = c.req.param("reviewId");
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = updateReviewSchema.safeParse(body);

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

    try {
      const review = await updateReview(reviewId, user.id, parsed.data);
      return c.json({ success: true, data: review });
    } catch (err) {
      if (err instanceof ReviewError) {
        return c.json(
          { success: false, error: { code: err.code, message: err.message } },
          errorStatus(err.code) as any
        );
      }
      throw err;
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/vets/:id/reviews/:reviewId — delete review (author or admin)
// ---------------------------------------------------------------------------
reviewsRouter.delete(
  "/api/vets/:id/reviews/:reviewId",
  authGuard,
  async (c) => {
    const reviewId = c.req.param("reviewId");
    const user = c.get("user");

    try {
      await deleteReview(reviewId, user.id, user.role);
      return c.json({ success: true, data: null });
    } catch (err) {
      if (err instanceof ReviewError) {
        return c.json(
          { success: false, error: { code: err.code, message: err.message } },
          errorStatus(err.code) as any
        );
      }
      throw err;
    }
  }
);

export { reviewsRouter };
