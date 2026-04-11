import { Stack } from "expo-router";

import { colors } from "@/constants/theme";

export default function PetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "600" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "My Pets" }}
      />
      <Stack.Screen
        name="new"
        options={{ title: "Add Pet", presentation: "modal" }}
      />
      <Stack.Screen
        name="edit"
        options={{ title: "Edit Pet" }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{ title: "Pet Details" }}
      />
      <Stack.Screen
        name="[id]/vaccinations"
        options={{ title: "Vaccination Card" }}
      />
    </Stack>
  );
}
