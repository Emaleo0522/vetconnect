import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/auth.store";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const checkSession = useAuthStore((s) => s.checkSession);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkSession().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [checkSession]);

  // Keep splash visible while checking session
  if (isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
