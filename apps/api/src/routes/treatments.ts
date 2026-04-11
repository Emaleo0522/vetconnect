import { Hono } from "hono";
import { createTreatmentSchema } from "@vetconnect/shared";
import {
  authGuard,
  type AuthVariables,
} from "../middleware/auth.js";
import { getPetById } from "../services/pet.service.js";
import {
  createTreatment,
  listTreatments,
  getTreatmentById,
  deleteTreatment,
} from "../services/treatment.service.js";

// ---------------------------------------------------------------------------
// Treatments router — CRUD for treatments
// ---------------------------------------------------------------------------

const treatmentsRouter = new Hono<{ Variables: AuthVariables }>();

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
// POST /api/pets/:petId/treatments — register treatment
// ---------------------------------------------------------------------------

treatmentsRouter.post(
  "/api/pets/:petId/treatments",
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
    const parsed = createTreatmentSchema.safeParse(body);

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

    const treatment = await createTreatment(petId, parsed.data);
    return c.json({ success: true, data: treatment }, 201);
  }
);

// ---------------------------------------------------------------------------
// GET /api/pets/:petId/treatments — list treatments
// ---------------------------------------------------------------------------

treatmentsRouter.get(
  "/api/pets/:petId/treatments",
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

    const items = await listTreatments(petId);
    return c.json({ success: true, data: items });
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/pets/:petId/treatments/:id — delete (owner only)
// ---------------------------------------------------------------------------

treatmentsRouter.delete(
  "/api/pets/:petId/treatments/:id",
  authGuard,
  async (c) => {
    const user = c.get("user");
    const petId = c.req.param("petId");
    const treatmentId = c.req.param("id");

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
            message: "Only the pet owner can delete treatments",
          },
        },
        403
      );
    }

    // Verify treatment belongs to this pet
    const existing = await getTreatmentById(treatmentId);
    if (!existing || existing.petId !== petId) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Treatment not found" },
        },
        404
      );
    }

    await deleteTreatment(treatmentId);
    return c.json({ success: true, data: { id: treatmentId } });
  }
);

export { treatmentsRouter };
