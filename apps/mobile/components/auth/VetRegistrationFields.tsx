import { View, Text, Pressable, ScrollView } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { Input } from "@/components/ui/Input";
import type { RegisterVetInput } from "@vetconnect/shared/validators/auth";

interface VetRegistrationFieldsProps {
  control: Control<RegisterVetInput>;
  errors: FieldErrors<RegisterVetInput>;
}

const SPECIALTIES = [
  "General Practice",
  "Surgery",
  "Dermatology",
  "Cardiology",
  "Ophthalmology",
  "Neurology",
  "Oncology",
  "Dentistry",
  "Emergency & Critical Care",
  "Exotic Animals",
  "Equine",
  "Orthopedics",
];

export function VetRegistrationFields({
  control,
  errors,
}: VetRegistrationFieldsProps) {
  return (
    <View className="w-full">
      <Text className="mb-3 text-lg font-bold text-brand-text">
        Professional Information
      </Text>

      <Controller
        control={control}
        name="license"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Veterinary License"
            placeholder="e.g. MP1234"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.license?.message}
            autoCapitalize="characters"
          />
        )}
      />

      <Controller
        control={control}
        name="specialties"
        render={({ field: { onChange, value } }) => (
          <SpecialtyPicker
            selected={value ?? []}
            onChange={onChange}
            error={errors.specialties?.message}
          />
        )}
      />

      <Text className="mb-3 mt-2 text-lg font-bold text-brand-text">
        Clinic Information
      </Text>

      <Controller
        control={control}
        name="clinicName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Clinic Name"
            placeholder="Enter clinic name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.clinicName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="clinicAddress"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Clinic Address"
            placeholder="Enter clinic address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.clinicAddress?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="clinicPhone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Clinic Phone"
            placeholder="Enter clinic phone"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.clinicPhone?.message}
            keyboardType="phone-pad"
          />
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Specialty multi-select
// ---------------------------------------------------------------------------

function SpecialtyPicker({
  selected,
  onChange,
  error,
}: {
  selected: string[];
  onChange: (val: string[]) => void;
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = (specialty: string) => {
    if (selected.includes(specialty)) {
      onChange(selected.filter((s) => s !== specialty));
    } else {
      onChange([...selected, specialty]);
    }
  };

  return (
    <View className="mb-4 w-full">
      <Text className="mb-1.5 text-sm font-medium text-brand-text">
        Specialties
      </Text>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className="flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5"
      >
        <Text
          className={`text-base ${selected.length > 0 ? "text-brand-text" : "text-gray-400"}`}
          numberOfLines={1}
        >
          {selected.length > 0
            ? `${selected.length} selected`
            : "Select specialties"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </Pressable>

      {expanded && (
        <ScrollView
          className="mt-2 max-h-48 rounded-xl border border-gray-200 bg-white"
          nestedScrollEnabled
        >
          {SPECIALTIES.map((specialty) => {
            const isSelected = selected.includes(specialty);
            return (
              <Pressable
                key={specialty}
                onPress={() => toggle(specialty)}
                className={`flex-row items-center px-4 py-3 ${
                  isSelected ? "bg-blue-50" : ""
                }`}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={20}
                  color={isSelected ? "#2B7A9E" : "#9CA3AF"}
                />
                <Text className="ml-3 text-sm text-brand-text">
                  {specialty}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
