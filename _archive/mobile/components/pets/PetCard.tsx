import { View, Text, Pressable, Alert } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import type { Pet, Species } from "@vetconnect/shared/types/pets";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const speciesIcons: Record<Species, string> = {
  dog: "paw",
  cat: "paw",
  bird: "leaf",
  rabbit: "leaf",
  other: "ellipse",
};

const speciesLabels: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  bird: "Bird",
  rabbit: "Rabbit",
  other: "Other",
};

function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "Unknown age";
  const birth = new Date(birthDate);
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(
    (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000),
  );

  if (years > 0) {
    return months > 0 ? `${years}y ${months}m` : `${years}y`;
  }
  return months > 0 ? `${months}m` : "< 1m";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PetCardProps {
  pet: Pet;
  onDelete: (id: string) => void;
}

export function PetCard({ pet, onDelete }: PetCardProps) {
  function handlePress() {
    router.push(`./${pet.id}` as never);
  }

  function handleLongPress() {
    Alert.alert(
      "Delete pet",
      `Are you sure you want to remove ${pet.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(pet.id),
        },
      ],
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      className="mb-3 flex-row items-center rounded-2xl bg-white p-4 shadow-sm active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`View ${pet.name}`}
    >
      {/* Photo */}
      <View className="mr-4 h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-secondary/10">
        {pet.photo ? (
          <Image
            source={{ uri: pet.photo }}
            style={{ width: 64, height: 64 }}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Photo of ${pet.name}`}
          />
        ) : (
          <Ionicons
            name={speciesIcons[pet.species] as keyof typeof Ionicons.glyphMap}
            size={28}
            color={colors.secondary}
          />
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-brand-text">
          {pet.name}
        </Text>
        <View className="mt-1 flex-row items-center">
          <Text className="text-sm text-gray-500">
            {speciesLabels[pet.species]}
          </Text>
          {pet.breed && (
            <Text className="text-sm text-gray-500"> - {pet.breed}</Text>
          )}
        </View>
        <Text className="mt-0.5 text-xs text-gray-400">
          {calculateAge(pet.birthDate)}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={colors.gray[300]} />
    </Pressable>
  );
}

export { calculateAge, speciesLabels, speciesIcons };
