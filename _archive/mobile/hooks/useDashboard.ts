import { useQuery } from "@tanstack/react-query";

import { useAuthStore } from "@/stores/auth.store";
import {
  fetchOwnerPets,
  fetchUpcomingVaccines,
  fetchNearbyVets,
  fetchVetPatients,
  fetchVetOwnReviews,
} from "@/services/dashboard";
import type { UpcomingVaccine } from "@/services/dashboard";
import type { Pet } from "@vetconnect/shared/types/pets";
import type { VetListItem } from "@/services/vets";
import type { ReviewItem } from "@/services/reviews";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const DASHBOARD_KEYS = {
  ownerPets: ["dashboard", "owner-pets"] as const,
  upcomingVaccines: ["dashboard", "upcoming-vaccines"] as const,
  nearbyVets: (lat?: number, lng?: number) =>
    ["dashboard", "nearby-vets", lat, lng] as const,
  vetPatients: ["dashboard", "vet-patients"] as const,
  vetReviews: (vetId: string) => ["dashboard", "vet-reviews", vetId] as const,
};

// ---------------------------------------------------------------------------
// Owner hooks
// ---------------------------------------------------------------------------

export function useOwnerPetsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  return useQuery<Pet[]>({
    queryKey: DASHBOARD_KEYS.ownerPets,
    queryFn: fetchOwnerPets,
    enabled: isAuthenticated && role === "owner",
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useUpcomingVaccinesQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  return useQuery<UpcomingVaccine[]>({
    queryKey: DASHBOARD_KEYS.upcomingVaccines,
    queryFn: fetchUpcomingVaccines,
    enabled: isAuthenticated && role === "owner",
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

export function useNearbyVetsQuery(lat?: number, lng?: number) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<VetListItem[]>({
    queryKey: DASHBOARD_KEYS.nearbyVets(lat, lng),
    queryFn: () => fetchNearbyVets(lat, lng),
    enabled: isAuthenticated,
    staleTime: 15 * 60 * 1000, // 15 min
  });
}

// ---------------------------------------------------------------------------
// Vet hooks
// ---------------------------------------------------------------------------

export function useVetPatientsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  return useQuery<Array<Pet & { ownerName?: string }>>({
    queryKey: DASHBOARD_KEYS.vetPatients,
    queryFn: fetchVetPatients,
    enabled: isAuthenticated && role === "vet",
    staleTime: 5 * 60 * 1000,
  });
}

export function useVetOwnReviewsQuery(vetId: string | undefined) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.role);

  return useQuery<ReviewItem[]>({
    queryKey: DASHBOARD_KEYS.vetReviews(vetId ?? ""),
    queryFn: () => fetchVetOwnReviews(vetId!),
    enabled: isAuthenticated && role === "vet" && Boolean(vetId),
    staleTime: 5 * 60 * 1000,
  });
}
