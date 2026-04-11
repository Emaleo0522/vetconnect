import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { StarRating } from "./StarRating";
import { colors } from "@/constants/theme";
import type { VetListItem } from "@/services/vets";

interface VetCardProps {
  vet: VetListItem;
}

export function VetCard({ vet }: VetCardProps) {
  return (
    <Pressable
      onPress={() => router.push(`/vets/${vet.id}` as never)}
      className="mb-3 flex-row rounded-xl bg-white p-4 shadow-sm active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`${vet.name}, ${vet.averageRating} stars`}
    >
      {/* Avatar */}
      <View className="mr-3">
        {vet.avatarUrl ? (
          <Image
            source={{ uri: vet.avatarUrl }}
            className="h-16 w-16 rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10">
            <Ionicons name="person" size={28} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-brand-text" numberOfLines={1}>
          {vet.name}
        </Text>

        {/* Specialties chips */}
        <View className="mt-1 flex-row flex-wrap gap-1">
          {vet.specialties.slice(0, 3).map((spec) => (
            <View
              key={spec}
              className="rounded-full bg-brand-secondary/15 px-2.5 py-0.5"
            >
              <Text className="text-xs font-medium" style={{ color: colors.secondary }}>
                {spec}
              </Text>
            </View>
          ))}
          {vet.specialties.length > 3 && (
            <View className="rounded-full bg-gray-100 px-2.5 py-0.5">
              <Text className="text-xs text-gray-500">
                +{vet.specialties.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Rating + distance */}
        <View className="mt-1.5 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <StarRating rating={vet.averageRating} size={14} />
            <Text className="text-xs text-gray-500">
              ({vet.totalReviews})
            </Text>
          </View>

          {vet.distance != null && (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="location-outline" size={12} color={colors.gray[500]} />
              <Text className="text-xs text-gray-500">
                {vet.distance < 1
                  ? `${Math.round(vet.distance * 1000)}m`
                  : `${vet.distance.toFixed(1)} km`}
              </Text>
            </View>
          )}

          {vet.isEmergency24h && (
            <View className="flex-row items-center gap-0.5">
              <Ionicons name="time-outline" size={12} color={colors.error} />
              <Text className="text-xs font-medium" style={{ color: colors.error }}>
                24h
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
