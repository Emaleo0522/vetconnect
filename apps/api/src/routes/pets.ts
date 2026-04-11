import { Hono } from "hono";
import {
  createPetSchema,
  updatePetSchema,
  linkVetSchema,
} from "@vetconnect/shared";
import {
  authGuard,
  requireRole,
  type AuthVariables,
} from "../middleware/auth.js";
import {
  createPet,
  listPetsByOwner,
  listPetsByVet,
  getPetById,
  updatePet,
  deletePet,
  linkVet,
  updatePetPhoto,
} from "../services/pet.service.js";
import { saveAvatar, UploadError } from "../lib/upload.js";

// ---------------------------------------------------------------------------
// Pets router — CRUD for authenticated pet owners
// ---------------------------------------------------------------------------

const petsRouter = new Hono<{ Variables: AuthVariables }>();

// All /api/pets routes require authentication (except QR, which is in medical.ts)
petsRouter.use("/api/pets/*", authGuard);
petsRouter.use("/api/pets", authGuard);

// ---------------------------------------------------------------------------
// POST /api/pets — create a new pet (owner only)
// ---------------------------------------------------------------------------
petsRouter.post("/api/pets", requireRole("owner"), async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = createPetSchema.safeParse(body);

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

  const pet = await createPet(user.id, parsed.data);
  return c.json({ success: true, data: pet }, 201);
});

// ---------------------------------------------------------------------------
// GET /api/pets — list pets of authenticated owner
// ---------------------------------------------------------------------------
petsRouter.get("/api/pets", requireRole("owner"), async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);

  const result = await listPetsByOwner(user.id, page, limit);
  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// GET /api/pets/my-patients — list patients linked to the authenticated vet
// ---------------------------------------------------------------------------
petsRouter.get("/api/pets/my-patients", requireRole("vet"), async (c) => {
  const user = c.get("user");
  const page = parseInt(c.req.query("page") ?? "1", 10);
  const limit = Math.min(parseInt(c.req.query("limit") ?? "20", 10), 100);

  const result = await listPetsByVet(user.id, page, limit);
  return c.json({ success: true, data: result });
});

// ---------------------------------------------------------------------------
// GET /api/pets/:id — get pet detail (owner or linked vet)
// ---------------------------------------------------------------------------
petsRouter.get("/api/pets/:id", async (c) => {
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

  // Access control: owner or linked vet
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

  return c.json({ success: true, data: pet });
});

// ---------------------------------------------------------------------------
// PUT /api/pets/:id — update pet (owner only)
// ---------------------------------------------------------------------------
petsRouter.put("/api/pets/:id", async (c) => {
  const user = c.get("user");
  const petId = c.req.param("id");
  const body = await c.req.json();

  const parsed = updatePetSchema.safeParse(body);
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

  // Verify ownership
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

  if (pet.ownerId !== user.id) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only the owner can update this pet" },
      },
      403
    );
  }

  const updated = await updatePet(petId, parsed.data);
  return c.json({ success: true, data: updated });
});

// ---------------------------------------------------------------------------
// DELETE /api/pets/:id — delete pet (owner only)
// ---------------------------------------------------------------------------
petsRouter.delete("/api/pets/:id", async (c) => {
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

  if (pet.ownerId !== user.id) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only the owner can delete this pet" },
      },
      403
    );
  }

  await deletePet(petId);
  return c.json({ success: true, data: { id: petId } });
});

// ---------------------------------------------------------------------------
// PUT /api/pets/:id/vet-link — link/unlink primary vet (owner only)
// ---------------------------------------------------------------------------
petsRouter.put("/api/pets/:id/vet-link", async (c) => {
  const user = c.get("user");
  const petId = c.req.param("id");
  const body = await c.req.json();

  const parsed = linkVetSchema.safeParse(body);
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

  // Verify ownership
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

  if (pet.ownerId !== user.id) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only the owner can link a vet" },
      },
      403
    );
  }

  const result = await linkVet(petId, parsed.data.vetId);

  if ("error" in result) {
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Veterinarian not found or user is not a vet",
        },
      },
      404
    );
  }

  return c.json({ success: true, data: result.data });
});

// ---------------------------------------------------------------------------
// POST /api/pets/:id/photo — upload pet photo (owner only)
// ---------------------------------------------------------------------------
petsRouter.post("/api/pets/:id/photo", async (c) => {
  const user = c.get("user");
  const petId = c.req.param("id");

  // Verify ownership
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

  if (pet.ownerId !== user.id) {
    return c.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Only the owner can upload a photo" },
      },
      403
    );
  }

  const body = await c.req.parseBody();
  const file = body["photo"];

  if (!file || !(file instanceof File)) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Field 'photo' is required and must be a file",
        },
      },
      400
    );
  }

  try {
    // Reuse saveAvatar with petId as the filename base
    const photoUrl = await saveAvatar(file, `pet-${petId}`);
    await updatePetPhoto(petId, photoUrl);
    return c.json({ success: true, data: { photoUrl } });
  } catch (err) {
    if (err instanceof UploadError) {
      return c.json(
        {
          success: false,
          error: { code: "UPLOAD_ERROR", message: err.message },
        },
        400
      );
    }
    throw err;
  }
});

export { petsRouter };
