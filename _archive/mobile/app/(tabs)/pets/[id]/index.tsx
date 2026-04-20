import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";

import { usePetQuery, useMedicalHistoryQuery } from "@/hooks/usePets";
import { MedicalTimeline } from "@/components/pets/MedicalTimeline";
import { PetQRCode } from "@/components/pets/PetQRCode";
import { VetLinker } from "@/components/pets/VetLinker";
import {
  calculateAge,
  speciesLabels,
  speciesIcons,
} from "@/components/pets/PetCard";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Section Tab Bar
// ---------------------------------------------------------------------------

type SectionId = "info" | "history" | "vaccines" | "qr";

const sections: { id: SectionId; label: string; icon: string }[] = [
  { id: "info", label: "Info", icon: "information-circle-outline" },
  { id: "history", label: "History", icon: "time-outline" },
  { id: "vaccines", label: "Vaccines", icon: "shield-checkmark-outline" },
  { id: "qr", label: "QR", icon: "qr-code-outline" },
];

// ---------------------------------------------------------------------------
// Info Row
// ---------------------------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <View className="flex-row items-center border-b border-gray-100 py-3">
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={18}
        color={colors.gray[400]}
      />
      <Text className="ml-3 w-24 text-sm text-gray-500">{label}</Text>
      <Text className="flex-1 text-sm font-medium text-brand-text">
        {value}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: pet, isLoading, refetch } = usePetQuery(id ?? "");
  const { data: records, isLoading: isHistoryLoading } =
    useMedicalHistoryQuery(id ?? "");

  const [activeSection, setActiveSection] = useState<SectionId>("info");

  if (isLoading || !pet) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sexLabel = pet.sex === "male" ? "Male" : "Female";
  const weightLabel = pet.weight ? `${pet.weight} kg` : null;

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero / Photo */}
        <View className="items-center bg-brand-primary/5 pb-6 pt-4">
          <View className="h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
            {pet.photo ? (
              <Image
                source={{ uri: pet.photo }}
                style={{ width: 112, height: 112 }}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`Photo of ${pet.name}`}
              />
            ) : (
              <Ionicons
                name={
                  speciesIcons[pet.species] as keyof typeof Ionicons.glyphMap
                }
                size={48}
                color={colors.secondary}
              />
            )}
          </View>
          <Text className="mt-3 text-xl font-bold text-brand-text">
            {pet.name}
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            {speciesLabels[pet.species]}
            {pet.breed ? ` - ${pet.breed}` : ""}
            {" | "}
            {calculateAge(pet.birthDate)}
          </Text>

          {/* Edit button */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "../edit" as never,
                params: { petId: pet.id },
              })
            }
            className="mt-3 flex-row items-center rounded-full bg-brand-primary px-5 py-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Edit pet"
          >
            <Ionicons name="create-outline" size={16} color={colors.white} />
            <Text className="ml-1.5 text-sm font-semibold text-white">
              Edit
            </Text>
          </Pressable>
        </View>

        {/* Section Tabs */}
        <View className="flex-row border-b border-gray-200 bg-white px-2">
          {sections.map((section) => (
            <Pressable
              key={section.id}
              onPress={() => setActiveSection(section.id)}
              className={`flex-1 items-center py-3 ${
                activeSection === section.id
                  ? "border-b-2 border-brand-primary"
                  : ""
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeSection === section.id }}
            >
              <Ionicons
                name={section.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={
                  activeSection === section.id
                    ? colors.primary
                    : colors.gray[400]
                }
              />
              <Text
                className={`mt-1 text-xs ${
                  activeSection === section.id
                    ? "font-semibold text-brand-primary"
                    : "text-gray-400"
                }`}
              >
                {section.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Section Content */}
        <View className="px-4 pt-4 pb-8">
          {/* INFO SECTION */}
          {activeSection === "info" && (
            <View>
              <View className="rounded-xl bg-white p-4">
                <InfoRow icon="paw" label="Species" value={speciesLabels[pet.species]} />
                <InfoRow icon="leaf" label="Breed" value={pet.breed} />
                <InfoRow icon="calendar" label="Age" value={calculateAge(pet.birthDate)} />
                <InfoRow
                  icon={pet.sex === "male" ? "male" : "female"}
                  label="Sex"
                  value={sexLabel}
                />
                <InfoRow icon="color-palette" label="Color" value={pet.color} />
                <InfoRow icon="scale" label="Weight" value={weightLabel} />
                <InfoRow icon="hardware-chip" label="Microchip" value={pet.microchip} />
              </View>

              {/* Medical info */}
              {(pet.allergies || pet.medicalConditions || pet.currentMedication) && (
                <View className="mt-4 rounded-xl bg-white p-4">
                  <Text className="mb-2 text-sm font-semibold text-brand-text">
                    Medical Info
                  </Text>
                  <InfoRow icon="alert-circle" label="Allergies" value={pet.allergies} />
                  <InfoRow icon="fitness" label="Conditions" value={pet.medicalConditions} />
                  <InfoRow icon="medkit" label="Medication" value={pet.currentMedication} />
                </View>
              )}

              {/* Vet linker */}
              <View className="mt-4">
                <Text className="mb-2 text-sm font-semibold text-brand-text">
                  Primary Veterinarian
                </Text>
                <VetLinker
                  petId={pet.id}
                  currentVetId={pet.vetId}
                  onLinked={() => refetch()}
                />
              </View>
            </View>
          )}

          {/* HISTORY SECTION */}
          {activeSection === "history" && (
            <View>
              {isHistoryLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <MedicalTimeline records={records ?? []} />
              )}
            </View>
          )}

          {/* VACCINES SECTION — navigates to dedicated screen */}
          {activeSection === "vaccines" && (
            <View className="items-center py-12">
              <Ionicons
                name="shield-checkmark-outline"
                size={48}
                color={colors.primary}
              />
              <Text className="mt-4 text-center text-base font-semibold text-brand-text">
                Vaccination Card
              </Text>
              <Text className="mt-2 px-8 text-center text-sm text-gray-500">
                View and manage vaccinations and treatments.
              </Text>
              <Pressable
                onPress={() =>
                  router.push(`/(tabs)/pets/${id}/vaccinations` as never)
                }
                className="mt-4 flex-row items-center rounded-full bg-brand-primary px-6 py-3 active:opacity-70"
                accessibilityRole="button"
                accessibilityLabel="Open vaccination card"
              >
                <Ionicons name="open-outline" size={16} color={colors.white} />
                <Text className="ml-2 text-sm font-semibold text-white">
                  Open Vaccination Card
                </Text>
              </Pressable>
            </View>
          )}

          {/* QR SECTION */}
          {activeSection === "qr" && (
            <PetQRCode uuid={pet.uuid} petName={pet.name} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
