import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import type { UpcomingVaccine } from "@/services/dashboard";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getUrgencyColor(daysUntilDue: number): string {
  if (daysUntilDue <= 0) return colors.error; // overdue
  if (daysUntilDue <= 14) return colors.warning; // due soon
  return colors.secondary; // ok
}

function getUrgencyLabel(daysUntilDue: number): string {
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`;
  if (daysUntilDue === 0) return "Due today";
  return `In ${daysUntilDue}d`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface UpcomingVaccinesProps {
  vaccines: UpcomingVaccine[];
  maxItems?: number;
}

export function UpcomingVaccines({
  vaccines,
  maxItems = 3,
}: UpcomingVaccinesProps) {
  const displayed = vaccines.slice(0, maxItems);

  if (displayed.length === 0) {
    return (
      <View className="items-center rounded-xl bg-white p-6">
        <Ionicons name="checkmark-circle" size={32} color={colors.secondary} />
        <Text className="mt-2 text-sm text-gray-500">
          All vaccinations are up to date
        </Text>
      </View>
    );
  }

  return (
    <View>
      {displayed.map((vax) => {
        const urgencyColor = getUrgencyColor(vax.daysUntilDue);
        return (
          <Pressable
            key={vax.id}
            onPress={() =>
              router.push(`/(tabs)/pets/${vax.petId}/vaccinations` as never)
            }
            className="mb-2 flex-row items-center rounded-xl bg-white p-4 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={`${vax.vaccineName} for ${vax.petName}, ${getUrgencyLabel(vax.daysUntilDue)}`}
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: urgencyColor + "15" }}
            >
              <Ionicons
                name="medical"
                size={20}
                color={urgencyColor}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-brand-text">
                {vax.vaccineName}
              </Text>
              <Text className="text-xs text-gray-500">
                {vax.petName} - {new Date(vax.nextDoseDate).toLocaleDateString()}
              </Text>
            </View>
            <View
              className="rounded-full px-2 py-1"
              style={{ backgroundColor: urgencyColor + "15" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: urgencyColor }}
              >
                {getUrgencyLabel(vax.daysUntilDue)}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {vaccines.length > maxItems && (
        <Pressable
          onPress={() => router.push("/(tabs)/pets" as never)}
          className="mt-1 items-center py-2 active:opacity-70"
        >
          <Text className="text-sm font-medium text-brand-primary">
            View all vaccinations
          </Text>
        </Pressable>
      )}
    </View>
  );
}
