import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type { UpdateProfileInput } from "@vetconnect/shared/validators/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VetProfile {
  license: string;
  specialties: string[];
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  is24h: boolean;
  latitude?: number;
  longitude?: number;
}

export interface OrgProfile {
  orgName: string;
  orgType: "shelter" | "rescue" | "foundation" | "other";
  address: string;
  website?: string;
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "owner" | "vet" | "org" | "admin";
  avatarUrl?: string;
  vet?: VetProfile;
  org?: OrgProfile;
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchProfile(): Promise<ProfileResponse> {
  const res = await api.get<any>("/api/users/me/profile");
  const profile = res.data || res;
  return { ...profile, avatarUrl: profile.avatarUrl || profile.image };
}

export async function updateProfile(
  data: UpdateProfileInput,
): Promise<ProfileResponse> {
  const res = await api.put<any>("/api/users/me/profile", data);
  return res.data || res;
}

export async function uploadAvatar(uri: string): Promise<{ avatarUrl: string }> {
  const token = useAuthStore.getState().token;

  // Build multipart form data
  const formData = new FormData();

  // Determine file extension and MIME type
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  formData.append("avatar", {
    uri,
    name: `avatar.${ext}`,
    type: mimeType,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Do NOT set Content-Type — fetch sets it with the boundary for multipart
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new ApiError(response.status, err.message ?? "Upload failed");
  }

  return response.json();
}
