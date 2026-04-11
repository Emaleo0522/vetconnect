import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/auth.store";
import { OwnerDashboard } from "@/components/home/OwnerDashboard";
import { VetDashboard } from "@/components/home/VetDashboard";
import { OrgDashboard } from "@/components/home/OrgDashboard";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Admin placeholder
// ---------------------------------------------------------------------------

function AdminDashboard() {
  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <Text className="mb-6 text-2xl font-bold text-brand-text">
        Panel de administracion
      </Text>

      <View className="items-center rounded-2xl bg-white p-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
          <Ionicons name="settings-outline" size={32} color={colors.primary} />
        </View>
        <Text className="mb-2 text-center text-lg font-bold text-brand-text">
          Proximamente
        </Text>
        <Text className="mb-6 text-center text-sm text-gray-500">
          Panel de administracion en desarrollo
        </Text>
      </View>

      {/* Placeholder stats */}
      <View className="mt-6 flex-row gap-3">
        <StatCard label="Usuarios" value="--" icon="people-outline" />
        <StatCard label="Mascotas" value="--" icon="paw-outline" />
        <StatCard label="Vets" value="--" icon="medkit-outline" />
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 items-center rounded-xl bg-white p-4">
      <Ionicons name={icon} size={24} color={colors.primary} />
      <Text className="mt-2 text-xl font-bold text-brand-text">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Home Screen — dispatches by role
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const role = useAuthStore((s) => s.role);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-brand-background" edges={["bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      {role === "owner" && <OwnerDashboard />}
      {role === "vet" && <VetDashboard />}
      {role === "org" && <OrgDashboard />}
      {!role && <OwnerDashboard />}
    </SafeAreaView>
  );
}
