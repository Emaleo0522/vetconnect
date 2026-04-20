import { db } from "../db/client.js";
import { users } from "../db/schema/auth.js";
import {
  veterinarianProfiles,
  organizationProfiles,
} from "../db/schema/profiles.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { auth } from "../lib/auth.js";
import type {
  RegisterOwnerInput,
  RegisterVetInput,
  RegisterOrgInput,
} from "@vetconnect/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result of a registration operation.
 * Returns only the user — session/cookie is established when the client
 * subsequently calls POST /api/auth/sign-in/email.
 */
interface RegisterResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if email is already taken. Returns true if duplicate.
 */
async function isEmailTaken(email: string): Promise<boolean> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return existing.length > 0;
}

/**
 * Create a user via Better Auth's programmatic API, then update the role
 * directly in DB. Better Auth's admin plugin manages the role column and
 * does not allow setting it via the sign-up body, so we create the user
 * first (defaults to "owner") and then update if needed.
 *
 * NOTE: This does NOT create a session. The client must call
 * POST /api/auth/sign-in/email after registration to get the httpOnly cookie.
 */
async function createUserWithRole(body: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: string;
}): Promise<{ id: string; email: string; name: string }> {
  // Use auth.api.signUpEmail (programmatic, no HTTP round-trip)
  // This calls Better Auth's internal handler directly.
  const signUpResponse = await auth.api.signUpEmail({
    body: {
      name: body.name,
      email: body.email.toLowerCase(),
      password: body.password,
    },
    // asResponse: false → returns the parsed data object directly
    asResponse: false,
  });

  if (!signUpResponse || !signUpResponse.user) {
    throw new Error("Failed to create user account");
  }

  const createdUser = signUpResponse.user as { id: string; email: string; name: string };

  // Set role directly in DB (admin plugin manages the role column)
  if (body.role && body.role !== "owner") {
    await db
      .update(users)
      .set({ role: body.role as "owner" | "vet" | "org" | "admin" })
      .where(eq(users.id, createdUser.id));
  }

  return createdUser;
}

// ---------------------------------------------------------------------------
// Register Owner
// ---------------------------------------------------------------------------

export async function registerOwner(
  input: RegisterOwnerInput
): Promise<RegisterResult> {
  if (await isEmailTaken(input.email)) {
    throw new DuplicateEmailError();
  }

  const user = await createUserWithRole({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone ?? null,
    role: "owner",
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "owner",
    },
  };
}

// ---------------------------------------------------------------------------
// Register Vet
// ---------------------------------------------------------------------------

export async function registerVet(
  input: RegisterVetInput
): Promise<RegisterResult> {
  if (await isEmailTaken(input.email)) {
    throw new DuplicateEmailError();
  }

  const user = await createUserWithRole({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone ?? null,
    role: "vet",
  });

  // Create veterinarian profile
  await db.insert(veterinarianProfiles).values({
    id: randomUUID(),
    userId: user.id,
    license: input.license,
    specialties: input.specialties,
    clinicName: input.clinicName,
    clinicAddress: input.clinicAddress,
    clinicPhone: input.clinicPhone,
    latitude: input.latitude.toString(),
    longitude: input.longitude.toString(),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "vet",
    },
  };
}

// ---------------------------------------------------------------------------
// Register Org
// ---------------------------------------------------------------------------

export async function registerOrg(
  input: RegisterOrgInput
): Promise<RegisterResult> {
  if (await isEmailTaken(input.email)) {
    throw new DuplicateEmailError();
  }

  const user = await createUserWithRole({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone ?? null,
    role: "org",
  });

  // Create organization profile
  await db.insert(organizationProfiles).values({
    id: randomUUID(),
    userId: user.id,
    orgName: input.orgName,
    orgType: input.orgType,
    address: input.address,
    website: input.website ?? null,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: "org",
    },
  };
}

// ---------------------------------------------------------------------------
// Custom Errors
// ---------------------------------------------------------------------------

export class DuplicateEmailError extends Error {
  public readonly statusCode = 409;
  constructor() {
    super("Email is already registered");
    this.name = "DuplicateEmailError";
  }
}
