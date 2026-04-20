import { db } from "../db/client.js";
import { favorites } from "../db/schema/appointments.js";
import { veterinarianProfiles } from "../db/schema/profiles.js";
import { users } from "../db/schema/auth.js";
import { eq, and, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// listFavorites — returns vet profiles favorited by a user
// ---------------------------------------------------------------------------

export async function listFavorites(userId: string) {
  return db
    .select({
      favoriteId: favorites.id,
      createdAt: favorites.createdAt,
      vetProfileId: veterinarianProfiles.id,
      vetName: users.name,
      vetImage: users.image,
      clinicName: veterinarianProfiles.clinicName,
      clinicAddress: veterinarianProfiles.clinicAddress,
      specialties: veterinarianProfiles.specialties,
      isEmergency24h: veterinarianProfiles.isEmergency24h,
    })
    .from(favorites)
    .leftJoin(
      veterinarianProfiles,
      eq(favorites.vetProfileId, veterinarianProfiles.id)
    )
    .leftJoin(users, eq(veterinarianProfiles.userId, users.id))
    .where(eq(favorites.userId, userId))
    .orderBy(favorites.createdAt);
}

// ---------------------------------------------------------------------------
// addFavorite — add a vet to favorites, idempotent
// ---------------------------------------------------------------------------

export async function addFavorite(userId: string, vetProfileId: string) {
  // Verify vet profile exists
  const vetProfile = await db
    .select({ id: veterinarianProfiles.id })
    .from(veterinarianProfiles)
    .where(eq(veterinarianProfiles.id, vetProfileId))
    .limit(1);

  if (vetProfile.length === 0) return { error: "VET_NOT_FOUND" };

  // Check if already favorited
  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.vetProfileId, vetProfileId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { data: existing[0], already: true };
  }

  const [created] = await db
    .insert(favorites)
    .values({
      id: crypto.randomUUID(),
      userId,
      vetProfileId,
    })
    .returning();

  return { data: created };
}

// ---------------------------------------------------------------------------
// removeFavorite — remove vet from favorites
// ---------------------------------------------------------------------------

export async function removeFavorite(userId: string, vetProfileId: string) {
  const deleted = await db
    .delete(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.vetProfileId, vetProfileId)
      )
    )
    .returning({ id: favorites.id });

  return deleted.length > 0;
}

// ---------------------------------------------------------------------------
// isFavorite — check if a vet is favorited by a user
// ---------------------------------------------------------------------------

export async function isFavorite(userId: string, vetProfileId: string): Promise<boolean> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.vetProfileId, vetProfileId)
      )
    );

  return (result[0]?.count ?? 0) > 0;
}
