import { api } from "@/lib/api";
import type { Pet } from "@vetconnect/shared/types/pets";
import type { Vaccination } from "@vetconnect/shared/types/vaccinations";
import type { VetListItem, PaginatedResponse } from "./vets";
import type { ReviewItem, PaginatedReviews } from "./reviews";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Upcoming vaccine with pet info attached */
export interface UpcomingVaccine {
  id: string;
  vaccineName: string;
  nextDoseDate: string;
  petId: string;
  petName: string;
  petPhoto: string | null;
  daysUntilDue: number;
}

/** Profile completeness check for vets */
export interface VetProfileCompleteness {
  hasPhoto: boolean;
  hasSchedule: boolean;
  hasSpecialties: boolean;
  hasBio: boolean;
  completionPercent: number;
}

// ---------------------------------------------------------------------------
// Owner dashboard
// ---------------------------------------------------------------------------

export async function fetchOwnerPets(): Promise<Pet[]> {
  const res = await api.get<any>("/api/pets");
  const data = res.data || res;
  return data.items || data.pets || data || [];
}

export async function fetchUpcomingVaccines(): Promise<UpcomingVaccine[]> {
  try {
    // Try dedicated dashboard endpoint first
    const res = await api.get<any>(
      "/api/dashboard/upcoming-vaccines",
    );
    const data = res.data || res;
    return data.vaccines || data || [];
  } catch {
    // Fallback: fetch pets then vaccinations manually
    return fetchUpcomingVaccinesFallback();
  }
}

async function fetchUpcomingVaccinesFallback(): Promise<UpcomingVaccine[]> {
  const pets = await fetchOwnerPets();
  const now = new Date();
  const upcoming: UpcomingVaccine[] = [];

  for (const pet of pets) {
    try {
      const res = await api.get<any>(
        `/api/pets/${pet.id}/vaccinations`,
      );
      const vacData = res.data || res;
      const vaccinations = vacData.vaccinations || vacData || [];
      for (const vax of vaccinations) {
        if (vax.nextDoseDate) {
          const nextDate = new Date(vax.nextDoseDate);
          const daysUntilDue = Math.ceil(
            (nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          // Show vaccines due within 90 days (past or future)
          if (daysUntilDue <= 90) {
            upcoming.push({
              id: vax.id,
              vaccineName: vax.name,
              nextDoseDate: vax.nextDoseDate,
              petId: pet.id,
              petName: pet.name,
              petPhoto: pet.photo,
              daysUntilDue,
            });
          }
        }
      }
    } catch {
      // Skip pet if vaccinations fail to load
    }
  }

  // Sort by urgency: overdue first, then soonest
  upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return upcoming.slice(0, 5);
}

export async function fetchNearbyVets(
  lat?: number,
  lng?: number,
): Promise<VetListItem[]> {
  const params = new URLSearchParams();
  if (lat != null) params.set("lat", String(lat));
  if (lng != null) params.set("lng", String(lng));
  params.set("limit", "3");

  const qs = params.toString();
  const res = await api.get<any>(
    `/api/vets${qs ? `?${qs}` : ""}`,
  );
  const data = res.data || res;
  return data.items || data.data || data || [];
}

// ---------------------------------------------------------------------------
// Vet dashboard
// ---------------------------------------------------------------------------

/** Fetch pets linked to this vet */
export async function fetchVetPatients(): Promise<
  Array<Pet & { ownerName?: string }>
> {
  try {
    const res = await api.get<any>(
      "/api/dashboard/vet-patients",
    );
    const data = res.data || res;
    return data.patients || data || [];
  } catch {
    // Fallback: return empty if endpoint doesn't exist yet
    return [];
  }
}

/** Fetch recent reviews for the logged-in vet */
export async function fetchVetOwnReviews(
  vetId: string,
): Promise<ReviewItem[]> {
  const res = await api.get<any>(
    `/api/vets/${vetId}/reviews?limit=3`,
  );
  const data = res.data || res;
  return data.items || data.data || data || [];
}

/** Calculate profile completeness */
export function calculateProfileCompleteness(user: {
  avatarUrl?: string | null;
  bio?: string | null;
  specialties?: string[];
  schedule?: Array<{ isActive: boolean }>;
}): VetProfileCompleteness {
  const hasPhoto = Boolean(user.avatarUrl);
  const hasSpecialties = Boolean(user.specialties && user.specialties.length > 0);
  const hasBio = Boolean(user.bio);
  const hasSchedule = Boolean(
    user.schedule && user.schedule.some((s) => s.isActive),
  );

  const items = [hasPhoto, hasSchedule, hasSpecialties, hasBio];
  const completionPercent = Math.round(
    (items.filter(Boolean).length / items.length) * 100,
  );

  return { hasPhoto, hasSchedule, hasSpecialties, hasBio, completionPercent };
}
