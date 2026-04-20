import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import type { Notification, NotificationType } from "@vetconnect/shared/types/notifications";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Type config
// ---------------------------------------------------------------------------

const typeConfig: Record<
  NotificationType,
  { icon: string; color: string }
> = {
  vaccine_reminder: {
    icon: "shield-checkmark",
    color: "#28A745",
  },
  appointment: {
    icon: "calendar",
    color: colors.primary,
  },
  general: {
    icon: "notifications",
    color: colors.accent,
  },
};

// ---------------------------------------------------------------------------
// Relative time
// ---------------------------------------------------------------------------

function getRelativeTime(dateStr: Date | string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const cfg = typeConfig[notification.type] ?? typeConfig.general;

  function handlePress() {
    onPress(notification);

    // Deep link for vaccine reminders
    if (
      notification.type === "vaccine_reminder" &&
      notification.data?.petId &&
      typeof notification.data.petId === "string"
    ) {
      router.push(
        `/(tabs)/pets/${notification.data.petId}/vaccinations` as never,
      );
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className={`mb-2 rounded-xl p-4 active:opacity-70 ${
        notification.isRead ? "bg-white" : "bg-blue-50"
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}. ${notification.body}`}
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${cfg.color}15` }}
        >
          <Ionicons
            name={cfg.icon as keyof typeof Ionicons.glyphMap}
            size={20}
            color={cfg.color}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`flex-1 text-sm ${
                notification.isRead
                  ? "font-medium text-brand-text"
                  : "font-semibold text-brand-text"
              }`}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text className="ml-2 text-xs text-gray-400">
              {getRelativeTime(notification.createdAt)}
            </Text>
          </View>
          <Text
            className="mt-1 text-sm text-gray-500"
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        </View>

        {/* Unread dot */}
        {!notification.isRead && (
          <View className="ml-2 mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-primary" />
        )}
      </View>
    </Pressable>
  );
}
