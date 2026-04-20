import { Hono } from "hono";
import { z } from "zod";
import { authGuard, type AuthVariables } from "../middleware/auth.js";
import {
  listAppointments,
  getAppointmentById,
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAvailableSlots,
  AppointmentError,
} from "../services/appointment.service.js";

// ---------------------------------------------------------------------------
// Appointments router
// ---------------------------------------------------------------------------

const appointmentsRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createAppointmentSchema = z.object({
  petId: z.string().min(1),
  vetProfileId: z.string().min(1),
  scheduledAt: z.string().datetime({ message: "scheduledAt must be an ISO 8601 datetime" }),
  durationMinutes: z.number().int().min(15).max(120).default(30).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

const rescheduleSchema = z.object({
  scheduledAt: z.string().datetime({ message: "scheduledAt must be an ISO 8601 datetime" }),
  reason: z.string().max(500).optional(),
});

const listQuerySchema = z.object({
  status: z.enum(["upcoming", "past", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------------------------------------------------------------------------
// GET /api/appointments
// ---------------------------------------------------------------------------

appointmentsRouter.get("/api/appointments", authGuard, async (c) => {
  const user = c.get("user");
  const raw = c.req.query();

  const parsed = listQuerySchema.safeParse(raw);
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

  const result = await listAppointments(
    user.id,
    parsed.data.status,
    parsed.data.page,
    parsed.data.limit
  );

  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// POST /api/appointments
// ---------------------------------------------------------------------------

appointmentsRouter.post("/api/appointments", authGuard, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const parsed = createAppointmentSchema.safeParse(body);
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
    const appointment = await createAppointment(user.id, {
      ...parsed.data,
      scheduledAt: new Date(parsed.data.scheduledAt),
    });

    return c.json({ success: true, data: appointment }, 201);
  } catch (err) {
    if (err instanceof AppointmentError) {
      const statusMap: Record<string, number> = {
        PET_NOT_FOUND: 404,
        VET_NOT_FOUND: 404,
        OUTSIDE_SCHEDULE: 422,
        OUTSIDE_HOURS: 422,
        SLOT_TAKEN: 409,
      };
      return c.json(
        {
          success: false,
          error: { code: err.code, message: err.message },
        },
        (statusMap[err.code] ?? 400) as any
      );
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// GET /api/appointments/:id
// ---------------------------------------------------------------------------

appointmentsRouter.get("/api/appointments/:id", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const appt = await getAppointmentById(id);
  if (!appt) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Appointment not found" } },
      404
    );
  }

  if (appt.userId !== user.id && user.role !== "admin") {
    return c.json(
      { success: false, error: { code: "FORBIDDEN", message: "Access denied" } },
      403
    );
  }

  return c.json({ success: true, data: appt });
});

// ---------------------------------------------------------------------------
// DELETE /api/appointments/:id — cancel (soft delete)
// ---------------------------------------------------------------------------

appointmentsRouter.delete("/api/appointments/:id", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");

  const result = await cancelAppointment(id, user.id);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      ALREADY_CANCELLED: 409,
    };
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      (statusMap[result.error as string] ?? 400) as any
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// PATCH /api/appointments/:id/reschedule
// ---------------------------------------------------------------------------

appointmentsRouter.patch("/api/appointments/:id/reschedule", authGuard, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json();

  const parsed = rescheduleSchema.safeParse(body);
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

  const result = await rescheduleAppointment(id, user.id, {
    ...parsed.data,
    scheduledAt: new Date(parsed.data.scheduledAt),
  });

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      CANNOT_RESCHEDULE_CANCELLED: 409,
      SLOT_TAKEN: 409,
    };
    return c.json(
      { success: false, error: { code: result.error, message: result.error } },
      (statusMap[result.error as string] ?? 400) as any
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// GET /api/vets/:id/slots?date=YYYY-MM-DD
// ---------------------------------------------------------------------------

appointmentsRouter.get("/api/vets/:id/slots", async (c) => {
  const vetProfileId = c.req.param("id");
  const dateStr = c.req.query("date");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Query param 'date' is required in YYYY-MM-DD format",
        },
      },
      422
    );
  }

  const date = new Date(dateStr + "T00:00:00Z");
  if (isNaN(date.getTime())) {
    return c.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid date" },
      },
      422
    );
  }

  const result = await getAvailableSlots(vetProfileId, date);

  if (!result) {
    return c.json(
      { success: false, error: { code: "NOT_FOUND", message: "Veterinarian not found" } },
      404
    );
  }

  return c.json({ success: true, data: result });
});

export { appointmentsRouter };
