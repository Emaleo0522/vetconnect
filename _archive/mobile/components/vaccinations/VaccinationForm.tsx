import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { Resolver } from "react-hook-form";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import { createVaccinationSchema } from "@vetconnect/shared/validators/vaccinations";
import type { CreateVaccinationInput } from "@vetconnect/shared/validators/vaccinations";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface VaccinationFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVaccinationInput) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VaccinationForm({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: VaccinationFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateVaccinationInput>({
    resolver: zodResolver(createVaccinationSchema as never) as Resolver<CreateVaccinationInput>,
    defaultValues: {
      name: "",
      date: new Date().toISOString(),
      batch: "",
      nextDoseDate: undefined,
    },
  });

  const currentDate = watch("date");
  const currentNextDate = watch("nextDoseDate");

  function handleClose() {
    reset();
    onClose();
  }

  function handleDateChange(
    field: "date" | "nextDoseDate",
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    if (field === "date") setShowDatePicker(false);
    if (field === "nextDoseDate") setShowNextDatePicker(false);

    if (selectedDate) {
      setValue(field, selectedDate.toISOString(), { shouldValidate: true });
    }
  }

  function onFormSubmit(data: CreateVaccinationInput) {
    // Clean optional fields
    const cleaned: CreateVaccinationInput = {
      ...data,
      batch: data.batch || undefined,
      nextDoseDate: data.nextDoseDate || undefined,
    };
    onSubmit(cleaned);
    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-brand-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pb-3 pt-4">
          <Pressable onPress={handleClose} className="active:opacity-70">
            <Text className="text-base text-brand-primary">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-brand-text">
            Add Vaccination
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Vaccine Name *"
                placeholder="e.g. Rabies, Distemper"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                autoCapitalize="words"
              />
            )}
          />

          {/* Date */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-brand-text">
              Date *
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5 active:opacity-70"
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.gray[400]}
              />
              <Text className="ml-2 flex-1 text-base text-brand-text">
                {new Date(currentDate).toLocaleDateString()}
              </Text>
            </Pressable>
            {errors.date && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.date.message}
              </Text>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={new Date(currentDate)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, d) => handleDateChange("date", e, d)}
              maximumDate={new Date()}
            />
          )}

          {/* Batch */}
          <Controller
            control={control}
            name="batch"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Batch Number"
                placeholder="Optional"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.batch?.message}
              />
            )}
          />

          {/* Next Dose Date */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-brand-text">
              Next Dose Date
            </Text>
            <Pressable
              onPress={() => setShowNextDatePicker(true)}
              className="flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3.5 active:opacity-70"
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.gray[400]}
              />
              <Text className="ml-2 flex-1 text-base text-brand-text">
                {currentNextDate
                  ? new Date(currentNextDate).toLocaleDateString()
                  : "Not set"}
              </Text>
            </Pressable>
            {errors.nextDoseDate && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.nextDoseDate.message}
              </Text>
            )}
          </View>

          {showNextDatePicker && (
            <DateTimePicker
              value={
                currentNextDate ? new Date(currentNextDate) : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, d) => handleDateChange("nextDoseDate", e, d)}
              minimumDate={new Date(currentDate)}
            />
          )}

          <View className="mt-4 pb-8">
            <Button
              title="Save Vaccination"
              onPress={handleSubmit(onFormSubmit)}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
