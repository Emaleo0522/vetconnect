import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { router } from "expo-router";

import {
  fetchPets,
  fetchPetById,
  createPet,
  updatePet,
  deletePet,
  fetchMedicalHistory,
  linkVet,
  searchVets,
  uploadPetPhoto,
} from "@/services/pets";
import { useAuthStore } from "@/stores/auth.store";
import type { Pet, MedicalRecord } from "@vetconnect/shared/types/pets";
import type { CreatePetInput, UpdatePetInput, LinkVetInput } from "@vetconnect/shared/validators/pets";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const PETS_QUERY_KEY = ["pets"] as const;

export function petQueryKey(id: string) {
  return ["pets", id] as const;
}

export function medicalHistoryQueryKey(petId: string) {
  return ["pets", petId, "medical-history"] as const;
}

export function vetSearchQueryKey(query: string) {
  return ["vets", "search", query] as const;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export function usePetsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Pet[]>({
    queryKey: PETS_QUERY_KEY,
    queryFn: fetchPets,
    enabled: isAuthenticated,
  });
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export function usePetQuery(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<Pet>({
    queryKey: petQueryKey(id),
    queryFn: () => fetchPetById(id),
    enabled: isAuthenticated && !!id,
  });
}

// ---------------------------------------------------------------------------
// Medical History
// ---------------------------------------------------------------------------

export function useMedicalHistoryQuery(petId: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<MedicalRecord[]>({
    queryKey: medicalHistoryQueryKey(petId),
    queryFn: () => fetchMedicalHistory(petId),
    enabled: isAuthenticated && !!petId,
  });
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function useCreatePet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePetInput) => createPet(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PETS_QUERY_KEY });
      Alert.alert("Success", "Pet added successfully!");
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not create pet.");
    },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function useUpdatePet(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePetInput) => updatePet(id, data),
    onSuccess: (updated) => {
      qc.setQueryData<Pet>(petQueryKey(id), updated);
      qc.invalidateQueries({ queryKey: PETS_QUERY_KEY });
      Alert.alert("Success", "Pet updated successfully!");
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not update pet.");
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export function useDeletePet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePet(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not delete pet.");
    },
  });
}

// ---------------------------------------------------------------------------
// Link Vet
// ---------------------------------------------------------------------------

export function useLinkVet(petId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: LinkVetInput) => linkVet(petId, data),
    onSuccess: (updated) => {
      qc.setQueryData<Pet>(petQueryKey(petId), updated);
      Alert.alert("Success", "Vet linked successfully!");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not link vet.");
    },
  });
}

// ---------------------------------------------------------------------------
// Vet Search
// ---------------------------------------------------------------------------

export function useVetSearch(query: string) {
  return useQuery({
    queryKey: vetSearchQueryKey(query),
    queryFn: () => searchVets(query),
    enabled: query.length >= 2,
  });
}

// ---------------------------------------------------------------------------
// Upload Pet Photo
// ---------------------------------------------------------------------------

export function useUploadPetPhoto(petId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uri: string) => uploadPetPhoto(petId, uri),
    onSuccess: (data) => {
      qc.setQueryData<Pet>(petQueryKey(petId), (old) =>
        old ? { ...old, photo: data.photoUrl } : old,
      );
      qc.invalidateQueries({ queryKey: PETS_QUERY_KEY });
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not upload photo.");
    },
  });
}
