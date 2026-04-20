import { Hono } from "hono";
import {
  registerOwnerSchema,
  registerVetSchema,
  registerOrgSchema,
} from "@vetconnect/shared";
import {
  registerOwner,
  registerVet,
  registerOrg,
  DuplicateEmailError,
} from "../services/user.service.js";

// ---------------------------------------------------------------------------
// Users router — registration by role
// ---------------------------------------------------------------------------

const usersRouter = new Hono();

// ---------------------------------------------------------------------------
// POST /api/users/register/owner
// ---------------------------------------------------------------------------
usersRouter.post("/api/users/register/owner", async (c) => {
  const body = await c.req.json();
  const parsed = registerOwnerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
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
    const result = await registerOwner(parsed.data);
    // T9: Return flat contract {user} — no {success, data} wrapper.
    // Session is established when client calls POST /api/auth/sign-in/email.
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return c.json(
        { error: { code: "DUPLICATE_EMAIL", message: err.message } },
        409
      );
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /api/users/register/vet
// ---------------------------------------------------------------------------
usersRouter.post("/api/users/register/vet", async (c) => {
  const body = await c.req.json();
  const parsed = registerVetSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
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
    const result = await registerVet(parsed.data);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return c.json(
        { error: { code: "DUPLICATE_EMAIL", message: err.message } },
        409
      );
    }
    throw err;
  }
});

// ---------------------------------------------------------------------------
// POST /api/users/register/org
// ---------------------------------------------------------------------------
usersRouter.post("/api/users/register/org", async (c) => {
  const body = await c.req.json();
  const parsed = registerOrgSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
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
    const result = await registerOrg(parsed.data);
    return c.json(result, 201);
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      return c.json(
        { error: { code: "DUPLICATE_EMAIL", message: err.message } },
        409
      );
    }
    throw err;
  }
});

export { usersRouter };
