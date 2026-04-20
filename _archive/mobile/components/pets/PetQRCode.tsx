import { useRef, useCallback } from "react";
import { View, Text, Pressable, Platform, Alert } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";

import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PetQRCodeProps {
  uuid: string;
  petName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PetQRCode({ uuid, petName }: PetQRCodeProps) {
  const svgRef = useRef<QRCode | null>(null);

  const handleShare = useCallback(async () => {
    if (!svgRef.current) return;

    try {
      // QRCode component has a toDataURL method
      (svgRef.current as unknown as { toDataURL: (cb: (data: string) => void) => void }).toDataURL(
        async (dataUrl: string) => {
          if (Platform.OS === "web") {
            Alert.alert("Info", "Sharing is not supported on web.");
            return;
          }

          const available = await Sharing.isAvailableAsync();
          if (!available) {
            Alert.alert("Info", "Sharing is not available on this device.");
            return;
          }

          // Write the base64 to a temp file via FileSystem (legacy API for SDK 54)
          try {
            const LegacyFS = await import("expo-file-system/legacy");
            const fileUri = `${LegacyFS.cacheDirectory}pet-qr-${uuid}.png`;
            await LegacyFS.writeAsStringAsync(fileUri, dataUrl, {
              encoding: LegacyFS.EncodingType.Base64,
            });
            await Sharing.shareAsync(fileUri, {
              mimeType: "image/png",
              dialogTitle: `QR Code for ${petName}`,
            });
          } catch {
            Alert.alert("Error", "Could not share QR code.");
          }
        },
      );
    } catch {
      Alert.alert("Error", "Could not generate QR code for sharing.");
    }
  }, [uuid, petName]);

  return (
    <View className="items-center py-4">
      <View className="rounded-2xl bg-white p-6 shadow-sm">
        <QRCode
          getRef={(ref) => {
            svgRef.current = ref as unknown as QRCode;
          }}
          value={uuid}
          size={200}
          color={colors.text}
          backgroundColor={colors.white}
        />
      </View>

      <Text className="mt-4 px-8 text-center text-sm text-gray-500">
        Scan this QR to view the public profile of {petName}
      </Text>

      <Pressable
        onPress={handleShare}
        className="mt-4 flex-row items-center rounded-xl border-2 border-brand-primary px-6 py-3 active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Share QR code"
      >
        <Ionicons name="share-outline" size={18} color={colors.primary} />
        <Text className="ml-2 text-sm font-semibold text-brand-primary">
          Share QR Code
        </Text>
      </Pressable>
    </View>
  );
}
