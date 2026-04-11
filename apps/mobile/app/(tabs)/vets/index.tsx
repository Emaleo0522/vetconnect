import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import { VetCard } from "@/components/vets/VetCard";
import { VetMap } from "@/components/vets/VetMap";
import { VetFilters } from "@/components/vets/VetFilters";
import { useLocation } from "@/hooks/useLocation";
import { searchVets, type VetListItem } from "@/services/vets";
import { colors } from "@/constants/theme";

type ViewMode = "list" | "map";

export default function VetsDirectoryScreen() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [radius, setRadius] = useState(10);
  const [isEmergency, setIsEmergency] = useState(false);

  const { latitude, longitude, loading: locationLoading } = useLocation();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ["vets", specialty, radius, isEmergency, query, latitude, longitude],
    queryFn: async ({ pageParam }) => {
      return searchVets({
        specialty: specialty || undefined,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        radius,
        isEmergency: isEmergency || undefined,
        query: query || undefined,
        cursor: pageParam ?? undefined,
        limit: 20,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !locationLoading,
  });

  const allVets = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderVetItem = useCallback(
    ({ item }: { item: VetListItem }) => <VetCard vet={item} />,
    [],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View className="items-center py-12">
        <Ionicons name="search-outline" size={40} color={colors.gray[300]} />
        <Text className="mt-3 text-base text-gray-400">No veterinarians found</Text>
        <Text className="mt-1 text-sm text-gray-400">
          Try adjusting your filters
        </Text>
      </View>
    );
  }, [isLoading]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      {/* Segmented control */}
      <View className="flex-row bg-white px-4 pt-2 pb-1">
        <Pressable
          onPress={() => setViewMode("list")}
          className={`flex-1 items-center rounded-l-lg border border-r-0 py-2 ${
            viewMode === "list"
              ? "border-brand-primary bg-brand-primary"
              : "border-gray-300 bg-white"
          }`}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === "list" }}
        >
          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name="list"
              size={16}
              color={viewMode === "list" ? colors.white : colors.gray[500]}
            />
            <Text
              className={`text-sm font-medium ${
                viewMode === "list" ? "text-white" : "text-gray-500"
              }`}
            >
              List
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setViewMode("map")}
          className={`flex-1 items-center rounded-r-lg border border-l-0 py-2 ${
            viewMode === "map"
              ? "border-brand-primary bg-brand-primary"
              : "border-gray-300 bg-white"
          }`}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === "map" }}
        >
          <View className="flex-row items-center gap-1.5">
            <Ionicons
              name="map"
              size={16}
              color={viewMode === "map" ? colors.white : colors.gray[500]}
            />
            <Text
              className={`text-sm font-medium ${
                viewMode === "map" ? "text-white" : "text-gray-500"
              }`}
            >
              Map
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Filters */}
      <VetFilters
        query={query}
        onQueryChange={setQuery}
        specialty={specialty}
        onSpecialtyChange={setSpecialty}
        radius={radius}
        onRadiusChange={setRadius}
        isEmergency={isEmergency}
        onEmergencyChange={setIsEmergency}
      />

      {/* Content */}
      {isLoading || locationLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-2 text-sm text-gray-400">
            {locationLoading ? "Getting your location..." : "Loading vets..."}
          </Text>
        </View>
      ) : viewMode === "list" ? (
        <FlatList
          data={allVets}
          keyExtractor={(item) => item.id}
          renderItem={renderVetItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      ) : (
        <VetMap
          vets={allVets}
          userLat={latitude}
          userLng={longitude}
        />
      )}
    </SafeAreaView>
  );
}
