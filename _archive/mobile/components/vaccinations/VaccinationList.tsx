import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Vaccination } from "@vetconnect/shared/types/vaccinations";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type VaccineStatus = "current" | "upcoming" | "overdue";

function getVaccineStatus(nextDoseDate: string | null): VaccineStatus {
  if (!nextDoseDate) return "current";

  const now = new Date();
  const next = new Date(nextDoseDate);
  const diffMs = next.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "upcoming";
  return "current";
}

const statusConfig: Record<
  VaccineStatus,
  { color: string; bg: string; label: string; icon: string }
> = {
  current: {
    color: "#28A745",
    bg: "bg-green-50",
    label: "Current",
    icon: "checkmark-circle",
  },
  upcoming: {
    color: "#E8A317",
    bg: "bg-yellow-50",
    label: "Due soon",
    icon: "warning",
  },
  overdue: {
    color: "#DC3545",
    bg: "bg-red-50",
    label: "Overdue",
    icon: "alert-circle",
  },
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function VaccinationCard({ item }: { item: Vaccination }) {
  const status = getVaccineStatus(item.nextDoseDate);
  const cfg = statusConfig[status];
  const dateStr = new Date(item.date).toLocaleDateString();
  const nextStr = item.nextDoseDate
    ? new Date(item.nextDoseDate).toLocaleDateString()
    : null;

  return (
    <View className={`mb-3 rounded-xl bg-white p-4 shadow-sm`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-base font-semibold text-brand-text">
            {item.name}
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            Applied: {dateStr}
          </Text>
          {item.batch && (
            <Text className="mt-0.5 text-xs text-gray-400">
              Batch: {item.batch}
            </Text>
          )}
          {nextStr && (
            <Text className="mt-0.5 text-sm text-gray-500">
              Next dose: {nextStr}
            </Text>
          )}
        </View>

        {/* Status badge */}
        <View
          className={`flex-row items-center rounded-full px-2.5 py-1 ${cfg.bg}`}
        >
          <Ionicons
            name={cfg.icon as keyof typeof Ionicons.glyphMap}
            size={14}
            color={cfg.color}
          />
          <Text
            className="ml-1 text-xs font-semibold"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

interface VaccinationListProps {
  vaccinations: Vaccination[];
  isLoading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export function VaccinationList({
  vaccinations,
  isLoading,
  onRefresh,
  refreshing,
}: VaccinationListProps) {
  if (isLoading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (vaccinations.length === 0) {
    return (
      <View className="items-center py-12">
        <Ionicons
          name="shield-checkmark-outline"
          size={40}
          color={colors.gray[300]}
        />
        <Text className="mt-3 text-sm text-gray-400">
          No vaccinations recorded yet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={vaccinations}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <VaccinationCard item={item} />}
      onRefresh={onRefresh}
      refreshing={refreshing}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
}
