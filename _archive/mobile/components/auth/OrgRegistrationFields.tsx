import { View, Text, Pressable } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { Input } from "@/components/ui/Input";
import type { RegisterOrgInput } from "@vetconnect/shared/validators/auth";

interface OrgRegistrationFieldsProps {
  control: Control<RegisterOrgInput>;
  errors: FieldErrors<RegisterOrgInput>;
}

const ORG_TYPES: { value: RegisterOrgInput["orgType"]; label: string }[] = [
  { value: "shelter", label: "Shelter" },
  { value: "rescue", label: "Rescue" },
  { value: "foundation", label: "Foundation" },
  { value: "other", label: "Other" },
];

export function OrgRegistrationFields({
  control,
  errors,
}: OrgRegistrationFieldsProps) {
  return (
    <View className="w-full">
      <Text className="mb-3 text-lg font-bold text-brand-text">
        Organization Information
      </Text>

      <Controller
        control={control}
        name="orgName"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Organization Name"
            placeholder="Enter organization name"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.orgName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="orgType"
        render={({ field: { onChange, value } }) => (
          <OrgTypePicker
            selected={value}
            onChange={onChange}
            error={errors.orgType?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Address"
            placeholder="Enter organization address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.address?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="website"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Website (optional)"
            placeholder="https://www.example.com"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.website?.message}
            keyboardType="url"
            autoCapitalize="none"
          />
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Org type dropdown
// ---------------------------------------------------------------------------

function OrgTypePicker({
  selected,
  onChange,
  error,
}: {
  selected?: string;
  onChange: (val: RegisterOrgInput["orgType"]) => void;
  error?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedLabel = ORG_TYPES.find((t) => t.value === selected)?.label;

  return (
    <View className="mb-4 w-full">
      <Text className="mb-1.5 text-sm font-medium text-brand-text">
        Organization Type
      </Text>

      <Pressable
        onPress={() => setExpanded((v) => !v)}
        className={`flex-row items-center justify-between rounded-xl border bg-white px-4 py-3.5 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        <Text
          className={`text-base ${selected ? "text-brand-text" : "text-gray-400"}`}
        >
          {selectedLabel ?? "Select type"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#9CA3AF"
        />
      </Pressable>

      {expanded && (
        <View className="mt-2 rounded-xl border border-gray-200 bg-white">
          {ORG_TYPES.map((type) => {
            const isSelected = selected === type.value;
            return (
              <Pressable
                key={type.value}
                onPress={() => {
                  onChange(type.value);
                  setExpanded(false);
                }}
                className={`flex-row items-center px-4 py-3 ${
                  isSelected ? "bg-blue-50" : ""
                }`}
              >
                <Ionicons
                  name={
                    isSelected
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={isSelected ? "#2B7A9E" : "#9CA3AF"}
                />
                <Text className="ml-3 text-sm text-brand-text">
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
