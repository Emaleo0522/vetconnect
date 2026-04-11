import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type UserRole = "owner" | "vet" | "org";

interface RoleSelectorProps {
  selected: UserRole | null;
  onSelect: (role: UserRole) => void;
}

const roles: {
  value: UserRole;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  {
    value: "owner",
    label: "Pet Owner",
    description: "Manage your pets' health records",
    icon: "paw",
    color: "#2B7A9E",
  },
  {
    value: "vet",
    label: "Veterinarian",
    description: "Provide care and manage patients",
    icon: "medkit",
    color: "#4CAF7D",
  },
  {
    value: "org",
    label: "Organization",
    description: "Shelter, rescue, or foundation",
    icon: "business",
    color: "#F5A623",
  },
];

export function RoleSelector({ selected, onSelect }: RoleSelectorProps) {
  return (
    <View className="w-full gap-3">
      <Text className="mb-1 text-lg font-bold text-brand-text">
        I am a...
      </Text>

      {roles.map((role) => {
        const isSelected = selected === role.value;
        return (
          <Pressable
            key={role.value}
            onPress={() => onSelect(role.value)}
            className={`flex-row items-center rounded-xl border-2 px-4 py-4 active:opacity-70 ${
              isSelected
                ? "border-brand-primary bg-blue-50"
                : "border-gray-200 bg-white"
            }`}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
          >
            <View
              className="mr-4 h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: isSelected ? role.color : "#E5E7EB" }}
            >
              <Ionicons
                name={role.icon}
                size={24}
                color={isSelected ? "#FFFFFF" : "#6B7280"}
              />
            </View>

            <View className="flex-1">
              <Text
                className={`text-base font-semibold ${
                  isSelected ? "text-brand-primary" : "text-brand-text"
                }`}
              >
                {role.label}
              </Text>
              <Text className="text-sm text-gray-500">{role.description}</Text>
            </View>

            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#2B7A9E" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
