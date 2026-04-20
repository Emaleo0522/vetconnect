import { db } from "../db/client.js";
import { lostReports, sightings } from "../db/schema/lost.js";
import { pets } from "../db/schema/pets.js";
import { users } from "../db/schema/auth.js";
import { eq, and, desc, sql, gte, lt, or } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Geolocation jitter (security-spec: ±200–500m)
// ---------------------------------------------------------------------------

/**
 * Applies a random jitter of 200–500m to lat/lng coordinates.
 * 1 degree latitude ≈ 111km. 1 degree longitude ≈ 111km * cos(lat).
 */
function applyGeoJitter(lat: number, lng: number): { lat: number; lng: number } {
  const minMeters = 200;
  const maxMeters = 500;

  const jitterMeters = minMeters + Math.random() * (maxMeters - minMeters);
  const angle = Math.random() * 2 * Math.PI;

  const deltaLat = (jitterMeters * Math.cos(angle)) / 111_000;
  const deltaLng =
    (jitterMeters * Math.sin(angle)) /
    (111_000 * Math.cos((lat * Math.PI) / 180));

  return {
    lat: lat + deltaLat,
    lng: lng + deltaLng,
  };
}

// ---------------------------------------------------------------------------
// Haversine distance (km) — for radius filtering in pure SQL
// This is used as a pure TS filter after fetching since we don't have PostGIS.
// ---------------------------------------------------------------------------

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateLostReportInput {
  petId: string;
  description: string;
  lastSeenAt: Date;
  lat: number;
  lng: number;
  contactPreference?: "app" | "phone" | "email";
  reward?: string;
}

export interface ListLostReportsQuery {
  species?: string;
  status?: "active" | "found" | "closed";
  lat?: number;
  lng?: number;
  radius?: number; // km
  page?: number;
  limit?: number;
}

export interface CreateSightingInput {
  description: string;
  lat: number;
  lng: number;
  photoUrl?: string;
}

// ---------------------------------------------------------------------------
// listLostReports — public, with optional geo filter
// ---------------------------------------------------------------------------

export async function listLostReports(query: ListLostReportsQuery) {
  const page = query.page ?? 1;
  const limit = Math.min(query.limit ?? 20, 50);
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (query.status) {
    conditions.push(eq(lostReports.status, query.status));
  } else {
    // Default: only active reports
    conditions.push(eq(lostReports.status, "active"));
  }

  // Fetch with pet + owner data
  const rows = await db
    .select({
      id: lostReports.id,
      ownerId: lostReports.ownerId,
      petId: lostReports.petId,
      description: lostReports.description,
      lastSeenAt: lostReports.lastSeenAt,
      lastSeenLat: lostReports.lastSeenLat,
      lastSeenLng: lostReports.lastSeenLng,
      status: lostReports.status,
      contactPreference: lostReports.contactPreference,
      reward: lostReports.reward,
      createdAt: lostReports.createdAt,
      // Pet info
      petName: pets.name,
      petSpecies: pets.species,
      petPhoto: pets.photo,
      petBreed: pets.breed,
      petColor: pets.color,
      // Owner contact (only name, not email)
      ownerName: users.name,
      ownerPhone: users.phone,
    })
    .from(lostReports)
    .leftJoin(pets, eq(lostReports.petId, pets.id))
    .leftJoin(users, eq(lostReports.ownerId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(lostReports.createdAt));

  // Apply species filter in TS (simpler than SQL enum cast)
  let filtered = rows;
  if (query.species) {
    filtered = rows.filter((r) => r.petSpecies === query.species);
  }

  // Apply geo radius filter (haversine)
  if (query.lat !== undefined && query.lng !== undefined) {
    const radius = query.radius ?? 10;
    filtered = filtered.filter((r) => {
      const rLat = parseFloat(String(r.lastSeenLat));
      const rLng = parseFloat(String(r.lastSeenLng));
      return haversineKm(query.lat!, query.lng!, rLat, rLng) <= radius;
    });
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    items: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ---------------------------------------------------------------------------
// getLostReportById
// ---------------------------------------------------------------------------

export async function getLostReportById(id: string) {
  const rows = await db
    .select({
      id: lostReports.id,
      ownerId: lostReports.ownerId,
      petId: lostReports.petId,
      description: lostReports.description,
      lastSeenAt: lostReports.lastSeenAt,
      lastSeenLat: lostReports.lastSeenLat,
      lastSeenLng: lostReports.lastSeenLng,
      status: lostReports.status,
      contactPreference: lostReports.contactPreference,
      reward: lostReports.reward,
      createdAt: lostReports.createdAt,
      updatedAt: lostReports.updatedAt,
      petName: pets.name,
      petSpecies: pets.species,
      petPhoto: pets.photo,
      petBreed: pets.breed,
      petColor: pets.color,
      petSex: pets.sex,
      ownerName: users.name,
      ownerPhone: users.phone,
    })
    .from(lostReports)
    .leftJoin(pets, eq(lostReports.petId, pets.id))
    .leftJoin(users, eq(lostReports.ownerId, users.id))
    .where(eq(lostReports.id, id))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// createLostReport — applies geo jitter before persisting
// ---------------------------------------------------------------------------

export async function createLostReport(
  ownerId: string,
  input: CreateLostReportInput
) {
  // Verify pet belongs to owner
  const pet = await db
    .select({ id: pets.id })
    .from(pets)
    .where(and(eq(pets.id, input.petId), eq(pets.ownerId, ownerId)))
    .limit(1);

  if (pet.length === 0) {
    return { error: "PET_NOT_FOUND" };
  }

  // Apply geolocation jitter
  const jittered = applyGeoJitter(input.lat, input.lng);

  const id = crypto.randomUUID();
  const [report] = await db
    .insert(lostReports)
    .values({
      id,
      ownerId,
      petId: input.petId,
      description: input.description,
      lastSeenAt: input.lastSeenAt,
      lastSeenLat: String(jittered.lat.toFixed(7)),
      lastSeenLng: String(jittered.lng.toFixed(7)),
      status: "active",
      contactPreference: input.contactPreference ?? "app",
      reward: input.reward ?? null,
    })
    .returning();

  return { data: report };
}

// ---------------------------------------------------------------------------
// updateLostReport — owner only
// ---------------------------------------------------------------------------

export async function updateLostReport(
  id: string,
  ownerId: string,
  input: Partial<CreateLostReportInput>
) {
  const report = await db
    .select({ ownerId: lostReports.ownerId })
    .from(lostReports)
    .where(eq(lostReports.id, id))
    .limit(1);

  if (report.length === 0) return { error: "NOT_FOUND" };
  if (report[0].ownerId !== ownerId) return { error: "FORBIDDEN" };

  const updateData: Record<string, any> = { updatedAt: new Date() };
  if (input.description) updateData.description = input.description;
  if (input.contactPreference) updateData.contactPreference = input.contactPreference;
  if (input.reward !== undefined) updateData.reward = input.reward;
  if (input.lastSeenAt) updateData.lastSeenAt = input.lastSeenAt;
  if (input.lat !== undefined && input.lng !== undefined) {
    const jittered = applyGeoJitter(input.lat, input.lng);
    updateData.lastSeenLat = String(jittered.lat.toFixed(7));
    updateData.lastSeenLng = String(jittered.lng.toFixed(7));
  }

  const [updated] = await db
    .update(lostReports)
    .set(updateData)
    .where(eq(lostReports.id, id))
    .returning();

  return { data: updated };
}

// ---------------------------------------------------------------------------
// markFound — owner only, sets status = found
// ---------------------------------------------------------------------------

export async function markFound(id: string, ownerId: string) {
  const report = await db
    .select({ ownerId: lostReports.ownerId, status: lostReports.status })
    .from(lostReports)
    .where(eq(lostReports.id, id))
    .limit(1);

  if (report.length === 0) return { error: "NOT_FOUND" };
  if (report[0].ownerId !== ownerId) return { error: "FORBIDDEN" };
  if (report[0].status === "found") return { error: "ALREADY_FOUND" };

  const [updated] = await db
    .update(lostReports)
    .set({ status: "found", updatedAt: new Date() })
    .where(eq(lostReports.id, id))
    .returning();

  return { data: updated };
}

// ---------------------------------------------------------------------------
// listSightings
// ---------------------------------------------------------------------------

export async function listSightings(lostReportId: string) {
  const report = await db
    .select({ id: lostReports.id })
    .from(lostReports)
    .where(eq(lostReports.id, lostReportId))
    .limit(1);

  if (report.length === 0) return null;

  return db
    .select({
      id: sightings.id,
      lostReportId: sightings.lostReportId,
      reporterId: sightings.reporterId,
      description: sightings.description,
      lat: sightings.lat,
      lng: sightings.lng,
      photoUrl: sightings.photoUrl,
      createdAt: sightings.createdAt,
      reporterName: users.name,
    })
    .from(sightings)
    .leftJoin(users, eq(sightings.reporterId, users.id))
    .where(eq(sightings.lostReportId, lostReportId))
    .orderBy(desc(sightings.createdAt));
}

// ---------------------------------------------------------------------------
// createSighting
// ---------------------------------------------------------------------------

export async function createSighting(
  lostReportId: string,
  reporterId: string,
  input: CreateSightingInput
) {
  // Verify report exists and is active
  const report = await db
    .select({ id: lostReports.id, status: lostReports.status, ownerId: lostReports.ownerId })
    .from(lostReports)
    .where(eq(lostReports.id, lostReportId))
    .limit(1);

  if (report.length === 0) return { error: "NOT_FOUND" };
  if (report[0].status !== "active") return { error: "REPORT_CLOSED" };

  const id = crypto.randomUUID();
  const [sighting] = await db
    .insert(sightings)
    .values({
      id,
      lostReportId,
      reporterId,
      description: input.description,
      lat: String(input.lat.toFixed(7)),
      lng: String(input.lng.toFixed(7)),
      photoUrl: input.photoUrl ?? null,
    })
    .returning();

  return { data: sighting, ownerId: report[0].ownerId };
}
