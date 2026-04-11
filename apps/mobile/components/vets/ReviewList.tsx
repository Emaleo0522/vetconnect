import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { StarRating } from "./StarRating";
import { colors } from "@/constants/theme";
import type { ReviewItem } from "@/services/reviews";

interface ReviewListProps {
  reviews: ReviewItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isFetchingMore: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReviewCard({ review }: { review: ReviewItem }) {
  return (
    <View className="border-b border-gray-100 py-3">
      <View className="flex-row items-center gap-2.5">
        {review.reviewerAvatar ? (
          <Image
            source={{ uri: review.reviewerAvatar }}
            className="h-8 w-8 rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="person" size={14} color={colors.gray[400]} />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-sm font-semibold text-brand-text">
            {review.reviewerName}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatDate(review.createdAt)}
          </Text>
        </View>
        <StarRating rating={review.rating} size={14} />
      </View>

      {review.comment && (
        <Text className="mt-2 text-sm leading-5 text-gray-700">
          {review.comment}
        </Text>
      )}
    </View>
  );
}

export function ReviewList({
  reviews,
  isLoading,
  hasMore,
  onLoadMore,
  isFetchingMore,
}: ReviewListProps) {
  return (
    <View className="mt-2 bg-white px-4 py-4">
      <Text className="mb-3 text-base font-semibold text-brand-text">
        Reviews
      </Text>

      {isLoading && reviews.length === 0 ? (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View className="items-center py-6">
          <Ionicons name="chatbubble-outline" size={28} color={colors.gray[300]} />
          <Text className="mt-2 text-sm text-gray-400">No reviews yet</Text>
        </View>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {hasMore && (
            <Pressable
              onPress={onLoadMore}
              disabled={isFetchingMore}
              className="mt-3 items-center rounded-lg bg-gray-50 py-2.5 active:opacity-70"
            >
              {isFetchingMore ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text className="text-sm font-medium text-brand-primary">
                  Load more reviews
                </Text>
              )}
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
