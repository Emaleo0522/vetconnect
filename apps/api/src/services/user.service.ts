import { db } from "../db/client.js";
import { users } from "../db/schema/auth.js";
import {
  veterinarianProfiles,
  organizationProfiles,
} from "../db/schema/profiles.js";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { env } from "../lib/env.js";
import type {
  RegisterOwnerInput,
  RegisterVetInput,
  RegisterOrgInput,
} from "@vetconnect/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RegisterResult {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
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
 * Sign up a user via HTTP fetch to Better Auth's own endpoint, then
 * set the role directly in the DB. Better Auth's admin plugin manages
 * the role field and does not allow setting it via the sign-up body,
 * so we create the user first (defaults to "owner") and then update.
 */
async function signUpViaHttp(body: {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: string;
}): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
  const origin = `http://localhost:${env.PORT}`;

  // Sign up without role — admin plugin blocks it in the request body
  const { role, ...signUpBody } = body;
  const res = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": origin,
    },
    body: JSON.stringify(signUpBody),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Better Auth sign-up failed (${res.status}): ${errorBody}`);
  }

  const data = await res.json();

  if (!data || !data.user) {
    throw new Error("Failed to create user account — no user in response");
  }

  // Set role directly in DB (admin plugin manages the role column)
  if (role && role !== "owner") {
    await db
      .update(users)
      .set({ role: role as "owner" | "vet" | "org" | "admin" })
      .where(eq(users.id, data.user.id));
  }

  const token = data.token ?? "";

  return { user: data.user, token };
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

  const result = await signUpViaHttp({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone ?? null,
    role: "owner",
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: "owner",
    },
    token: result.token,
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

  const result = await signUpViaHttp({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone ?? null,
    role: "vet",
  });

  // Create veterinarian profile
  await db.insert(veterinarianProfiles).values({
    id: randomUUID(),
    userId: result.user.id,
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
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: "vet",
    },
    token: result.token,
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

  const result = await signUpViaHttp({
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    phone: input.phone ?? null,
    role: "org",
  });

  // Create organization profile
  await db.insert(organizationProfiles).values({
    id: randomUUID(),
    userId: result.user.id,
    orgName: input.orgName,
    orgType: input.orgType,
    address: input.address,
    website: input.website ?? null,
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: "org",
    },
    token: result.token,
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
