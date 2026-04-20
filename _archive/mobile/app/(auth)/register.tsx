import { useState } from "react";
import { View, Text, Pressable } from "react-native";
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
  registerOwnerSchema,
  registerVetSchema,
  registerOrgSchema,
  type RegisterOwnerInput,
  type RegisterVetInput,
  type RegisterOrgInput,
} from "@vetconnect/shared/validators/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RoleSelector, type UserRole } from "@/components/auth/RoleSelector";
import { VetRegistrationFields } from "@/components/auth/VetRegistrationFields";
import { OrgRegistrationFields } from "@/components/auth/OrgRegistrationFields";
import { useAuthStore } from "@/stores/auth.store";

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <View className="mb-6 flex-row items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full ${
            i <= current ? "w-8 bg-brand-primary" : "w-2 bg-gray-300"
          }`}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

type AnyRegisterInput = RegisterOwnerInput | RegisterVetInput | RegisterOrgInput;

export default function RegisterScreen() {
  const { register: registerUser, isLoading, error, clearError } =
    useAuthStore();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<UserRole | null>(null);

  // Determine schema based on selected role
  const schema =
    role === "vet"
      ? registerVetSchema
      : role === "org"
        ? registerOrgSchema
        : registerOwnerSchema;

  const totalSteps = role === "owner" ? 2 : 3;

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
  } = useForm<AnyRegisterInput>({
    // Zod v4 schemas work at runtime; cast resolver to satisfy TS
    resolver: zodResolver(schema as never) as Resolver<AnyRegisterInput>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  // -----------------------------------------------------------------------
  // Navigation between steps
  // -----------------------------------------------------------------------

  const handleRoleSelect = (selectedRole: UserRole) => {
    if (selectedRole !== role) {
      reset({ name: "", email: "", password: "", phone: "" });
    }
    setRole(selectedRole);
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!role) return;
      setStep(1);
      return;
    }

    if (step === 1) {
      // Validate common fields before proceeding
      const valid = await trigger(["name", "email", "password"]);
      if (!valid) return;

      if (role === "owner") {
        // No step 3, submit directly
        handleSubmit(onSubmit)();
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 — submit with all fields
    handleSubmit(onSubmit)();
  };

  const handleBack = () => {
    clearError();
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const onSubmit = async (data: AnyRegisterInput) => {
    if (!role) return;
    clearError();
    try {
      await registerUser(data as Record<string, unknown>, role);
      router.replace("/(tabs)");
    } catch {
      // Error is set in the store
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-brand-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header with back button */}
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="h-10 w-10 items-center justify-center rounded-full active:opacity-70"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1A2B3C" />
          </Pressable>
          <Text className="ml-2 text-lg font-semibold text-brand-text">
            Create Account
          </Text>
        </View>

        <StepIndicator current={step} total={totalSteps} />

        <ScrollView
          className="flex-1 px-6"
          contentContainerClassName="pb-12"
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Step 0 — Role selection */}
          {step === 0 && (
            <View>
              <RoleSelector selected={role} onSelect={handleRoleSelect} />
            </View>
          )}

          {/* Step 1 — Common fields */}
          {step === 1 && (
            <View>
              <Text className="mb-3 text-lg font-bold text-brand-text">
                Your Information
              </Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    autoComplete="name"
                    textContentType="name"
                  />
                )}
              />

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

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry
                    toggleSecure
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Phone (optional)"
                    placeholder="+54 11 1234-5678"
                    value={value ?? ""}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.phone?.message}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                  />
                )}
              />
            </View>
          )}

          {/* Step 2 — Role-specific fields */}
          {step === 2 && role === "vet" && (
            <VetRegistrationFields
              control={control as unknown as import("react-hook-form").Control<RegisterVetInput>}
              errors={errors as import("react-hook-form").FieldErrors<RegisterVetInput>}
            />
          )}

          {step === 2 && role === "org" && (
            <OrgRegistrationFields
              control={control as unknown as import("react-hook-form").Control<RegisterOrgInput>}
              errors={errors as import("react-hook-form").FieldErrors<RegisterOrgInput>}
            />
          )}
        </ScrollView>

        {/* Bottom action area */}
        <View className="px-6 pb-4">
          <Button
            title={
              step === 0
                ? "Continue"
                : step === 1 && role !== "owner"
                  ? "Continue"
                  : "Create Account"
            }
            onPress={handleNext}
            loading={isLoading}
            disabled={step === 0 && !role}
            variant={step === 0 && !role ? "outline" : "primary"}
          />

          {step === 0 && (
            <Pressable
              onPress={() => router.back()}
              className="mt-4 items-center active:opacity-70"
            >
              <Text className="text-sm text-brand-primary">
                Already have an account?{" "}
                <Text className="font-semibold">Sign In</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
