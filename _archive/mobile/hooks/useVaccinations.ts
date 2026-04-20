import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import {
  fetchVaccinations,
  createVaccination,
  fetchTreatments,
  createTreatment,
  getVaccinationCardLink,
} from "@/services/vaccinations";
import { useAuthStore } from "@/stores/auth.store";
import type { Vaccination, Treatment } from "@vetconnect/shared/types/vaccinations";
import type {
  CreateVaccinationInput,
  CreateTreatmentInput,
} from "@vetconnect/shared/validators/vaccinations";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export function vaccinationsQueryKey(petId: string) {
  return ["pets", petId, "vaccinations"] as const;
}

export function treatmentsQueryKey(petId: string) {
  return ["pets", petId, "treatments"] as const;
}

// ---------------------------------------------------------------------------
// Vaccinations
// ---------------------------------------------------------------------------

export function useVaccinationsQuery(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Vaccination[]>({
    queryKey: vaccinationsQueryKey(petId),
    queryFn: () => fetchVaccinations(petId),
    enabled: isAuthenticated && !!petId,
  });
}

export function useCreateVaccination(petId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVaccinationInput) =>
      createVaccination(petId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: vaccinationsQueryKey(petId) });
      Alert.alert("Success", "Vaccination added successfully!");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not add vaccination.");
    },
  });
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export function useTreatmentsQuery(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Treatment[]>({
    queryKey: treatmentsQueryKey(petId),
    queryFn: () => fetchTreatments(petId),
    enabled: isAuthenticated && !!petId,
  });
}

export function useCreateTreatment(petId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTreatmentInput) => createTreatment(petId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: treatmentsQueryKey(petId) });
      Alert.alert("Success", "Treatment added successfully!");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not add treatment.");
    },
  });
}

// ---------------------------------------------------------------------------
// Share vaccination card
// ---------------------------------------------------------------------------

export function useVaccinationCardLink(petId: string) {
  return useMutation({
    mutationFn: () => getVaccinationCardLink(petId),
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not generate link.");
    },
  });
}
