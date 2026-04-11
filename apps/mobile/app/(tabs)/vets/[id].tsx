import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { VetProfile } from "@/components/vets/VetProfile";
import { ScheduleTable } from "@/components/vets/ScheduleTable";
import { ContactButtons } from "@/components/vets/ContactButtons";
import { ReviewList } from "@/components/vets/ReviewList";
import { ReviewForm } from "@/components/vets/ReviewForm";
import { fetchVetDetail, fetchVetSchedule } from "@/services/vets";
import { fetchReviews, createReview, type ReviewItem } from "@/services/reviews";
import { useAuthStore } from "@/stores/auth.store";
import { colors } from "@/constants/theme";
import type { CreateReviewInput } from "@vetconnect/shared/validators/reviews";

export default function VetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isOwner = user?.role === "owner";

  // --- Vet detail ---
  const {
    data: vet,
    isLoading: vetLoading,
    refetch: refetchVet,
    isRefetching: vetRefetching,
  } = useQuery({
    queryKey: ["vet", id],
    queryFn: () => fetchVetDetail(id!),
    enabled: !!id,
  });

  // --- Schedule ---
  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ["vet-schedule", id],
    queryFn: () => fetchVetSchedule(id!),
    enabled: !!id,
  });

  // --- Reviews with manual pagination ---
  const [reviewPages, setReviewPages] = useState<ReviewItem[]>([]);
  const [reviewCursor, setReviewCursor] = useState<string | undefined>(undefined);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [isFetchingMoreReviews, setIsFetchingMoreReviews] = useState(false);

  const { isLoading: reviewsLoading } = useQuery({
    queryKey: ["vet-reviews", id],
    queryFn: async () => {
      const result = await fetchReviews(id!);
      setReviewPages(result.data);
      setReviewCursor(result.nextCursor ?? undefined);
      setHasMoreReviews(result.nextCursor != null);
      return result;
    },
    enabled: !!id,
  });

  const loadMoreReviews = useCallback(async () => {
    if (!reviewCursor || isFetchingMoreReviews) return;
    setIsFetchingMoreReviews(true);
    try {
      const result = await fetchReviews(id!, reviewCursor);
      setReviewPages((prev) => [...prev, ...result.data]);
      setReviewCursor(result.nextCursor ?? undefined);
      setHasMoreReviews(result.nextCursor != null);
    } finally {
      setIsFetchingMoreReviews(false);
    }
  }, [id, reviewCursor, isFetchingMoreReviews]);

  // --- Check if user already reviewed ---
  const userAlreadyReviewed = reviewPages.some(
    (r) => r.reviewerId === user?.id,
  );
  const canReview = isOwner && !userAlreadyReviewed;

  // --- Submit review ---
  const reviewMutation = useMutation({
    mutationFn: (data: CreateReviewInput) => createReview(id!, data),
    onSuccess: (newReview) => {
      // Append to local list
      setReviewPages((prev) => [newReview, ...prev]);
      // Invalidate to refresh rating count
      queryClient.invalidateQueries({ queryKey: ["vet", id] });
      queryClient.invalidateQueries({ queryKey: ["vet-reviews", id] });
      Alert.alert("Thank you!", "Your review has been submitted.");
    },
    onError: () => {
      Alert.alert("Error", "Could not submit your review. Please try again.");
    },
  });

  const handleSubmitReview = async (data: CreateReviewInput) => {
    await reviewMutation.mutateAsync(data);
  };

  // --- Refresh all ---
  const handleRefresh = useCallback(() => {
    refetchVet();
    queryClient.invalidateQueries({ queryKey: ["vet-schedule", id] });
    queryClient.invalidateQueries({ queryKey: ["vet-reviews", id] });
  }, [id, refetchVet, queryClient]);

  if (vetLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-brand-background" edges={["bottom"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!vet) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-brand-background" edges={["bottom"]}>
        <Text className="text-base text-gray-500">Veterinarian not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vetRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile header + details */}
        <VetProfile vet={vet} />

        {/* Schedule */}
        {schedule && (
          <ScheduleTable
            schedule={schedule}
            isEmergency24h={vet.isEmergency24h}
          />
        )}
        {scheduleLoading && (
          <View className="mt-2 items-center bg-white py-6">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Contact buttons */}
        <ContactButtons
          phone={vet.clinicPhone}
          latitude={vet.latitude}
          longitude={vet.longitude}
          clinicName={vet.clinicName}
        />

        {/* Reviews */}
        <ReviewList
          reviews={reviewPages}
          isLoading={reviewsLoading}
          hasMore={hasMoreReviews}
          onLoadMore={loadMoreReviews}
          isFetchingMore={isFetchingMoreReviews}
        />

        {/* Review form (only for pet_owner who hasn't reviewed) */}
        {canReview && (
          <ReviewForm
            onSubmit={handleSubmitReview}
            isSubmitting={reviewMutation.isPending}
          />
        )}

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
