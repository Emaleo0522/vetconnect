import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

const SPECIALTIES = [
  "General",
  "Surgery",
  "Dermatology",
  "Cardiology",
  "Oncology",
  "Ophthalmology",
  "Neurology",
  "Dentistry",
  "Orthopedics",
  "Exotic Animals",
];

interface VetFiltersProps {
  query: string;
  onQueryChange: (q: string) => void;
  specialty: string;
  onSpecialtyChange: (s: string) => void;
  radius: number;
  onRadiusChange: (r: number) => void;
  isEmergency: boolean;
  onEmergencyChange: (v: boolean) => void;
}

export function VetFilters({
  query,
  onQueryChange,
  specialty,
  onSpecialtyChange,
  radius,
  onRadiusChange,
  isEmergency,
  onEmergencyChange,
}: VetFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View className="bg-white px-4 pb-3 pt-2">
      {/* Search bar */}
      <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
        <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
        <TextInput
          className="ml-2 flex-1 py-3 text-base text-brand-text"
          placeholder="Search vets..."
          placeholderTextColor={colors.gray[400]}
          value={query}
          onChangeText={onQueryChange}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => onQueryChange("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
          </Pressable>
        )}
      </View>

      {/* Toggle filters */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="mt-2 flex-row items-center self-start"
        hitSlop={8}
      >
        <Ionicons
          name={expanded ? "options" : "options-outline"}
          size={16}
          color={colors.primary}
        />
        <Text className="ml-1 text-sm font-medium text-brand-primary">
          {expanded ? "Hide filters" : "Filters"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.primary}
        />
      </Pressable>

      {expanded && (
        <View className="mt-3">
          {/* Specialty chips */}
          <Text className="mb-1.5 text-xs font-medium text-gray-500 uppercase">
            Specialty
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
          >
            <Pressable
              onPress={() => onSpecialtyChange("")}
              className={`mr-2 rounded-full px-3 py-1.5 ${
                !specialty ? "bg-brand-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  !specialty ? "text-white" : "text-gray-600"
                }`}
              >
                All
              </Text>
            </Pressable>
            {SPECIALTIES.map((spec) => (
              <Pressable
                key={spec}
                onPress={() => onSpecialtyChange(specialty === spec ? "" : spec)}
                className={`mr-2 rounded-full px-3 py-1.5 ${
                  specialty === spec ? "bg-brand-primary" : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    specialty === spec ? "text-white" : "text-gray-600"
                  }`}
                >
                  {spec}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Radius */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-gray-500 uppercase">
              Radius: {radius} km
            </Text>
            <View className="flex-row items-center gap-2">
              {[5, 10, 25, 50, 100].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => onRadiusChange(r)}
                  className={`rounded-full px-2.5 py-1 ${
                    radius === r ? "bg-brand-primary" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      radius === r ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Emergency toggle */}
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-gray-500 uppercase">
              24h Emergency only
            </Text>
            <Switch
              value={isEmergency}
              onValueChange={onEmergencyChange}
              trackColor={{ false: colors.gray[200], true: colors.primary }}
              thumbColor={Platform.OS === "android" ? colors.white : undefined}
            />
          </View>
        </View>
      )}
    </View>
  );
}
