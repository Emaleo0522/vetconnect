import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";

import {
  useVaccinationsQuery,
  useTreatmentsQuery,
  useCreateVaccination,
  useCreateTreatment,
} from "@/hooks/useVaccinations";
import { VaccinationList } from "@/components/vaccinations/VaccinationList";
import { TreatmentList } from "@/components/vaccinations/TreatmentList";
import { VaccinationForm } from "@/components/vaccinations/VaccinationForm";
import { TreatmentForm } from "@/components/vaccinations/TreatmentForm";
import { ShareCardButton } from "@/components/vaccinations/ShareCardButton";
import { colors } from "@/constants/theme";
import type { CreateVaccinationInput, CreateTreatmentInput } from "@vetconnect/shared/validators/vaccinations";

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type TabId = "vaccines" | "treatments";

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function VaccinationsScreen() {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("vaccines");
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);

  // Queries
  const vaccinations = useVaccinationsQuery(petId ?? "");
  const treatments = useTreatmentsQuery(petId ?? "");

  // Mutations
  const createVaccine = useCreateVaccination(petId ?? "");
  const createTreatment = useCreateTreatment(petId ?? "");

  // Refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([vaccinations.refetch(), treatments.refetch()]).finally(() =>
      setRefreshing(false),
    );
  }, [vaccinations, treatments]);

  // Submit handlers
  function handleVaccineSubmit(data: CreateVaccinationInput) {
    createVaccine.mutate(data, {
      onSuccess: () => setShowVaccineForm(false),
    });
  }

  function handleTreatmentSubmit(data: CreateTreatmentInput) {
    createTreatment.mutate(data, {
      onSuccess: () => setShowTreatmentForm(false),
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-background" edges={["bottom"]}>
      {/* Sub-tabs */}
      <View className="flex-row border-b border-gray-200 bg-white">
        <Pressable
          onPress={() => setActiveTab("vaccines")}
          className={`flex-1 items-center py-3 ${
            activeTab === "vaccines"
              ? "border-b-2 border-brand-primary"
              : ""
          }`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "vaccines" }}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === "vaccines"
                ? "text-brand-primary"
                : "text-gray-400"
            }`}
          >
            Vaccines
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("treatments")}
          className={`flex-1 items-center py-3 ${
            activeTab === "treatments"
              ? "border-b-2 border-brand-primary"
              : ""
          }`}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "treatments" }}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === "treatments"
                ? "text-brand-primary"
                : "text-gray-400"
            }`}
          >
            Treatments
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Share button */}
        {activeTab === "vaccines" && (
          <View className="mb-4">
            <ShareCardButton petId={petId ?? ""} />
          </View>
        )}

        {/* Content */}
        {activeTab === "vaccines" ? (
          <VaccinationList
            vaccinations={vaccinations.data ?? []}
            isLoading={vaccinations.isLoading}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        ) : (
          <TreatmentList
            treatments={treatments.data ?? []}
            isLoading={treatments.isLoading}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}

        <View className="h-24" />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() =>
          activeTab === "vaccines"
            ? setShowVaccineForm(true)
            : setShowTreatmentForm(true)
        }
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel={
          activeTab === "vaccines" ? "Add vaccination" : "Add treatment"
        }
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Forms */}
      <VaccinationForm
        visible={showVaccineForm}
        onClose={() => setShowVaccineForm(false)}
        onSubmit={handleVaccineSubmit}
        isLoading={createVaccine.isPending}
      />
      <TreatmentForm
        visible={showTreatmentForm}
        onClose={() => setShowTreatmentForm(false)}
        onSubmit={handleTreatmentSubmit}
        isLoading={createTreatment.isPending}
      />
    </SafeAreaView>
  );
}
