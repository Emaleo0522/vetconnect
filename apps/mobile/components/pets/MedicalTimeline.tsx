import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { MedicalRecord, MedicalRecordType } from "@vetconnect/shared/types/pets";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeConfig: Record<
  MedicalRecordType,
  { icon: string; color: string; label: string }
> = {
  consultation: {
    icon: "chatbubble-ellipses-outline",
    color: colors.info,
    label: "Consultation",
  },
  treatment: {
    icon: "medkit-outline",
    color: colors.secondary,
    label: "Treatment",
  },
  surgery: {
    icon: "cut-outline",
    color: colors.error,
    label: "Surgery",
  },
  other: {
    icon: "document-text-outline",
    color: colors.accent,
    label: "Other",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Single Entry
// ---------------------------------------------------------------------------

interface TimelineEntryProps {
  record: MedicalRecord;
  isLast: boolean;
}

function TimelineEntry({ record, isLast }: TimelineEntryProps) {
  const config = typeConfig[record.type] ?? typeConfig.other;

  return (
    <View className="flex-row">
      {/* Timeline line + dot */}
      <View className="mr-3 items-center" style={{ width: 32 }}>
        <View
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Ionicons
            name={config.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={config.color}
          />
        </View>
        {!isLast && (
          <View
            className="flex-1"
            style={{
              width: 2,
              backgroundColor: colors.gray[200],
              marginTop: 4,
              marginBottom: 4,
            }}
          />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 pb-6">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-sm font-semibold"
            style={{ color: config.color }}
          >
            {config.label}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatDate(record.date)}
          </Text>
        </View>

        {record.diagnosis && (
          <View className="mt-2 rounded-lg bg-white p-3">
            <Text className="text-xs font-medium text-gray-400">
              Diagnosis
            </Text>
            <Text className="mt-0.5 text-sm text-brand-text">
              {record.diagnosis}
            </Text>
          </View>
        )}

        {record.treatment && (
          <View className="mt-1.5 rounded-lg bg-white p-3">
            <Text className="text-xs font-medium text-gray-400">
              Treatment
            </Text>
            <Text className="mt-0.5 text-sm text-brand-text">
              {record.treatment}
            </Text>
          </View>
        )}

        {record.notes && (
          <Text className="mt-1.5 text-xs text-gray-500 italic">
            {record.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

interface MedicalTimelineProps {
  records: MedicalRecord[];
}

export function MedicalTimeline({ records }: MedicalTimelineProps) {
  if (records.length === 0) {
    return (
      <View className="items-center py-8">
        <Ionicons
          name="document-text-outline"
          size={40}
          color={colors.gray[300]}
        />
        <Text className="mt-3 text-center text-sm text-gray-400">
          No medical records yet
        </Text>
      </View>
    );
  }

  // Sort by date descending (newest first)
  const sorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <View className="px-2 pt-2">
      {sorted.map((record, idx) => (
        <TimelineEntry
          key={record.id}
          record={record}
          isLast={idx === sorted.length - 1}
        />
      ))}
    </View>
  );
}
