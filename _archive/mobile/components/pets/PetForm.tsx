import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import type { CreatePetInput } from "@vetconnect/shared/validators/pets";
import type { Pet, Species, Sex } from "@vetconnect/shared/types/pets";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetFormProps {
  /** Pre-fill values for editing */
  defaultValues?: Partial<Pet>;
  /** Called with validated form data */
  onSubmit: (data: CreatePetInput) => void;
  /** Loading state for submit button */
  isLoading: boolean;
  /** Label for the submit button */
  submitLabel?: string;
}

// ---------------------------------------------------------------------------
// Species & Sex options
// ---------------------------------------------------------------------------

const speciesOptions: { value: Species; label: string; icon: string }[] = [
  { value: "dog", label: "Dog", icon: "paw" },
  { value: "cat", label: "Cat", icon: "paw" },
  { value: "bird", label: "Bird", icon: "leaf" },
  { value: "rabbit", label: "Rabbit", icon: "leaf" },
  { value: "other", label: "Other", icon: "ellipse" },
];

const sexOptions: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PetForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Save",
}: PetFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(
    defaultValues?.photo ?? null,
  );

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreatePetInput>({
    defaultValues: {
      name: defaultValues?.name ?? "",
      species: defaultValues?.species ?? "dog",
      breed: defaultValues?.breed ?? "",
      birthDate: defaultValues?.birthDate ?? new Date().toISOString(),
      sex: defaultValues?.sex ?? "male",
      color: defaultValues?.color ?? "",
      weight: defaultValues?.weight ? Number(defaultValues.weight) : undefined,
      microchip: defaultValues?.microchip ?? "",
      allergies: defaultValues?.allergies ?? "",
      medicalConditions: defaultValues?.medicalConditions ?? "",
      currentMedication: defaultValues?.currentMedication ?? "",
    },
  });

  const selectedSpecies = watch("species");
  const selectedSex = watch("sex");
  const birthDateValue = watch("birthDate");

  // -----------------------------------------------------------------------
  // Photo picker
  // -----------------------------------------------------------------------

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  // -----------------------------------------------------------------------
  // Date handler
  // -----------------------------------------------------------------------

  function handleDateChange(_event: unknown, date?: Date) {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setValue("birthDate", date.toISOString());
    }
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          <View className="mb-6 items-center">
            <Pressable
              onPress={pickPhoto}
              className="h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-100 active:opacity-70"
              accessibilityLabel="Pick a photo"
              accessibilityRole="button"
            >
              {photoUri ? (
                <View className="h-28 w-28 overflow-hidden rounded-full">
                  {/* Using a basic Image from RN since expo-image needs source obj */}
                  <View className="h-full w-full items-center justify-center">
                    <Ionicons name="checkmark-circle" size={32} color={colors.secondary} />
                    <Text className="mt-1 text-xs text-brand-secondary">Photo selected</Text>
                  </View>
                </View>
              ) : (
                <>
                  <Ionicons name="camera-outline" size={32} color={colors.gray[400]} />
                  <Text className="mt-1 text-xs text-gray-400">Add photo</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Name */}
          <Controller
            control={control}
            name="name"
            rules={{ required: "Pet name is required" }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Name *"
                placeholder="Enter pet name"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.name?.message}
                autoCapitalize="words"
              />
            )}
          />

          {/* Species */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-brand-text">
              Species *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {speciesOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setValue("species", opt.value)}
                  className={`flex-row items-center rounded-xl border px-4 py-2.5 ${
                    selectedSpecies === opt.value
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-gray-200 bg-white"
                  }`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedSpecies === opt.value }}
                >
                  <Ionicons
                    name={opt.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={
                      selectedSpecies === opt.value
                        ? colors.primary
                        : colors.gray[400]
                    }
                  />
                  <Text
                    className={`ml-1.5 text-sm font-medium ${
                      selectedSpecies === opt.value
                        ? "text-brand-primary"
                        : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.species && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.species.message}
              </Text>
            )}
          </View>

          {/* Breed */}
          <Controller
            control={control}
            name="breed"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Breed"
                placeholder="e.g. Golden Retriever"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ""}
                autoCapitalize="words"
              />
            )}
          />

          {/* Birth Date */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-brand-text">
              Birth Date *
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5"
              accessibilityRole="button"
              accessibilityLabel="Select birth date"
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.gray[400]}
              />
              <Text className="ml-2 flex-1 text-base text-brand-text">
                {formatDate(birthDateValue)}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(birthDateValue)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Sex */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-brand-text">
              Sex *
            </Text>
            <View className="flex-row gap-3">
              {sexOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setValue("sex", opt.value)}
                  className={`flex-1 items-center rounded-xl border py-3 ${
                    selectedSex === opt.value
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-gray-200 bg-white"
                  }`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedSex === opt.value }}
                >
                  <Ionicons
                    name={opt.value === "male" ? "male" : "female"}
                    size={20}
                    color={
                      selectedSex === opt.value
                        ? colors.primary
                        : colors.gray[400]
                    }
                  />
                  <Text
                    className={`mt-1 text-sm font-medium ${
                      selectedSex === opt.value
                        ? "text-brand-primary"
                        : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Color */}
          <Controller
            control={control}
            name="color"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Color"
                placeholder="e.g. Golden, Black & White"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ""}
                autoCapitalize="words"
              />
            )}
          />

          {/* Weight */}
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Weight (kg)"
                placeholder="e.g. 12.5"
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  onChange(isNaN(num) ? undefined : num);
                }}
                onBlur={onBlur}
                value={value != null ? String(value) : ""}
                keyboardType="decimal-pad"
                error={errors.weight?.message}
              />
            )}
          />

          {/* Microchip */}
          <Controller
            control={control}
            name="microchip"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Microchip ID"
                placeholder="Optional"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value ?? ""}
                autoCapitalize="none"
              />
            )}
          />

          {/* Medical section (collapsible) */}
          <Pressable
            onPress={() => setShowMedical((v) => !v)}
            className="mb-3 flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
            accessibilityRole="button"
            accessibilityLabel="Toggle medical information"
          >
            <View className="flex-row items-center">
              <Ionicons
                name="medkit-outline"
                size={18}
                color={colors.primary}
              />
              <Text className="ml-2 text-sm font-medium text-brand-text">
                Medical Information
              </Text>
            </View>
            <Ionicons
              name={showMedical ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.gray[400]}
            />
          </Pressable>

          {showMedical && (
            <View className="mb-2">
              <Controller
                control={control}
                name="allergies"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Allergies"
                    placeholder="Known allergies"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value ?? ""}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />
              <Controller
                control={control}
                name="medicalConditions"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Medical Conditions"
                    placeholder="e.g. Diabetes, Arthritis"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value ?? ""}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />
              <Controller
                control={control}
                name="currentMedication"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Current Medication"
                    placeholder="Medication your pet is currently taking"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value ?? ""}
                    multiline
                    numberOfLines={2}
                  />
                )}
              />
            </View>
          )}

          {/* Submit */}
          <View className="mb-8 mt-4">
            <Button
              title={submitLabel}
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
