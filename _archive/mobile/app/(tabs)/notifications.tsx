import { useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import {
  useNotificationsQuery,
  useMarkAsRead,
} from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { colors } from "@/constants/theme";
import type { Notification } from "@vetconnect/shared/types/notifications";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NotificationsScreen() {
  // Initialize push notifications
  usePushNotifications();

  const { data: notifications, isLoading, refetch } = useNotificationsQuery();
  const markAsRead = useMarkAsRead();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  function handleNotificationPress(notification: Notification) {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!notifications || notifications.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-accent/10">
            <Ionicons
              name="notifications-outline"
              size={32}
              color={colors.accent}
            />
          </View>
          <Text className="mb-2 text-xl font-semibold text-brand-text">
            No notifications
          </Text>
          <Text className="text-center text-sm text-gray-500">
            Appointment reminders and health alerts will appear here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
          />
        )}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
      />
    </SafeAreaView>
  );
}
