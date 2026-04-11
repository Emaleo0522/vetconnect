import { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@vetconnect/shared/validators/auth";
import type { ProfileResponse } from "@/services/profile";
import type { UserRole } from "@/stores/auth.store";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const ORG_TYPES: { value: "shelter" | "rescue" | "foundation" | "other"; label: string }[] = [
  { value: "shelter", label: "Shelter" },
  { value: "rescue", label: "Rescue" },
  { value: "foundation", label: "Foundation" },
  { value: "other", label: "Other" },
];

const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Pet Owner",
  vet: "Veterinarian",
  org: "Organization",
  admin: "Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  owner: "bg-blue-100 text-blue-700",
  vet: "bg-green-100 text-green-700",
  org: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ProfileFormProps {
  profile: ProfileResponse;
  onSubmit: (data: UpdateProfileInput) => void;
  isSubmitting: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileForm({ profile, onSubmit, isSubmitting }: ProfileFormProps) {
  const role = profile.role;

  const defaultValues: UpdateProfileInput = {
    name: profile.name,
    phone: profile.phone ?? "",
    // Vet fields
    ...(role === "vet" && profile.vet
      ? {
          license: profile.vet.license,
          specialties: profile.vet.specialties,
          clinicName: profile.vet.clinicName,
          clinicAddress: profile.vet.clinicAddress,
          clinicPhone: profile.vet.clinicPhone,
          is24h: profile.vet.is24h,
        }
      : {}),
    // Org fields
    ...(role === "org" && profile.org
      ? {
          orgName: profile.org.orgName,
          orgType: profile.org.orgType,
          address: profile.org.address,
          website: profile.org.website ?? "",
        }
      : {}),
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    // Zod v4 schemas work at runtime; cast resolver to satisfy TS
    resolver: zodResolver(updateProfileSchema as never) as Resolver<UpdateProfileInput>,
    defaultValues,
  });

  return (
    <View className="w-full">
      {/* Email (read-only) */}
      <View className="mb-4 w-full">
        <Text className="mb-1.5 text-sm font-medium text-brand-text">Email</Text>
        <View className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5">
          <Text className="text-base text-gray-500">{profile.email}</Text>
        </View>
      </View>

      {/* Role badge (read-only) */}
      <View className="mb-4 w-full">
        <Text className="mb-1.5 text-sm font-medium text-brand-text">Role</Text>
        <View className="flex-row">
          <View
            className={`rounded-full px-4 py-1.5 ${(ROLE_COLORS[role] || "bg-gray-100 text-gray-800").split(" ")[0]}`}
          >
            <Text
              className={`text-sm font-semibold ${(ROLE_COLORS[role] || "bg-gray-100 text-gray-800").split(" ")[1]}`}
            >
              {ROLE_LABELS[role] || role || "User"}
            </Text>
          </View>
        </View>
      </View>

      {/* Name */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Full Name"
            placeholder="Your name"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      {/* Phone */}
      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Phone"
            placeholder="Your phone number"
            value={value ?? ""}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.phone?.message}
            keyboardType="phone-pad"
          />
        )}
      />

      {/* ---------- Vet-specific fields ---------- */}
      {role === "vet" && (
        <View className="mt-2 w-full">
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
                value={value ?? ""}
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
                value={value ?? ""}
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
                value={value ?? ""}
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
                value={value ?? ""}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.clinicPhone?.message}
                keyboardType="phone-pad"
              />
            )}
          />

          {/* 24h toggle */}
          <Controller
            control={control}
            name="is24h"
            render={({ field: { onChange, value } }) => (
              <View className="mb-4 w-full flex-row items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-brand-text">
                    24h Emergency Service
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Available for emergencies around the clock
                  </Text>
                </View>
                <Switch
                  value={!!value}
                  onValueChange={onChange}
                  trackColor={{
                    false: colors.gray[200],
                    true: colors.secondary,
                  }}
                  thumbColor={colors.white}
                />
              </View>
            )}
          />
        </View>
      )}

      {/* ---------- Organization-specific fields ---------- */}
      {role === "org" && (
        <View className="mt-2 w-full">
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
                value={value ?? ""}
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
                value={value ?? ""}
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
      )}

      {/* Save button */}
      <View className="mt-4">
        <Button
          title="Save Changes"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SpecialtyPicker (reused pattern from registration)
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
        accessibilityLabel="Select specialties"
        accessibilityRole="button"
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
                className={`flex-row items-center px-4 py-3 ${isSelected ? "bg-blue-50" : ""}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={20}
                  color={isSelected ? colors.primary : "#9CA3AF"}
                />
                <Text className="ml-3 text-sm text-brand-text">{specialty}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// OrgTypePicker (reused pattern from registration)
// ---------------------------------------------------------------------------

function OrgTypePicker({
  selected,
  onChange,
  error,
}: {
  selected?: string;
  onChange: (val: "shelter" | "rescue" | "foundation" | "other") => void;
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
        className={`flex-row items-center justify-between rounded-xl border bg-white px-4 py-3.5 ${error ? "border-red-400" : "border-gray-200"}`}
        accessibilityLabel="Select organization type"
        accessibilityRole="button"
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
                className={`flex-row items-center px-4 py-3 ${isSelected ? "bg-blue-50" : ""}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons
                  name={isSelected ? "radio-button-on" : "radio-button-off"}
                  size={20}
                  color={isSelected ? colors.primary : "#9CA3AF"}
                />
                <Text className="ml-3 text-sm text-brand-text">{type.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
