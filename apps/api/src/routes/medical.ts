import { Hono } from "hono";
import { createMedicalRecordSchema } from "@vetconnect/shared";
import {
  authGuard,
  type AuthVariables,
} from "../middleware/auth.js";
import { getPetById } from "../services/pet.service.js";
import {
  getMedicalHistory,
  createMedicalRecord,
  getQrPublicData,
} from "../services/medical.service.js";

// ---------------------------------------------------------------------------
// Medical router — medical history & QR public endpoint
// ---------------------------------------------------------------------------

const medicalRouter = new Hono<{ Variables: AuthVariables }>();

// ---------------------------------------------------------------------------
// GET /api/pets/qr/:uuid — PUBLIC endpoint (no auth)
// Returns non-sensitive pet data for QR code scan
// ---------------------------------------------------------------------------
medicalRouter.get("/api/pets/qr/:uuid", async (c) => {
  const uuid = c.req.param("uuid");
  const data = await getQrPublicData(uuid);

  if (!data) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Pet not found" },
      },
      404
    );
  }

  return c.json({ success: true, data });
});

// ---------------------------------------------------------------------------
// GET /api/pets/:id/medical-history — owner or linked vet
// ---------------------------------------------------------------------------
medicalRouter.get("/api/pets/:id/medical-history", authGuard, async (c) => {
  const user = c.get("user");
  const petId = c.req.param("id");

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

  // Access: owner or linked vet
  const isOwner = pet.ownerId === user.id;
  const isLinkedVet = user.role === "vet" && pet.vetId === user.id;

  if (!isOwner && !isLinkedVet) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied" },
      },
      403
    );
  }

  const history = await getMedicalHistory(petId);
  return c.json({ success: true, data: history });
});

// ---------------------------------------------------------------------------
// POST /api/pets/:id/medical-records — linked vet only
// ---------------------------------------------------------------------------
medicalRouter.post("/api/pets/:id/medical-records", authGuard, async (c) => {
  const user = c.get("user");
  const petId = c.req.param("id");

  // Must be a vet
  if (user.role !== "vet") {
    return c.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only veterinarians can add medical records",
        },
      },
      403
    );
  }

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

  // Must be the linked vet
  if (pet.vetId !== user.id) {
    return c.json(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Only the linked primary vet can add records to this pet",
        },
      },
      403
    );
  }

  const body = await c.req.json();
  const parsed = createMedicalRecordSchema.safeParse(body);

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

  const record = await createMedicalRecord(petId, user.id, parsed.data);
  return c.json({ success: true, data: record }, 201);
});

export { medicalRouter };
