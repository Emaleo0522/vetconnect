import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  loginSchema,
  type LoginInput,
} from "@vetconnect/shared/validators/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    // Zod v4 schemas work at runtime; cast resolver to satisfy TS
    resolver: zodResolver(loginSchema as never) as Resolver<LoginInput>,
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    clearError();
    try {
      await login(data.email, data.password);
      router.replace("/(tabs)");
    } catch {
      // Error is already set in the store
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-brand-primary">
              <Ionicons name="paw" size={40} color="#FFFFFF" />
            </View>
            <Text className="text-2xl font-bold text-brand-text">
              Welcome Back
            </Text>
            <Text className="mt-1 text-center text-sm text-gray-500">
              Sign in to your VetConnect account
            </Text>
          </View>

          {/* API error banner */}
          {error && (
            <View className="mb-4 flex-row items-center rounded-xl bg-red-50 px-4 py-3">
              <Ionicons name="alert-circle" size={20} color="#E53E3E" />
              <Text className="ml-2 flex-1 text-sm text-red-600">{error}</Text>
              <Pressable onPress={clearError} hitSlop={8}>
                <Ionicons name="close" size={18} color="#E53E3E" />
              </Pressable>
            </View>
          )}

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@example.com"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            )}
          />

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="Enter your password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                secureTextEntry
                toggleSecure
                autoComplete="password"
                textContentType="password"
              />
            )}
          />

          {/* Submit */}
          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            className="mt-2"
          />

          {/* Register link */}
          <Pressable
            onPress={() => router.push("/(auth)/register")}
            className="mt-6 items-center active:opacity-70"
          >
            <Text className="text-sm text-brand-primary">
              Don't have an account?{" "}
              <Text className="font-semibold">Sign Up</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
