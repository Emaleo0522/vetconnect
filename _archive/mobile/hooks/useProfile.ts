import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import {
  fetchProfile,
  updateProfile,
  uploadAvatar,
  type ProfileResponse,
} from "@/services/profile";
import { useAuthStore } from "@/stores/auth.store";
import type { UpdateProfileInput } from "@vetconnect/shared/validators/auth";

// ---------------------------------------------------------------------------
// Query key
// ---------------------------------------------------------------------------

export const PROFILE_QUERY_KEY = ["profile", "me"] as const;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProfileQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery<ProfileResponse>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => updateProfile(data),
    onSuccess: (updated) => {
      qc.setQueryData<ProfileResponse>(PROFILE_QUERY_KEY, updated);
      Alert.alert("Success", "Profile updated successfully.");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not save changes.");
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (uri: string) => uploadAvatar(uri),
    onSuccess: (data) => {
      // Optimistically patch the cached profile with the new avatar URL
      qc.setQueryData<ProfileResponse>(PROFILE_QUERY_KEY, (old) =>
        old ? { ...old, avatarUrl: data.avatarUrl } : old,
      );
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message ?? "Could not upload photo.");
    },
  });
}
