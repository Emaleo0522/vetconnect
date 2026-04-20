import { api } from "@/lib/api";
import type { Vaccination, Treatment } from "@vetconnect/shared/types/vaccinations";
import type {
  CreateVaccinationInput,
  CreateTreatmentInput,
} from "@vetconnect/shared/validators/vaccinations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VaccinationsResponse {
  vaccinations: Vaccination[];
}

export interface TreatmentsResponse {
  treatments: Treatment[];
}

export interface VaccinationCardLink {
  url: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Vaccinations
// ---------------------------------------------------------------------------

export async function fetchVaccinations(petId: string): Promise<Vaccination[]> {
  const res = await api.get<any>(
    `/api/pets/${petId}/vaccinations`,
  );
  const data = res.data || res;
  return data.vaccinations || data || [];
}

export async function createVaccination(
  petId: string,
  input: CreateVaccinationInput,
): Promise<Vaccination> {
  const res = await api.post<any>(`/api/pets/${petId}/vaccinations`, input);
  return res.data || res;
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

export async function fetchTreatments(petId: string): Promise<Treatment[]> {
  const res = await api.get<any>(
    `/api/pets/${petId}/treatments`,
  );
  const data = res.data || res;
  return data.treatments || data || [];
}

export async function createTreatment(
  petId: string,
  input: CreateTreatmentInput,
): Promise<Treatment> {
  const res = await api.post<any>(`/api/pets/${petId}/treatments`, input);
  return res.data || res;
}

// ---------------------------------------------------------------------------
// Vaccination Card (shareable link)
// ---------------------------------------------------------------------------

export async function getVaccinationCardLink(
  petId: string,
): Promise<VaccinationCardLink> {
  const res = await api.get<any>(`/api/pets/${petId}/vaccination-card`);
  return res.data || res;
}
