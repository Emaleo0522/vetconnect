import { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useVetSearch, useLinkVet } from "@/hooks/usePets";
import { colors } from "@/constants/theme";
import type { VetSearchResult } from "@/services/pets";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VetLinkerProps {
  petId: string;
  currentVetId: string | null;
  onLinked?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VetLinker({ petId, currentVetId, onLinked }: VetLinkerProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: results, isLoading: isSearchLoading } = useVetSearch(query);
  const linkMutation = useLinkVet(petId);

  function handleSelect(vet: VetSearchResult) {
    linkMutation.mutate(
      { vetId: vet.id },
      {
        onSuccess: () => {
          setIsSearching(false);
          setQuery("");
          onLinked?.();
        },
      },
    );
  }

  if (!isSearching) {
    return (
      <Pressable
        onPress={() => setIsSearching(true)}
        className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Change veterinarian"
      >
        <Ionicons name="search-outline" size={18} color={colors.gray[400]} />
        <Text className="ml-2 flex-1 text-sm text-gray-500">
          {currentVetId ? "Change veterinarian" : "Search and link a veterinarian"}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray[300]} />
      </Pressable>
    );
  }

  return (
    <View className="rounded-xl border border-brand-primary bg-white p-3">
      {/* Search input */}
      <View className="flex-row items-center rounded-lg border border-gray-200 bg-gray-50 px-3">
        <Ionicons name="search-outline" size={16} color={colors.gray[400]} />
        <TextInput
          className="ml-2 flex-1 py-2.5 text-sm text-brand-text"
          placeholder="Search veterinarian by name..."
          placeholderTextColor={colors.gray[400]}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="words"
        />
        <Pressable
          onPress={() => {
            setIsSearching(false);
            setQuery("");
          }}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.gray[400]} />
        </Pressable>
      </View>

      {/* Results */}
      {isSearchLoading && query.length >= 2 && (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {results && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          style={{ maxHeight: 200, marginTop: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              className="flex-row items-center border-b border-gray-100 px-2 py-3 active:bg-gray-50"
              accessibilityRole="button"
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-primary/10">
                <Ionicons
                  name="medkit"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-brand-text">
                  {item.name}
                </Text>
                {item.clinicName && (
                  <Text className="text-xs text-gray-400">
                    {item.clinicName}
                  </Text>
                )}
              </View>
              {linkMutation.isPending && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </Pressable>
          )}
        />
      )}

      {results && results.length === 0 && query.length >= 2 && (
        <Text className="py-4 text-center text-sm text-gray-400">
          No veterinarians found
        </Text>
      )}
    </View>
  );
}
