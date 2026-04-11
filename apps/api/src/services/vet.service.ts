import { db } from "../db/client.js";
import { users } from "../db/schema/auth.js";
import { veterinarianProfiles } from "../db/schema/profiles.js";
import { veterinaryReviews } from "../db/schema/reviews.js";
import { eq, and, sql, gt, ilike, or } from "drizzle-orm";
import type { SearchVetsInput } from "@vetconnect/shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VetListItem {
  id: string;
  name: string;
  image: string | null;
  specialties: string[];
  clinicName: string | null;
  clinicAddress: string | null;
  isEmergency24h: boolean;
  avgRating: number | null;
  reviewCount: number;
  distance?: number | null;
}

interface VetDetail extends VetListItem {
  email: string;
  phone: string | null;
  license: string;
  clinicPhone: string | null;
  latitude: string | null;
  longitude: string | null;
  bio: string | null;
  createdAt: Date;
}

interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// searchVets — paginated listing with filters
// ---------------------------------------------------------------------------

export async function searchVets(
  input: SearchVetsInput
): Promise<PaginatedResult<VetListItem>> {
  const {
    specialty,
    latitude,
    longitude,
    radius,
    isEmergency,
    query,
    cursor,
    limit,
  } = input;

  // Build conditions array
  const conditions = [eq(users.role, "vet")];

  // Cursor-based pagination (id > cursor)
  if (cursor) {
    conditions.push(gt(veterinarianProfiles.id, cursor));
  }

  // Filter by specialty (jsonb containment)
  if (specialty) {
    conditions.push(
      sql`${veterinarianProfiles.specialties}::jsonb @> ${JSON.stringify([specialty])}::jsonb`
    );
  }

  // Filter by emergency 24h
  if (isEmergency !== undefined) {
    conditions.push(eq(veterinarianProfiles.isEmergency24h, isEmergency));
  }

  // Filter by text search (name or clinic name)
  if (query) {
    const pattern = `%${query}%`;
    conditions.push(
      or(
        ilike(users.name, pattern),
        ilike(veterinarianProfiles.clinicName, pattern)
      )!
    );
  }

  // Haversine distance calculation (only when lat/lng provided)
  const hasGeo =
    latitude !== undefined && longitude !== undefined;

  const distanceExpr = hasGeo
    ? sql<number>`6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${latitude})) * cos(radians(${veterinarianProfiles.latitude}::float8))
          * cos(radians(${veterinarianProfiles.longitude}::float8) - radians(${longitude}))
          + sin(radians(${latitude})) * sin(radians(${veterinarianProfiles.latitude}::float8))
        ))
      )`
    : null;

  // Filter by radius (only when geo is provided)
  if (hasGeo && radius) {
    conditions.push(
      sql`${veterinarianProfiles.latitude} IS NOT NULL AND ${veterinarianProfiles.longitude} IS NOT NULL`
    );
    conditions.push(
      sql`6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(${latitude})) * cos(radians(${veterinarianProfiles.latitude}::float8))
          * cos(radians(${veterinarianProfiles.longitude}::float8) - radians(${longitude}))
          + sin(radians(${latitude})) * sin(radians(${veterinarianProfiles.latitude}::float8))
        ))
      ) <= ${radius}`
    );
  }

  // Subquery for avg rating and review count
  const ratingSubquery = sql<number>`(
    SELECT COALESCE(AVG(${veterinaryReviews.rating})::float8, 0)
    FROM ${veterinaryReviews}
    WHERE ${veterinaryReviews.vetId} = ${users.id}
  )`;

  const reviewCountSubquery = sql<number>`(
    SELECT COUNT(*)::int
    FROM ${veterinaryReviews}
    WHERE ${veterinaryReviews.vetId} = ${users.id}
  )`;

  // Build select columns
  const selectColumns: Record<string, unknown> = {
    id: veterinarianProfiles.id,
    userId: users.id,
    name: users.name,
    image: users.image,
    specialties: veterinarianProfiles.specialties,
    clinicName: veterinarianProfiles.clinicName,
    clinicAddress: veterinarianProfiles.clinicAddress,
    isEmergency24h: veterinarianProfiles.isEmergency24h,
    avgRating: ratingSubquery,
    reviewCount: reviewCountSubquery,
  };

  if (distanceExpr) {
    selectColumns.distance = distanceExpr;
  }

  const rows = await db
    .select(selectColumns as any)
    .from(users)
    .innerJoin(
      veterinarianProfiles,
      eq(veterinarianProfiles.userId, users.id)
    )
    .where(and(...conditions))
    .orderBy(
      distanceExpr
        ? sql`${distanceExpr} ASC`
        : sql`${veterinarianProfiles.id} ASC`
    )
    .limit(limit + 1); // fetch one extra to determine if there's a next page

  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows) as any[];

  const mapped: VetListItem[] = items.map((r: any) => ({
    id: r.id,
    name: r.name,
    image: r.image,
    specialties: (r.specialties as string[]) ?? [],
    clinicName: r.clinicName,
    clinicAddress: r.clinicAddress,
    isEmergency24h: r.isEmergency24h,
    avgRating: r.avgRating > 0 ? Math.round(r.avgRating * 10) / 10 : null,
    reviewCount: r.reviewCount ?? 0,
    ...(r.distance !== undefined
      ? { distance: Math.round(r.distance * 100) / 100 }
      : {}),
  }));

  return {
    items: mapped,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// ---------------------------------------------------------------------------
// getVetById — full profile with avg rating
// ---------------------------------------------------------------------------

export async function getVetById(vetProfileId: string): Promise<VetDetail | null> {
  const ratingSubquery = sql<number>`(
    SELECT COALESCE(AVG(${veterinaryReviews.rating})::float8, 0)
    FROM ${veterinaryReviews}
    WHERE ${veterinaryReviews.vetId} = ${users.id}
  )`;

  const reviewCountSubquery = sql<number>`(
    SELECT COUNT(*)::int
    FROM ${veterinaryReviews}
    WHERE ${veterinaryReviews.vetId} = ${users.id}
  )`;

  const rows = await db
    .select({
      id: veterinarianProfiles.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      image: users.image,
      license: veterinarianProfiles.license,
      specialties: veterinarianProfiles.specialties,
      clinicName: veterinarianProfiles.clinicName,
      clinicAddress: veterinarianProfiles.clinicAddress,
      clinicPhone: veterinarianProfiles.clinicPhone,
      latitude: veterinarianProfiles.latitude,
      longitude: veterinarianProfiles.longitude,
      isEmergency24h: veterinarianProfiles.isEmergency24h,
      bio: veterinarianProfiles.bio,
      createdAt: users.createdAt,
      avgRating: ratingSubquery,
      reviewCount: reviewCountSubquery,
    })
    .from(users)
    .innerJoin(
      veterinarianProfiles,
      eq(veterinarianProfiles.userId, users.id)
    )
    .where(
      and(
        eq(veterinarianProfiles.id, vetProfileId),
        eq(users.role, "vet")
      )
    )
    .limit(1);

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    image: r.image ?? null,
    license: r.license,
    specialties: (r.specialties as string[]) ?? [],
    clinicName: r.clinicName,
    clinicAddress: r.clinicAddress,
    clinicPhone: r.clinicPhone,
    latitude: r.latitude,
    longitude: r.longitude,
    isEmergency24h: r.isEmergency24h,
    bio: r.bio,
    avgRating: r.avgRating > 0 ? Math.round(r.avgRating * 10) / 10 : null,
    reviewCount: r.reviewCount ?? 0,
    createdAt: r.createdAt,
  };
}
