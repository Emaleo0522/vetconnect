import { Hono } from "hono";
import { updateProfileSchema } from "@vetconnect/shared";
import { authGuard, type AuthVariables } from "../middleware/auth.js";
import {
  getProfileByUserId,
  updateProfile,
  updateAvatarUrl,
} from "../services/profile.service.js";
import { saveAvatar, UploadError } from "../lib/upload.js";

// ---------------------------------------------------------------------------
// Profile router — authenticated user profile management
// ---------------------------------------------------------------------------

const profileRouter = new Hono<{ Variables: AuthVariables }>();

// All profile routes require authentication
profileRouter.use("/api/users/me/*", authGuard);

// ---------------------------------------------------------------------------
// GET /api/users/me/profile — get current user's profile
// ---------------------------------------------------------------------------
profileRouter.get("/api/users/me/profile", async (c) => {
  const user = c.get("user");
  const profile = await getProfileByUserId(user.id, user.role);

  if (!profile) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Profile not found" },
      },
      404
    );
  }

  return c.json({ success: true, data: profile });
});

// ---------------------------------------------------------------------------
// PUT /api/users/me/profile — update current user's profile
// ---------------------------------------------------------------------------
profileRouter.put("/api/users/me/profile", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);

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

  // Strip role-specific fields that don't belong to the user's role
  const input = parsed.data;
  if (user.role !== "vet") {
    delete input.specialties;
    delete input.clinicName;
    delete input.clinicAddress;
    delete input.clinicPhone;
    delete input.latitude;
    delete input.longitude;
  }
  if (user.role !== "org") {
    delete input.orgName;
    delete input.website;
  }

  const updated = await updateProfile(user.id, user.role, input);

  if (!updated) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Profile not found" },
      },
      404
    );
  }

  return c.json({ success: true, data: updated });
});

// ---------------------------------------------------------------------------
// POST /api/users/me/avatar — upload avatar image
// ---------------------------------------------------------------------------
profileRouter.post("/api/users/me/avatar", async (c) => {
  const user = c.get("user");

  const body = await c.req.parseBody();
  const file = body["avatar"];

  if (!file || !(file instanceof File)) {
    return c.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Field 'avatar' is required and must be a file",
        },
      },
      400
    );
  }

  try {
    const avatarUrl = await saveAvatar(file, user.id);
    await updateAvatarUrl(user.id, avatarUrl);
    return c.json({ success: true, data: { avatarUrl } });
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

export { profileRouter };
