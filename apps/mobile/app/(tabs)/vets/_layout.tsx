import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

export default function VetsLayout() {
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
        options={{ title: "Find Veterinarians" }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: "Vet Profile" }}
      />
    </Stack>
  );
}
