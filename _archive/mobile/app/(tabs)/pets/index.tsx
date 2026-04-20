import { View, Text, FlatList, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { PetCard } from "@/components/pets/PetCard";
import { usePetsQuery, useDeletePet } from "@/hooks/usePets";
import { colors } from "@/constants/theme";
import type { Pet } from "@vetconnect/shared/types/pets";

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function PetCardSkeleton() {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl bg-white p-4">
      <View className="mr-4 h-16 w-16 rounded-full bg-gray-200" />
      <View className="flex-1">
        <View className="mb-2 h-4 w-32 rounded bg-gray-200" />
        <View className="mb-1 h-3 w-24 rounded bg-gray-100" />
        <View className="h-3 w-16 rounded bg-gray-100" />
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View className="px-4 pt-4">
      <PetCardSkeleton />
      <PetCardSkeleton />
      <PetCardSkeleton />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-secondary/10">
        <Ionicons name="paw-outline" size={40} color={colors.secondary} />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-brand-text">
        No pets yet
      </Text>
      <Text className="text-center text-sm text-gray-500">
        You don't have any pets registered. Add your first pet to get started!
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PetsListScreen() {
  const { data: pets, isLoading, refetch, isRefetching } = usePetsQuery();
  const deleteMutation = useDeletePet();

  function handleDelete(id: string) {
    deleteMutation.mutate(id);
  }

  function renderItem({ item }: { item: Pet }) {
    return <PetCard pet={item} onDelete={handleDelete} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      {isLoading ? (
        <LoadingSkeleton />
      ) : !pets || pets.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("./new" as never)}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Add a new pet"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}
