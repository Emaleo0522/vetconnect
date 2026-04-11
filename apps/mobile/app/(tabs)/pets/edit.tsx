import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { PetForm } from "@/components/pets/PetForm";
import { usePetQuery, useUpdatePet } from "@/hooks/usePets";
import { colors } from "@/constants/theme";
import type { CreatePetInput } from "@vetconnect/shared/validators/pets";

export default function EditPetScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const { data: pet, isLoading } = usePetQuery(petId ?? "");
  const updateMutation = useUpdatePet(petId ?? "");

  function handleSubmit(data: CreatePetInput) {
    updateMutation.mutate(data);
  }

  if (isLoading || !pet) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-2 text-sm text-gray-400">Loading pet data...</Text>
      </View>
    );
  }

  return (
    <PetForm
      defaultValues={pet}
      onSubmit={handleSubmit}
      isLoading={updateMutation.isPending}
      submitLabel="Save Changes"
    />
  );
}
