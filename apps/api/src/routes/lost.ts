import { Hono } from "hono";
import { z } from "zod";
import { authGuard, type AuthVariables } from "../middleware/auth.js";
import {
  listLostReports,
  getLostReportById,
  createLostReport,
  updateLostReport,
  markFound,
  listSightings,
  createSighting,
} from "../services/lost.service.js";
import { createNotification } from "../services/notification.service.js";

// ---------------------------------------------------------------------------
// Lost reports router
// ---------------------------------------------------------------------------

const lostRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createLostReportSchema = z.object({
  petId: z.string().min(1),
  description: z.string().min(10).max(2000),
  lastSeenAt: z.string().datetime(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  contactPreference: z.enum(["app", "phone", "email"]).default("app"),
  reward: z.string().max(200).optional(),
});

const updateLostReportSchema = z.object({
  description: z.string().min(10).max(2000).optional(),
  lastSeenAt: z.string().datetime().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  contactPreference: z.enum(["app", "phone", "email"]).optional(),
  reward: z.string().max(200).optional(),
});

const createSightingSchema = z.object({
  description: z.string().min(5).max(1000),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  photoUrl: z.string().url().optional(),
});

const listQuerySchema = z.object({
  species: z.string().optional(),
  status: z.enum(["active", "found", "closed"]).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().min(1).max(200).default(10),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// GET /api/lost-reports — public listing
// ---------------------------------------------------------------------------

lostRouter.get("/api/lost-reports", async (c) => {
  const parsed = listQuerySchema.safeParse(c.req.query());
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

  const result = await listLostReports(parsed.data);
  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// POST /api/lost-reports — create (auth)
// ---------------------------------------------------------------------------

lostRouter.post("/api/lost-reports", authGuard, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const parsed = createLostReportSchema.safeParse(body);
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

  const result = await createLostReport(user.id, {
    ...parsed.data,
    lastSeenAt: new Date(parsed.data.lastSeenAt),
  });

  if ("error" in result) {
    return c.json(
      { success: false, error: { code: result.error, message: "Pet not found or does not belong to you" } },
      404
    );
  }

  return c.json({ success: true, data: result.data }, 201);
});

// ---------------------------------------------------------------------------
// GET /api/lost-reports/:id
// ---------------------------------------------------------------------------

lostRouter.get("/api/lost-reports/:id", async (c) => {
  const id = c.req.param("id");
  const report = await getLostReportById(id);

  if (!report) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Report not found" } },
      404
    );
  }

  return c.json({ success: true, data: report });
});

// ---------------------------------------------------------------------------
// PUT /api/lost-reports/:id — update (owner only)
// ---------------------------------------------------------------------------

lostRouter.put("/api/lost-reports/:id", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = updateLostReportSchema.safeParse(body);
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

  const result = await updateLostReport(id, user.id, {
    ...parsed.data,
    lastSeenAt: parsed.data.lastSeenAt ? new Date(parsed.data.lastSeenAt) : undefined,
  });

  if ("error" in result) {
    const statusMap: Record<string, number> = { NOT_FOUND: 404, FORBIDDEN: 403 };
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      (statusMap[result.error as string] ?? 400) as any
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// POST /api/lost-reports/:id/found — mark as found (owner only)
// ---------------------------------------------------------------------------

lostRouter.post("/api/lost-reports/:id/found", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const result = await markFound(id, user.id);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      ALREADY_FOUND: 409,
    };
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      (statusMap[result.error as string] ?? 400) as any
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// GET /api/lost-reports/:id/sightings
// ---------------------------------------------------------------------------

lostRouter.get("/api/lost-reports/:id/sightings", async (c) => {
  const id = c.req.param("id");
  const items = await listSightings(id);

  if (!items) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Report not found" } },
      404
    );
  }

  return c.json({ success: true, data: items });
});

// ---------------------------------------------------------------------------
// POST /api/lost-reports/:id/sightings — report sighting (auth)
// ---------------------------------------------------------------------------

lostRouter.post("/api/lost-reports/:id/sightings", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = createSightingSchema.safeParse(body);
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

  const result = await createSighting(id, user.id, parsed.data);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      REPORT_CLOSED: 409,
    };
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      (statusMap[result.error as string] ?? 400) as any
    );
  }

  // Notify the report owner about the sighting
  await createNotification({
    userId: result.ownerId,
    type: "sighting",
    title: "Avistamiento reportado",
    body: "Alguien reportó un avistamiento de tu mascota perdida.",
    data: { lostReportId: id, sightingId: result.data.id },
    link: `/dashboard/perdidos/${id}`,
  });

  return c.json({ success: true, data: result.data }, 201);
});

export { lostRouter };
