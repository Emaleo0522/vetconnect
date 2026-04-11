import { Hono } from "hono";
import { searchVetsSchema } from "@vetconnect/shared";
import { searchVets, getVetById } from "../services/vet.service.js";

// ---------------------------------------------------------------------------
// Vets router — public endpoints for listing & searching veterinarians
// ---------------------------------------------------------------------------

const vetsRouter = new Hono();

// ---------------------------------------------------------------------------
// GET /api/vets — list/search vets with filters (public)
// ---------------------------------------------------------------------------
vetsRouter.get("/api/vets", async (c) => {
  const raw = c.req.query();

  // Coerce query params to correct types for Zod validation
  const coerced: Record<string, unknown> = {};
  if (raw.specialty) coerced.specialty = raw.specialty;
  if (raw.query) coerced.query = raw.query;
  if (raw.cursor) coerced.cursor = raw.cursor;
  if (raw.latitude) coerced.latitude = parseFloat(raw.latitude);
  if (raw.longitude) coerced.longitude = parseFloat(raw.longitude);
  if (raw.radius) coerced.radius = parseFloat(raw.radius);
  if (raw.limit) coerced.limit = parseInt(raw.limit, 10);
  if (raw.isEmergency !== undefined) coerced.isEmergency = raw.isEmergency === "true";

  const parsed = searchVetsSchema.safeParse(coerced);

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

  const result = await searchVets(parsed.data);

  return c.json({
    success: true,
    data: result.items,
    pagination: { nextCursor: result.nextCursor },
  });
});

// ---------------------------------------------------------------------------
// GET /api/vets/:id — get vet profile detail (public)
// ---------------------------------------------------------------------------
vetsRouter.get("/api/vets/:id", async (c) => {
  const id = c.req.param("id");
  const vet = await getVetById(id);

  if (!vet) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Veterinarian not found" },
      },
      404
    );
  }

  return c.json({ success: true, data: vet });
});

export { vetsRouter };
