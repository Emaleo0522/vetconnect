import { db } from "../db/client.js";
import { users } from "../db/schema/auth.js";
import {
  veterinarianProfiles,
  organizationProfiles,
} from "../db/schema/profiles.js";
import { eq } from "drizzle-orm";
import type { UserRole } from "../middleware/auth.js";
import type { UpdateProfileInput } from "@vetconnect/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  image: string | null;
  createdAt: Date;
  // Vet-specific
  vetProfile?: {
    license: string;
    specialties: string[];
    clinicName: string | null;
    clinicAddress: string | null;
    clinicPhone: string | null;
    latitude: string | null;
    longitude: string | null;
    isEmergency24h: boolean;
    bio: string | null;
  } | null;
  // Org-specific
  orgProfile?: {
    orgName: string;
    orgType: string | null;
    address: string | null;
    website: string | null;
    description: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// getProfileByUserId — returns full profile based on role
// ---------------------------------------------------------------------------

export async function getProfileByUserId(
  userId: string,
  role: UserRole
): Promise<UserProfile | null> {
  // Get base user data
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) return null;

  const user = userRows[0];
  const profile: UserProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role ?? "owner",
    phone: user.phone ?? null,
    image: user.image ?? null,
    createdAt: user.createdAt,
  };

  // Fetch role-specific profile
  if (role === "vet") {
    const vetRows = await db
      .select()
      .from(veterinarianProfiles)
      .where(eq(veterinarianProfiles.userId, userId))
      .limit(1);

    if (vetRows.length > 0) {
      const vp = vetRows[0];
      profile.vetProfile = {
        license: vp.license,
        specialties: (vp.specialties as string[]) ?? [],
        clinicName: vp.clinicName,
        clinicAddress: vp.clinicAddress,
        clinicPhone: vp.clinicPhone,
        latitude: vp.latitude,
        longitude: vp.longitude,
        isEmergency24h: vp.isEmergency24h,
        bio: vp.bio,
      };
    }
  } else if (role === "org") {
    const orgRows = await db
      .select()
      .from(organizationProfiles)
      .where(eq(organizationProfiles.userId, userId))
      .limit(1);

    if (orgRows.length > 0) {
      const op = orgRows[0];
      profile.orgProfile = {
        orgName: op.orgName,
        orgType: op.orgType,
        address: op.address,
        website: op.website,
        description: op.description,
      };
    }
  }

  return profile;
}

// ---------------------------------------------------------------------------
// updateProfile — updates allowed fields based on role
// ---------------------------------------------------------------------------

export async function updateProfile(
  userId: string,
  role: UserRole,
  input: UpdateProfileInput
): Promise<UserProfile | null> {
  const now = new Date();

  // Update base user fields (name, phone, avatarUrl) — always allowed
  const baseUpdate: Record<string, unknown> = { updatedAt: now };
  if (input.name !== undefined) baseUpdate.name = input.name;
  if (input.phone !== undefined) baseUpdate.phone = input.phone;
  if (input.avatarUrl !== undefined) baseUpdate.image = input.avatarUrl;

  if (Object.keys(baseUpdate).length > 1) {
    await db.update(users).set(baseUpdate).where(eq(users.id, userId));
  }

  // Update vet-specific fields (only for vet role)
  if (role === "vet") {
    const vetUpdate: Record<string, unknown> = { updatedAt: now };
    if (input.specialties !== undefined) vetUpdate.specialties = input.specialties;
    if (input.clinicName !== undefined) vetUpdate.clinicName = input.clinicName;
    if (input.clinicAddress !== undefined)
      vetUpdate.clinicAddress = input.clinicAddress;
    if (input.clinicPhone !== undefined) vetUpdate.clinicPhone = input.clinicPhone;
    if (input.latitude !== undefined)
      vetUpdate.latitude = input.latitude.toString();
    if (input.longitude !== undefined)
      vetUpdate.longitude = input.longitude.toString();

    if (Object.keys(vetUpdate).length > 1) {
      await db
        .update(veterinarianProfiles)
        .set(vetUpdate)
        .where(eq(veterinarianProfiles.userId, userId));
    }
  }

  // Update org-specific fields (only for org role)
  if (role === "org") {
    const orgUpdate: Record<string, unknown> = { updatedAt: now };
    if (input.orgName !== undefined) orgUpdate.orgName = input.orgName;
    if (input.website !== undefined) orgUpdate.website = input.website;

    if (Object.keys(orgUpdate).length > 1) {
      await db
        .update(organizationProfiles)
        .set(orgUpdate)
        .where(eq(organizationProfiles.userId, userId));
    }
  }

  // Return updated profile
  return getProfileByUserId(userId, role);
}

// ---------------------------------------------------------------------------
// updateAvatarUrl — sets the image field on the user record
// ---------------------------------------------------------------------------

export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string
): Promise<void> {
  await db
    .update(users)
    .set({ image: avatarUrl, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
