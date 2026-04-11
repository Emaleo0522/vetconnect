import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VetListItem {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  license: string;
  specialties: string[];
  clinicName: string | null;
  clinicAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  isEmergency24h: boolean;
  bio: string | null;
  avgRating: number | null;
  reviewCount: number;
  averageRating: number;
  totalReviews: number;
  distance: number | null; // km, null if no location provided
}

export interface VetDetailResponse {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  license: string;
  specialties: string[];
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
  latitude: string | null;
  longitude: string | null;
  isEmergency24h: boolean;
  bio: string | null;
  averageRating: number;
  totalReviews: number;
}

export interface VetScheduleEntry {
  id: string;
  vetId: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  isActive: boolean;
}

export interface VetSearchParams {
  specialty?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  isEmergency?: boolean;
  query?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  total: number;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

export async function searchVets(
  params: VetSearchParams,
): Promise<PaginatedResponse<VetListItem>> {
  const searchParams = new URLSearchParams();

  if (params.specialty) searchParams.set("specialty", params.specialty);
  if (params.latitude != null) searchParams.set("lat", String(params.latitude));
  if (params.longitude != null) searchParams.set("lng", String(params.longitude));
  if (params.radius != null) searchParams.set("radius", String(params.radius));
  if (params.isEmergency != null) searchParams.set("isEmergency", String(params.isEmergency));
  if (params.query) searchParams.set("query", params.query);
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.limit != null) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const res = await api.get<any>(`/api/vets${qs ? `?${qs}` : ""}`);
  // Normalize API field names
  const items = (res.data || res.items || []).map(normalizeVet);
  return { ...res, data: items, items };
}

export async function fetchVetDetail(vetId: string): Promise<VetDetailResponse> {
  const res = await api.get<any>(`/api/vets/${vetId}`);
  return normalizeVet(res.data || res);
}

function normalizeVet(v: any) {
  return {
    ...v,
    avatarUrl: v.avatarUrl || v.image,
    averageRating: v.averageRating ?? v.avgRating ?? 0,
    totalReviews: v.totalReviews ?? v.reviewCount ?? 0,
  };
}

export async function fetchVetSchedule(vetId: string): Promise<VetScheduleEntry[]> {
  const res = await api.get<any>(`/api/vets/${vetId}/schedule`);
  return res.data?.schedule || res.data || res;
}
