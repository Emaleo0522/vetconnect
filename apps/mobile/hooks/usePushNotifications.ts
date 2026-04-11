import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import type { EventSubscription } from "expo-modules-core";

import { registerPushToken } from "@/services/notifications";
import { useAuthStore } from "@/stores/auth.store";

// ---------------------------------------------------------------------------
// Configure foreground notification behavior
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Register for push
    registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        const platform =
          Platform.OS === "ios" ? "ios" : "android";
        registerPushToken(token, platform).catch(() => {
          // Silently fail — token will be retried on next launch
        });
      }
    });

    // Foreground notification listener
    notificationListener.current =
      Notifications.addNotificationReceivedListener((_notification) => {
        // Notification received in foreground — handled by setNotificationHandler
      });

    // Tap response listener
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.url && typeof data.url === "string") {
          // Deep link handled by Expo Router via linking config
          // The router picks up the URL automatically
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isAuthenticated]);

  return { expoPushToken };
}

// ---------------------------------------------------------------------------
// Registration helper
// ---------------------------------------------------------------------------

async function registerForPushNotifications(): Promise<string | null> {
  // Push only works on physical devices
  if (!Device.isDevice) {
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Android notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    });

    return tokenData.data;
  } catch {
    return null;
  }
}
