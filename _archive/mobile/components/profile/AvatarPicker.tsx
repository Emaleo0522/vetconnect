import { View, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";

interface AvatarPickerProps {
  avatarUrl?: string | null;
  loading?: boolean;
  onPick: (uri: string) => void;
}

export function AvatarPicker({ avatarUrl, loading, onPick }: AvatarPickerProps) {
  const handlePress = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri);
    }
  };

  return (
    <View className="mb-6 items-center">
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="relative h-28 w-28 items-center justify-center rounded-full bg-gray-200 active:opacity-70"
        accessibilityLabel="Change profile photo"
        accessibilityRole="button"
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            className="h-28 w-28 rounded-full"
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Ionicons name="person" size={48} color={colors.gray[400]} />
        )}

        {/* Camera overlay */}
        <View className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-brand-primary">
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Ionicons name="camera" size={16} color="#FFF" />
          )}
        </View>
      </Pressable>
    </View>
  );
}
