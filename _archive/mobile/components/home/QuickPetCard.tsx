import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import type { Pet, Species } from "@vetconnect/shared/types/pets";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const speciesIcons: Record<Species, keyof typeof Ionicons.glyphMap> = {
  dog: "paw",
  cat: "paw",
  bird: "leaf",
  rabbit: "leaf",
  other: "ellipse",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuickPetCardProps {
  pet: Pet;
}

export function QuickPetCard({ pet }: QuickPetCardProps) {
  function handlePress() {
    router.push(`/(tabs)/pets/${pet.id}` as never);
  }

  return (
    <Pressable
      onPress={handlePress}
      className="mr-3 w-20 items-center active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`View ${pet.name}`}
    >
      <View className="mb-2 h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-brand-secondary/10">
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
            name={speciesIcons[pet.species]}
            size={28}
            color={colors.secondary}
          />
        )}
      </View>
      <Text
        className="text-center text-xs font-medium text-brand-text"
        numberOfLines={1}
      >
        {pet.name}
      </Text>
    </Pressable>
  );
}
