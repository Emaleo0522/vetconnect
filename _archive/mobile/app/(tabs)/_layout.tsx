import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/constants/theme";
import { useUnreadCountQuery } from "@/hooks/useNotifications";
import { useAuthStore, type UserRole } from "@/stores/auth.store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabIconProps = {
  color: string;
  size: number;
};

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function HeaderTitle() {
  return (
    <View className="flex-row items-center">
      <Ionicons name="paw" size={22} color={colors.white} />
      <Text className="ml-2 text-lg font-bold text-white">VetConnect</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab config by role
// ---------------------------------------------------------------------------

function getPetsTabConfig(role: UserRole | null) {
  switch (role) {
    case "vet":
      return {
        title: "Pacientes",
        icon: "people-outline" as const,
      };
    case "org":
      return {
        title: "Rescates",
        icon: "heart-outline" as const,
      };
    default:
      return {
        title: "Mascotas",
        icon: "paw-outline" as const,
      };
  }
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default function TabLayout() {
  const { data: unreadCount } = useUnreadCountQuery();
  const role = useAuthStore((s) => s.role);
  const petsConfig = getPetsTabConfig(role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerTitle: () => <HeaderTitle />,
        headerRight: () => (
          <View className="mr-4">
            {unreadCount && unreadCount > 0 ? (
              <View className="relative">
                <Ionicons
                  name="notifications"
                  size={22}
                  color={colors.white}
                />
                <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <Text className="text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              </View>
            ) : (
              <Ionicons
                name="notifications-outline"
                size={22}
                color={colors.white}
              />
            )}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: petsConfig.title,
          headerShown: false,
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name={petsConfig.icon} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="vets"
        options={{
          title: "Veterinarios",
          headerShown: false,
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Alertas",
          tabBarBadge:
            unreadCount && unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons
              name="notifications-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
