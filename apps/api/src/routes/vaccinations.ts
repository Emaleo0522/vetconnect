import { Hono } from "hono";
import { createVaccinationSchema } from "@vetconnect/shared";
import {
  authGuard,
  type AuthVariables,
} from "../middleware/auth.js";
import { getPetById } from "../services/pet.service.js";
import {
  createVaccination,
  listVaccinations,
  getVaccinationById,
  updateVaccination,
  deleteVaccination,
  getVaccinationCard,
} from "../services/vaccination.service.js";
import { env } from "../lib/env.js";

// ---------------------------------------------------------------------------
// Vaccinations router — CRUD + shared vaccination card
// ---------------------------------------------------------------------------

const vaccinationsRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// Helper — check owner or linked vet access
// ---------------------------------------------------------------------------

async function checkPetAccess(
  petId: string,
  userId: string,
  userRole: string
) {
  const pet = await getPetById(petId);
  if (!pet) return { error: "NOT_FOUND" as const, pet: null };

  const isOwner = pet.ownerId === userId;
  const isLinkedVet = userRole === "vet" && pet.vetId === userId;

  if (!isOwner && !isLinkedVet) {
    return { error: "FORBIDDEN" as const, pet };
  }

  return { error: null, pet, isOwner };
}

// ---------------------------------------------------------------------------
// POST /api/pets/:petId/vaccinations — register vaccination
// ---------------------------------------------------------------------------

vaccinationsRouter.post(
  "/api/pets/:petId/vaccinations",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const petId = c.req.param("petId");

    const access = await checkPetAccess(petId, user.id, user.role);
    if (access.error === "NOT_FOUND") {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pet not found" },
        },
        404
      );
    }
    if (access.error === "FORBIDDEN") {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        403
      );
    }

    const body = await c.req.json();
    const parsed = createVaccinationSchema.safeParse(body);

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

    const vaccination = await createVaccination(petId, parsed.data);
    return c.json({ success: true, data: vaccination }, 201);
  }
);

// ---------------------------------------------------------------------------
// GET /api/pets/:petId/vaccinations — list vaccinations
// ---------------------------------------------------------------------------

vaccinationsRouter.get(
  "/api/pets/:petId/vaccinations",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const petId = c.req.param("petId");

    const access = await checkPetAccess(petId, user.id, user.role);
    if (access.error === "NOT_FOUND") {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pet not found" },
        },
        404
      );
    }
    if (access.error === "FORBIDDEN") {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        403
      );
    }

    const items = await listVaccinations(petId);
    return c.json({ success: true, data: items });
  }
);

// ---------------------------------------------------------------------------
// PUT /api/pets/:petId/vaccinations/:id — edit vaccination
// ---------------------------------------------------------------------------

vaccinationsRouter.put(
  "/api/pets/:petId/vaccinations/:id",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const petId = c.req.param("petId");
    const vaccinationId = c.req.param("id");

    const access = await checkPetAccess(petId, user.id, user.role);
    if (access.error === "NOT_FOUND") {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pet not found" },
        },
        404
      );
    }
    if (access.error === "FORBIDDEN") {
      return c.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        403
      );
    }

    // Verify vaccination belongs to this pet
    const existing = await getVaccinationById(vaccinationId);
    if (!existing || existing.petId !== petId) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Vaccination not found" },
        },
        404
      );
    }

    const body = await c.req.json();
    // For updates, use partial validation — same schema but all optional
    const parsed = createVaccinationSchema.safeParse({
      ...existing,
      date: existing.date + "T00:00:00.000Z",
      nextDoseDate: existing.nextDoseDate
        ? existing.nextDoseDate + "T00:00:00.000Z"
        : undefined,
      ...body,
    });

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

    const updated = await updateVaccination(vaccinationId, parsed.data);
    return c.json({ success: true, data: updated });
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/pets/:petId/vaccinations/:id — delete (owner only)
// ---------------------------------------------------------------------------

vaccinationsRouter.delete(
  "/api/pets/:petId/vaccinations/:id",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const petId = c.req.param("petId");
    const vaccinationId = c.req.param("id");

    const pet = await getPetById(petId);
    if (!pet) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pet not found" },
        },
        404
      );
    }

    // Delete is owner-only
    if (pet.ownerId !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the pet owner can delete vaccinations",
          },
        },
        403
      );
    }

    // Verify vaccination belongs to this pet
    const existing = await getVaccinationById(vaccinationId);
    if (!existing || existing.petId !== petId) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Vaccination not found" },
        },
        404
      );
    }

    await deleteVaccination(vaccinationId);
    return c.json({ success: true, data: { id: vaccinationId } });
  }
);

// ---------------------------------------------------------------------------
// GET /api/pets/:petId/vaccination-card — generate temporary share link
// Returns a JWT token valid for 24h with petId embedded
// ---------------------------------------------------------------------------

vaccinationsRouter.get(
  "/api/pets/:petId/vaccination-card",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const petId = c.req.param("petId");

    const pet = await getPetById(petId);
    if (!pet) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pet not found" },
        },
        404
      );
    }

    // Only owner can generate share link
    if (pet.ownerId !== user.id) {
      return c.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only the pet owner can share the vaccination card",
          },
        },
        403
      );
    }

    // Generate JWT with 24h expiry using Hono's jwt sign
    const { sign } = await import("hono/jwt");
    const now = Math.floor(Date.now() / 1000);
    const token = await sign(
      {
        petId,
        purpose: "vaccination-card",
        iat: now,
        exp: now + 24 * 60 * 60, // 24 hours
      },
      env.BETTER_AUTH_SECRET,
      "HS256"
    );

    return c.json({
      success: true,
      data: {
        token,
        expiresIn: "24h",
      },
    });
  }
);

// ---------------------------------------------------------------------------
// GET /api/pets/shared-card/:token — PUBLIC, decode JWT and return card
// ---------------------------------------------------------------------------

vaccinationsRouter.get("/api/pets/shared-card/:token", async (c) => {
  const token = c.req.param("token");

  try {
    const { verify } = await import("hono/jwt");
    const payload = await verify(token, env.BETTER_AUTH_SECRET, "HS256");

    if (payload.purpose !== "vaccination-card" || !payload.petId) {
      return c.json(
        {
          success: false,
          error: { code: "INVALID_TOKEN", message: "Invalid share token" },
        },
        400
      );
    }

    const card = await getVaccinationCard(payload.petId as string);
    if (!card) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Pet not found" },
        },
        404
      );
    }

    return c.json({ success: true, data: card });
  } catch {
    return c.json(
      {
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token expired or invalid",
        },
      },
      401
    );
  }
});

export { vaccinationsRouter };
