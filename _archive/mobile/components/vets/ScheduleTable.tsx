import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import type { VetScheduleEntry } from "@/services/vets";

interface ScheduleTableProps {
  schedule: VetScheduleEntry[];
  isEmergency24h: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleTable({ schedule, isEmergency24h }: ScheduleTableProps) {
  // Build a map of dayOfWeek -> entry for quick lookup
  const scheduleMap = new Map<number, VetScheduleEntry>();
  for (const entry of schedule) {
    scheduleMap.set(entry.dayOfWeek, entry);
  }

  const today = new Date().getDay();

  return (
    <View className="mt-2 bg-white px-4 py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-brand-text">
          Schedule
        </Text>
        {isEmergency24h && (
          <View className="flex-row items-center gap-1 rounded-full bg-red-50 px-2.5 py-1">
            <Ionicons name="flash" size={12} color={colors.error} />
            <Text className="text-xs font-semibold" style={{ color: colors.error }}>
              24h Emergency
            </Text>
          </View>
        )}
      </View>

      {DAY_NAMES.map((dayName, dayIndex) => {
        const entry = scheduleMap.get(dayIndex);
        const isToday = dayIndex === today;
        const isActive = entry?.isActive ?? false;

        return (
          <View
            key={dayIndex}
            className={`flex-row items-center justify-between border-b border-gray-100 py-2.5 ${
              isToday ? "bg-brand-primary/5 -mx-2 px-2 rounded-lg" : ""
            }`}
          >
            <View className="flex-row items-center gap-2">
              {isToday && (
                <View className="h-2 w-2 rounded-full bg-brand-primary" />
              )}
              <Text
                className={`text-sm ${
                  isToday ? "font-semibold text-brand-primary" : "text-gray-700"
                }`}
              >
                {DAY_SHORT[dayIndex]}
              </Text>
            </View>

            {isActive && entry ? (
              <Text className="text-sm text-gray-600">
                {entry.startTime} - {entry.endTime}
              </Text>
            ) : (
              <Text className="text-sm text-gray-400">Closed</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
