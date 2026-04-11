import { View, Text, TextInput } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReviewSchema, type CreateReviewInput } from "@vetconnect/shared/validators/reviews";

import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

interface ReviewFormProps {
  onSubmit: (data: CreateReviewInput) => Promise<void>;
  isSubmitting: boolean;
}

export function ReviewForm({ onSubmit, isSubmitting }: ReviewFormProps) {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createReviewSchema as any),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const currentRating = watch("rating");

  const handleFormSubmit = async (data: CreateReviewInput) => {
    await onSubmit(data);
    reset();
  };

  return (
    <View className="mt-2 bg-white px-4 py-4">
      <Text className="mb-3 text-base font-semibold text-brand-text">
        Write a Review
      </Text>

      {/* Star rating input */}
      <View className="mb-3">
        <Text className="mb-1.5 text-sm text-gray-600">Your rating</Text>
        <StarRating
          rating={currentRating}
          size={32}
          onRate={(r) => setValue("rating", r, { shouldValidate: true })}
        />
        {errors.rating && (
          <Text className="mt-1 text-xs text-red-500">{errors.rating.message}</Text>
        )}
      </View>

      {/* Comment */}
      <View className="mb-3">
        <Text className="mb-1.5 text-sm text-gray-600">Your comment</Text>
        <Controller
          control={control}
          name="comment"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              className="min-h-[100px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-brand-text"
              placeholder="Share your experience (min 10 characters)..."
              placeholderTextColor={colors.gray[400]}
              multiline
              textAlignVertical="top"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              maxLength={500}
            />
          )}
        />
        {errors.comment && (
          <Text className="mt-1 text-xs text-red-500">{errors.comment.message}</Text>
        )}
      </View>

      <Button
        title="Submit Review"
        onPress={handleSubmit(handleFormSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting || currentRating === 0}
      />
    </View>
  );
}
