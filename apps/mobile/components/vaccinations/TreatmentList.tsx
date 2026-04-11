import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Treatment, TreatmentType } from "@vetconnect/shared/types/vaccinations";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Type icons
// ---------------------------------------------------------------------------

const typeConfig: Record<
  TreatmentType,
  { icon: string; label: string; color: string }
> = {
  deworming: { icon: "bug-outline", label: "Deworming", color: "#8B5CF6" },
  surgery: { icon: "cut-outline", label: "Surgery", color: "#DC3545" },
  therapy: { icon: "fitness-outline", label: "Therapy", color: "#2B7A9E" },
  other: { icon: "ellipsis-horizontal-circle-outline", label: "Other", color: colors.gray[500] },
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function TreatmentCard({ item }: { item: Treatment }) {
  const cfg = typeConfig[item.type] ?? typeConfig.other;
  const dateStr = new Date(item.date).toLocaleDateString();

  return (
    <View className="mb-3 rounded-xl bg-white p-4 shadow-sm">
      <View className="flex-row items-start">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${cfg.color}15` }}
        >
          <Ionicons
            name={cfg.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={cfg.color}
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-brand-text">
            {item.name}
          </Text>
          <Text className="mt-0.5 text-xs font-medium" style={{ color: cfg.color }}>
            {cfg.label}
          </Text>
          <Text className="mt-1 text-sm text-gray-500">{dateStr}</Text>
          {item.notes && (
            <Text className="mt-1 text-sm text-gray-400">{item.notes}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface TreatmentListProps {
  treatments: Treatment[];
  isLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export function TreatmentList({
  treatments,
  isLoading,
  onRefresh,
  refreshing,
}: TreatmentListProps) {
  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (treatments.length === 0) {
    return (
      <View className="items-center py-12">
        <Ionicons name="medkit-outline" size={40} color={colors.gray[300]} />
        <Text className="mt-3 text-sm text-gray-400">
          No treatments recorded yet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={treatments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TreatmentCard item={item} />}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
}
