import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "@/stores/auth.store";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Org Dashboard (placeholder)
// ---------------------------------------------------------------------------

export function OrgDashboard() {
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? "Organization";

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <Text className="mb-6 text-2xl font-bold text-brand-text">
        Hola, {name}!
      </Text>

      {/* Coming soon */}
      <View className="items-center rounded-2xl bg-white p-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-secondary/10">
          <Ionicons name="shield-checkmark-outline" size={32} color={colors.secondary} />
        </View>
        <Text className="mb-2 text-center text-lg font-bold text-brand-text">
          Proximamente
        </Text>
        <Text className="text-center text-sm text-gray-500">
          Gestiona reportes de rescate desde aqui. Recibe alertas de animales en
          situacion de riesgo y coordina con veterinarios voluntarios.
        </Text>
      </View>

      {/* Feature previews */}
      <View className="mt-6 gap-3">
        <FeaturePreview
          icon="alert-circle-outline"
          title="Reportes de rescate"
          description="Recibe y gestiona reportes de la comunidad"
        />
        <FeaturePreview
          icon="people-outline"
          title="Red de voluntarios"
          description="Conecta con veterinarios que ofrecen servicio pro-bono"
        />
        <FeaturePreview
          icon="stats-chart-outline"
          title="Estadisticas de impacto"
          description="Mide el alcance de tu organizacion"
        />
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Feature preview card
// ---------------------------------------------------------------------------

function FeaturePreview({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-center rounded-xl bg-white p-4 opacity-60">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-gray-100">
        <Ionicons name={icon} size={20} color={colors.gray[400]} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-brand-text">{title}</Text>
        <Text className="text-xs text-gray-500">{description}</Text>
      </View>
      <View className="rounded-full bg-gray-100 px-2 py-1">
        <Text className="text-xs font-medium text-gray-400">Pronto</Text>
      </View>
    </View>
  );
}
