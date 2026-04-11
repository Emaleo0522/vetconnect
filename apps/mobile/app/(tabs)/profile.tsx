import { View, Text, ScrollView, RefreshControl, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";

import { useAuthStore } from "@/stores/auth.store";
import { useProfileQuery, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import type { UpdateProfileInput } from "@vetconnect/shared/validators/auth";

export default function ProfileScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const { data: profile, isLoading, refetch, isRefetching } = useProfileQuery();
  const updateMutation = useUpdateProfile();
  const avatarMutation = useUploadAvatar();

  // -----------------------------------------------------------------------
  // Not authenticated — show sign-in prompt
  // -----------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-gray-200">
            <Text className="text-3xl">👤</Text>
          </View>
          <Text className="mb-2 text-xl font-semibold text-brand-text">
            Profile
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500">
            Sign in to manage your profile and preferences.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (isLoading && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm text-gray-500">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------------------
  // Error / no data fallback
  // -----------------------------------------------------------------------
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-sm text-gray-500">
            Could not load profile. Pull down to retry.
          </Text>
          <Button title="Retry" onPress={() => refetch()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleSave = (data: UpdateProfileInput) => {
    updateMutation.mutate(data);
  };

  const handleAvatarPick = (uri: string) => {
    avatarMutation.mutate(uri);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-12 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Avatar */}
          <AvatarPicker
            avatarUrl={avatarMutation.data?.avatarUrl ?? profile.avatarUrl}
            loading={avatarMutation.isPending}
            onPick={handleAvatarPick}
          />

          {/* User name heading */}
          <Text className="mb-1 text-center text-xl font-bold text-brand-text">
            {profile.name}
          </Text>
          <Text className="mb-6 text-center text-sm text-gray-500">
            {profile.email}
          </Text>

          {/* Form */}
          <ProfileForm
            profile={profile}
            onSubmit={handleSave}
            isSubmitting={updateMutation.isPending}
          />

          {/* Logout */}
          <View className="mt-6">
            <Button
              title="Sign Out"
              onPress={handleLogout}
              variant="danger"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
