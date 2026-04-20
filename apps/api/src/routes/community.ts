import { Hono } from "hono";
import { z } from "zod";
import { authGuard, type AuthVariables } from "../middleware/auth.js";
import {
  listFeed,
  getPostById,
  createPost,
  toggleLike,
  reportPost,
  hidePost,
  listComments,
  createComment,
} from "../services/community.service.js";
import { saveAvatar, UploadError } from "../lib/upload.js";

// ---------------------------------------------------------------------------
// Community router (posts + comments)
// ---------------------------------------------------------------------------

const communityRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  visibility: z.enum(["public", "followers"]).default("public"),
});

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentCommentId: z.string().optional(),
});

const reportSchema = z.object({
  reason: z.enum(["spam", "inappropriate", "other"]),
});

const feedQuerySchema = z.object({
  filter: z.enum(["all", "vets", "owners"]).default("all"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// GET /api/posts — feed (cursor-based)
// ---------------------------------------------------------------------------

communityRouter.get("/api/posts", authGuard, async (c) => {
  const user = c.get("user");

  const parsed = feedQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      422
    );
  }

  const result = await listFeed({
    filter: parsed.data.filter,
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
    userId: user.id,
  });

  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// POST /api/posts — create post (text or text+photo multipart)
// ---------------------------------------------------------------------------

communityRouter.post("/api/posts", authGuard, async (c) => {
  const user = c.get("user");

  let content: string | undefined;
  let visibility: "public" | "followers" = "public";
  let photoUrl: string | undefined;

  const contentType = c.req.header("Content-Type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const body = await c.req.parseBody();
    content = typeof body["content"] === "string" ? body["content"] : undefined;
    const vis = body["visibility"];
    if (vis === "followers") visibility = "followers";

    const file = body["photo"];
    if (file instanceof File) {
      try {
        photoUrl = await saveAvatar(file, `post-${user.id}-${Date.now()}`);
      } catch (err) {
        if (err instanceof UploadError) {
          return c.json(
            { success: false, error: { code: "UPLOAD_ERROR", message: err.message } },
            400
          );
        }
        throw err;
      }
    }
  } else {
    const body = await c.req.json();
    content = body.content;
    if (body.visibility === "followers") visibility = "followers";
  }

  const parsed = createPostSchema.safeParse({ content, visibility });
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

  const result = await createPost(user.id, {
    content: parsed.data.content,
    visibility: parsed.data.visibility,
    photoUrl,
  });

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: "Content cannot be empty" } },
      422
    );
  }

  return c.json({ success: true, data: result.data }, 201);
});

// ---------------------------------------------------------------------------
// GET /api/posts/:id — post detail
// ---------------------------------------------------------------------------

communityRouter.get("/api/posts/:id", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const post = await getPostById(id, user.id);
  if (!post) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Post not found" } },
      404
    );
  }

  return c.json({ success: true, data: post });
});

// ---------------------------------------------------------------------------
// POST /api/posts/:id/like — toggle like
// ---------------------------------------------------------------------------

communityRouter.post("/api/posts/:id/like", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const result = await toggleLike(id, user.id);

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: "Post not found" } },
      404
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// POST /api/posts/:id/report — report post
// ---------------------------------------------------------------------------

communityRouter.post("/api/posts/:id/report", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = reportSchema.safeParse(body);
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

  const result = await reportPost(id, user.id, parsed.data.reason);

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: "Post not found" } },
      404
    );
  }

  return c.json(
    { success: true, data: result.data },
    result.already ? 200 : 201
  );
});

// ---------------------------------------------------------------------------
// POST /api/posts/:id/hide — hide post for current user
// ---------------------------------------------------------------------------

communityRouter.post("/api/posts/:id/hide", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const result = await hidePost(id, user.id);

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: "Post not found" } },
      404
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// GET /api/posts/:id/comments
// ---------------------------------------------------------------------------

communityRouter.get("/api/posts/:id/comments", authGuard, async (c) => {
  const id = c.req.param("id");
  const items = await listComments(id);

  if (!items) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Post not found" } },
      404
    );
  }

  return c.json({ success: true, data: items });
});

// ---------------------------------------------------------------------------
// POST /api/posts/:id/comments — create comment
// ---------------------------------------------------------------------------

communityRouter.post("/api/posts/:id/comments", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = createCommentSchema.safeParse(body);
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

  const result = await createComment(id, user.id, parsed.data);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      POST_NOT_FOUND: 404,
      PARENT_COMMENT_NOT_FOUND: 404,
      EMPTY_CONTENT: 422,
    };
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      (statusMap[result.error as string] ?? 400) as any
    );
  }

  return c.json({ success: true, data: result.data }, 201);
});

// ---------------------------------------------------------------------------
// POST /api/comments/:id/replies — reply to a comment (shortcut)
// ---------------------------------------------------------------------------

communityRouter.post("/api/comments/:id/replies", authGuard, async (c) => {
  const user = c.get("user");
  const parentCommentId = c.req.param("id");
  const body = await c.req.json();

  // Need to find the postId from the parent comment
  const { db } = await import("../db/client.js");
  const { comments } = await import("../db/schema/community.js");
  const { eq } = await import("drizzle-orm");

  const parentRow = await db
    .select({ postId: comments.postId })
    .from(comments)
    .where(eq(comments.id, parentCommentId))
    .limit(1);

  if (parentRow.length === 0) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Comment not found" } },
      404
    );
  }

  const parsed = z.object({ content: z.string().min(1).max(2000) }).safeParse(body);
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

  const result = await createComment(parentRow[0].postId, user.id, {
    content: parsed.data.content,
    parentCommentId,
  });

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      400
    );
  }

  return c.json({ success: true, data: result.data }, 201);
});

export { communityRouter };
