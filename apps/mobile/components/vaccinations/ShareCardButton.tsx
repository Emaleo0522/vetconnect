import { Pressable, Text, ActivityIndicator, Share, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { useVaccinationCardLink } from "@/hooks/useVaccinations";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShareCardButtonProps {
  petId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ShareCardButton({ petId }: ShareCardButtonProps) {
  const { mutate, isPending } = useVaccinationCardLink(petId);

  function handlePress() {
    mutate(undefined, {
      onSuccess: async (data) => {
        try {
          await Share.share({
            message: `View vaccination card: ${data.url}`,
            url: data.url,
          });
        } catch {
          Alert.alert("Error", "Could not open share sheet.");
        }
      },
    });
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPending}
      className="flex-row items-center justify-center rounded-xl bg-brand-secondary px-5 py-3 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel="Share vaccination card"
    >
      {isPending ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <>
          <Ionicons name="share-outline" size={18} color={colors.white} />
          <Text className="ml-2 text-sm font-semibold text-white">
            Share Card
          </Text>
        </>
      )}
    </Pressable>
  );
}
