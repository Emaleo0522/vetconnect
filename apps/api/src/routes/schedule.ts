import { Hono } from "hono";
import {
  updateScheduleSchema,
  toggleEmergencySchema,
} from "@vetconnect/shared";
import { authGuard, requireRole, type AuthVariables } from "../middleware/auth.js";
import {
  getScheduleByVetProfile,
  upsertSchedule,
  toggleEmergency,
  ScheduleError,
} from "../services/schedule.service.js";

// ---------------------------------------------------------------------------
// Schedule router — vet availability management
// ---------------------------------------------------------------------------

const scheduleRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET /api/vets/:id/schedule — get vet schedule (public)
// ---------------------------------------------------------------------------
scheduleRouter.get("/api/vets/:id/schedule", async (c) => {
  const vetProfileId = c.req.param("id");
  const result = await getScheduleByVetProfile(vetProfileId);

  if (!result) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Veterinarian not found" },
      },
      404
    );
  }

  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// PUT /api/vets/me/schedule — set schedule (auth: vet only)
// ---------------------------------------------------------------------------
scheduleRouter.put(
  "/api/vets/me/schedule",
  authGuard,
  requireRole("vet"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = updateScheduleSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid schedule data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        422
      );
    }

    try {
      const schedule = await upsertSchedule(user.id, parsed.data);
      return c.json({ success: true, data: { schedule } });
    } catch (err) {
      if (err instanceof ScheduleError) {
        return c.json(
          { success: false, error: { code: err.code, message: err.message } },
          err.code === "PROFILE_NOT_FOUND" ? (404 as any) : (400 as any)
        );
      }
      throw err;
    }
  }
);

// ---------------------------------------------------------------------------
// PUT /api/vets/me/emergency — toggle 24h emergency (auth: vet only)
// ---------------------------------------------------------------------------
scheduleRouter.put(
  "/api/vets/me/emergency",
  authGuard,
  requireRole("vet"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = toggleEmergencySchema.safeParse(body);

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
      const result = await toggleEmergency(user.id, parsed.data);
      return c.json({ success: true, data: result });
    } catch (err) {
      if (err instanceof ScheduleError) {
        return c.json(
          { success: false, error: { code: err.code, message: err.message } },
          404 as any
        );
      }
      throw err;
    }
  }
);

export { scheduleRouter };
