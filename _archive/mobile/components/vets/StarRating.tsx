import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  /** When provided, stars become tappable for input */
  onRate?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 18,
  onRate,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => {
    const starValue = i + 1;
    const filled = rating >= starValue;
    const halfFilled = !filled && rating >= starValue - 0.5;

    const iconName = filled
      ? "star"
      : halfFilled
        ? "star-half"
        : "star-outline";

    const star = (
      <Ionicons
        key={i}
        name={iconName}
        size={size}
        color={colors.accent}
      />
    );

    if (onRate) {
      return (
        <Pressable
          key={i}
          onPress={() => onRate(starValue)}
          hitSlop={4}
          accessibilityLabel={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
        >
          {star}
        </Pressable>
      );
    }

    return star;
  });

  return (
    <View className="flex-row items-center gap-0.5">
      {stars}
    </View>
  );
}
