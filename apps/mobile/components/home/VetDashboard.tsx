import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAuthStore } from "@/stores/auth.store";
import { useVetPatientsQuery, useVetOwnReviewsQuery } from "@/hooks/useDashboard";
import { colors } from "@/constants/theme";
import type { Pet } from "@vetconnect/shared/types/pets";
import type { ReviewItem } from "@/services/reviews";

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="mb-3 text-lg font-bold text-brand-text">{title}</Text>
  );
}

// ---------------------------------------------------------------------------
// Patient card
// ---------------------------------------------------------------------------

function PatientCard({ patient }: { patient: Pet & { ownerName?: string } }) {
  return (
    <Pressable
      onPress={() => router.push(`/(tabs)/pets/${patient.id}` as never)}
      className="mb-2 flex-row items-center rounded-xl bg-white p-4 active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`View ${patient.name}`}
    >
      <View className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-secondary/10">
        {patient.photo ? (
          <Image
            source={{ uri: patient.photo }}
            style={{ width: 48, height: 48 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Ionicons name="paw" size={24} color={colors.secondary} />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-brand-text">
          {patient.name}
        </Text>
        {patient.ownerName && (
          <Text className="text-xs text-gray-500">
            Owner: {patient.ownerName}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray[300]} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Review mini card
// ---------------------------------------------------------------------------

function ReviewMiniCard({ review }: { review: ReviewItem }) {
  return (
    <View className="mb-2 rounded-xl bg-white p-4">
      <View className="flex-row items-center">
        <View className="flex-row">
          {Array.from({ length: 5 }, (_, i) => (
            <Ionicons
              key={i}
              name={i < review.rating ? "star" : "star-outline"}
              size={14}
              color={colors.accent}
            />
          ))}
        </View>
        <Text className="ml-2 text-xs text-gray-400">
          {review.reviewerName}
        </Text>
      </View>
      {review.comment && (
        <Text className="mt-2 text-sm text-gray-600" numberOfLines={2}>
          {review.comment}
        </Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Profile completeness checklist
// ---------------------------------------------------------------------------

interface ChecklistItemProps {
  label: string;
  completed: boolean;
  onPress?: () => void;
}

function ChecklistItem({ label, completed, onPress }: ChecklistItemProps) {
  return (
    <Pressable
      onPress={completed ? undefined : onPress}
      className="mb-2 flex-row items-center rounded-lg bg-white px-4 py-3 active:opacity-70"
      disabled={completed}
    >
      <Ionicons
        name={completed ? "checkmark-circle" : "ellipse-outline"}
        size={22}
        color={completed ? colors.secondary : colors.gray[300]}
      />
      <Text
        className={`ml-3 text-sm ${completed ? "text-gray-400 line-through" : "font-medium text-brand-text"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Vet Dashboard
// ---------------------------------------------------------------------------

export function VetDashboard() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(" ")[0] ?? "";

  // TODO: Replace with actual vet profile ID from user data
  const vetProfileId = user?.id;

  const { data: patients, isLoading: patientsLoading } =
    useVetPatientsQuery();
  const { data: reviews, isLoading: reviewsLoading } =
    useVetOwnReviewsQuery(vetProfileId);

  // Profile completeness (simplified — real values would come from vet profile)
  const hasPhoto = Boolean(user?.avatarUrl);

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerClassName="pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <Text className="mb-6 text-2xl font-bold text-brand-text">
        Hola, Dr. {firstName}!
      </Text>

      {/* Linked patients */}
      <View className="mb-6">
        <SectionHeader title="Pacientes vinculados" />
        {patientsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : patients && patients.length > 0 ? (
          patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))
        ) : (
          <View className="items-center rounded-xl bg-white p-6">
            <Ionicons name="heart-outline" size={32} color={colors.gray[400]} />
            <Text className="mt-2 text-center text-sm text-gray-500">
              Aun no tienes pacientes vinculados. Los duenos de mascotas pueden
              seleccionarte como su veterinario de cabecera.
            </Text>
          </View>
        )}
      </View>

      {/* Recent reviews */}
      <View className="mb-6">
        <SectionHeader title="Resenas recientes" />
        {reviewsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewMiniCard key={review.id} review={review} />
          ))
        ) : (
          <View className="items-center rounded-xl bg-white p-6">
            <Ionicons name="chatbubble-outline" size={32} color={colors.gray[400]} />
            <Text className="mt-2 text-center text-sm text-gray-500">
              Aun no tienes resenas. Las resenas apareceran cuando los duenos
              evaluen tu servicio.
            </Text>
          </View>
        )}
      </View>

      {/* Profile completeness */}
      <View className="mb-6">
        <SectionHeader title="Completa tu perfil" />
        <ChecklistItem
          label="Agrega tu foto de perfil"
          completed={hasPhoto}
          onPress={() => router.push("/(tabs)/profile" as never)}
        />
        <ChecklistItem
          label="Define tus horarios de atencion"
          completed={false}
          onPress={() => router.push("/(tabs)/profile" as never)}
        />
        <ChecklistItem
          label="Agrega tus especialidades"
          completed={false}
          onPress={() => router.push("/(tabs)/profile" as never)}
        />
        <ChecklistItem
          label="Escribe una bio profesional"
          completed={false}
          onPress={() => router.push("/(tabs)/profile" as never)}
        />
      </View>
    </ScrollView>
  );
}
