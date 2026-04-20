import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { StarRating } from "./StarRating";
import { colors } from "@/constants/theme";
import type { VetDetailResponse } from "@/services/vets";

interface VetProfileProps {
  vet: VetDetailResponse;
}

export function VetProfile({ vet }: VetProfileProps) {
  return (
    <View>
      {/* Header */}
      <View className="items-center bg-white px-4 pb-5 pt-6">
        {vet.avatarUrl ? (
          <Image
            source={{ uri: vet.avatarUrl }}
            className="h-24 w-24 rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-primary/10">
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
        )}

        <Text className="mt-3 text-xl font-bold text-brand-text">
          {vet.name}
        </Text>

        {vet.clinicName && (
          <Text className="mt-0.5 text-sm text-gray-500">
            {vet.clinicName}
          </Text>
        )}

        <View className="mt-2 flex-row items-center gap-1.5">
          <StarRating rating={vet.averageRating ?? vet.avgRating ?? 0} size={20} />
          <Text className="text-sm text-gray-500">
            {(vet.averageRating ?? vet.avgRating ?? 0).toFixed(1)} ({vet.totalReviews ?? vet.reviewCount ?? 0} reviews)
          </Text>
        </View>

        {vet.isEmergency24h && (
          <View className="mt-2 flex-row items-center gap-1 rounded-full bg-red-50 px-3 py-1">
            <Ionicons name="time" size={14} color={colors.error} />
            <Text className="text-xs font-semibold" style={{ color: colors.error }}>
              24h Emergency Available
            </Text>
          </View>
        )}
      </View>

      {/* Details section */}
      <View className="mt-2 bg-white px-4 py-4">
        <Text className="mb-3 text-base font-semibold text-brand-text">
          Details
        </Text>

        {/* License */}
        <View className="mb-2 flex-row items-center gap-2">
          <Ionicons name="document-text-outline" size={16} color={colors.gray[500]} />
          <Text className="text-sm text-gray-600">
            License: {vet.license}
          </Text>
        </View>

        {/* Address */}
        {vet.clinicAddress && (
          <View className="mb-2 flex-row items-start gap-2">
            <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
            <Text className="flex-1 text-sm text-gray-600">
              {vet.clinicAddress}
            </Text>
          </View>
        )}

        {/* Specialties */}
        <View className="mt-2">
          <Text className="mb-1.5 text-xs font-medium text-gray-500 uppercase">
            Specialties
          </Text>
          <View className="flex-row flex-wrap gap-1.5">
            {vet.specialties.map((spec) => (
              <View
                key={spec}
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: `${colors.secondary}20` }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.secondary }}
                >
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        {vet.bio && (
          <View className="mt-3">
            <Text className="mb-1 text-xs font-medium text-gray-500 uppercase">
              About
            </Text>
            <Text className="text-sm leading-5 text-gray-700">
              {vet.bio}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
