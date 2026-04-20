import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type { Pet, MedicalRecord } from "@vetconnect/shared/types/pets";
import type { CreatePetInput, UpdatePetInput, LinkVetInput } from "@vetconnect/shared/validators/pets";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PetListResponse {
  pets: Pet[];
}

export interface MedicalHistoryResponse {
  records: MedicalRecord[];
}

export interface VetSearchResult {
  id: string;
  name: string;
  clinicName: string | null;
  specialties: string[];
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchPets(): Promise<Pet[]> {
  const res = await api.get<any>("/api/pets");
  return res.data?.items || res.data || res.pets || [];
}

export async function fetchPetById(id: string): Promise<Pet> {
  const res = await api.get<any>(`/api/pets/${id}`);
  return res.data || res;
}

export async function createPet(data: CreatePetInput): Promise<Pet> {
  const res = await api.post<any>("/api/pets", data);
  return res.data || res;
}

export async function updatePet(id: string, data: UpdatePetInput): Promise<Pet> {
  const res = await api.put<any>(`/api/pets/${id}`, data);
  return res.data || res;
}

export async function deletePet(id: string): Promise<void> {
  return api.delete<void>(`/api/pets/${id}`);
}

export async function fetchMedicalHistory(petId: string): Promise<MedicalRecord[]> {
  const res = await api.get<any>(`/api/pets/${petId}/medical-history`);
  return res.data?.records || res.data || res.records || [];
}

export async function linkVet(petId: string, data: LinkVetInput): Promise<Pet> {
  const res = await api.put<any>(`/api/pets/${petId}/vet-link`, data);
  return res.data || res;
}

export async function searchVets(query: string): Promise<VetSearchResult[]> {
  const res = await api.get<{ vets: VetSearchResult[] }>(`/api/vets/search?q=${encodeURIComponent(query)}`);
  return res.vets;
}

export async function uploadPetPhoto(petId: string, uri: string): Promise<{ photoUrl: string }> {
  const token = useAuthStore.getState().token;

  const formData = new FormData();
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  formData.append("photo", {
    uri,
    name: `pet-photo.${ext}`,
    type: mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/photo`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new ApiError(response.status, err.message ?? "Upload failed");
  }

  return response.json();
}
