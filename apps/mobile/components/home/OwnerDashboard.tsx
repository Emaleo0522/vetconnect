import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuthStore } from "@/stores/auth.store";
import {
  useOwnerPetsQuery,
  useUpcomingVaccinesQuery,
  useNearbyVetsQuery,
} from "@/hooks/useDashboard";
import { QuickPetCard } from "./QuickPetCard";
import { UpcomingVaccines } from "./UpcomingVaccines";
import { colors } from "@/constants/theme";
import type { VetListItem } from "@/services/vets";

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="text-lg font-bold text-brand-text">{title}</Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} className="active:opacity-70">
          <Text className="text-sm font-medium text-brand-primary">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Nearby vet mini card
// ---------------------------------------------------------------------------

function NearbyVetCard({ vet }: { vet: VetListItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/vets/${vet.id}` as never)}
      className="mb-2 flex-row items-center rounded-xl bg-white p-4 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`View ${vet.name}`}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
        <Ionicons name="medkit" size={20} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-brand-text">
          {vet.name}
        </Text>
        {vet.clinicName && (
          <Text className="text-xs text-gray-500">{vet.clinicName}</Text>
        )}
        {vet.specialties.length > 0 && (
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {vet.specialties.join(", ")}
          </Text>
        )}
      </View>
      <View className="items-end">
        {vet.averageRating > 0 && (
          <View className="flex-row items-center">
            <Ionicons name="star" size={12} color={colors.accent} />
            <Text className="ml-1 text-xs font-medium text-gray-600">
              {vet.averageRating.toFixed(1)}
            </Text>
          </View>
        )}
        {vet.distance != null && (
          <Text className="mt-0.5 text-xs text-gray-400">
            {vet.distance < 1
              ? `${Math.round(vet.distance * 1000)}m`
              : `${vet.distance.toFixed(1)}km`}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Owner Dashboard
// ---------------------------------------------------------------------------

export function OwnerDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const { data: pets, isLoading: petsLoading } = useOwnerPetsQuery();
  const { data: vaccines, isLoading: vaccinesLoading } =
    useUpcomingVaccinesQuery();
  const { data: nearbyVets, isLoading: vetsLoading } = useNearbyVetsQuery();

  // Find primary vet from pets
  const primaryVet = pets?.find((p) => p.vetId)?.vetId;

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <Text className="mb-6 text-2xl font-bold text-brand-text">
        Hola, {firstName}!
      </Text>

      {/* My Pets */}
      <View className="mb-6">
        <SectionHeader
          title="Tus mascotas"
          actionLabel={pets && pets.length > 0 ? "Ver todas" : undefined}
          onAction={() => router.push("/(tabs)/pets" as never)}
        />
        {petsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : pets && pets.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="py-1"
          >
            {pets.map((pet) => (
              <QuickPetCard key={pet.id} pet={pet} />
            ))}
          </ScrollView>
        ) : (
          <Pressable
            onPress={() => router.push("/(tabs)/pets/new" as never)}
            className="items-center rounded-xl border-2 border-dashed border-gray-200 p-6 active:opacity-70"
          >
            <Ionicons name="add-circle-outline" size={32} color={colors.gray[400]} />
            <Text className="mt-2 text-sm font-medium text-gray-500">
              Agrega tu primera mascota
            </Text>
          </Pressable>
        )}
      </View>

      {/* Upcoming Vaccines */}
      <View className="mb-6">
        <SectionHeader title="Proximas vacunas" />
        {vaccinesLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <UpcomingVaccines vaccines={vaccines ?? []} />
        )}
      </View>

      {/* Nearby Vets */}
      <View className="mb-6">
        <SectionHeader
          title="Veterinarios cerca"
          actionLabel="Ver directorio"
          onAction={() => router.push("/(tabs)/vets" as never)}
        />
        {vetsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : nearbyVets && nearbyVets.length > 0 ? (
          nearbyVets.map((vet) => <NearbyVetCard key={vet.id} vet={vet} />)
        ) : (
          <View className="items-center rounded-xl bg-white p-6">
            <Ionicons name="location-outline" size={32} color={colors.gray[400]} />
            <Text className="mt-2 text-center text-sm text-gray-500">
              Activa tu ubicacion para ver veterinarios cercanos
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
