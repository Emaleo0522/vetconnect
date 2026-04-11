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
import {
  createTreatmentSchema,
  treatmentType,
} from "@vetconnect/shared/validators/vaccinations";
import type { CreateTreatmentInput } from "@vetconnect/shared/validators/vaccinations";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TreatmentFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTreatmentInput) => void;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Type labels
// ---------------------------------------------------------------------------

const typeLabels: Record<string, string> = {
  deworming: "Deworming",
  surgery: "Surgery",
  therapy: "Therapy",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TreatmentForm({
  visible,
  onClose,
  onSubmit,
  isLoading,
}: TreatmentFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTreatmentInput>({
    resolver: zodResolver(createTreatmentSchema as never) as Resolver<CreateTreatmentInput>,
    defaultValues: {
      type: "deworming",
      name: "",
      date: new Date().toISOString(),
      notes: "",
    },
  });

  const currentDate = watch("date");
  const currentType = watch("type");

  function handleClose() {
    reset();
    onClose();
  }

  function handleDateChange(
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue("date", selectedDate.toISOString(), { shouldValidate: true });
    }
  }

  function onFormSubmit(data: CreateTreatmentInput) {
    const cleaned: CreateTreatmentInput = {
      ...data,
      notes: data.notes || undefined,
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
            Add Treatment
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          {/* Type selector */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-brand-text">
              Type *
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {treatmentType.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setValue("type", t, { shouldValidate: true })}
                  className={`rounded-full px-4 py-2 ${
                    currentType === t
                      ? "bg-brand-primary"
                      : "border border-gray-200 bg-white"
                  } active:opacity-70`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      currentType === t ? "text-white" : "text-brand-text"
                    }`}
                  >
                    {typeLabels[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
            {errors.type && (
              <Text className="mt-1 text-xs text-red-500">
                {errors.type.message}
              </Text>
            )}
          </View>

          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Treatment Name *"
                placeholder="e.g. Frontline Plus"
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
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {/* Notes */}
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Notes"
                placeholder="Optional notes"
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.notes?.message}
                multiline
                numberOfLines={3}
              />
            )}
          />

          <View className="mt-4 pb-8">
            <Button
              title="Save Treatment"
              onPress={handleSubmit(onFormSubmit)}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
