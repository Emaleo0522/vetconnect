import { View, Text, Pressable, Linking, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

interface ContactButtonsProps {
  phone: string | null;
  latitude: string | null;
  longitude: string | null;
  clinicName: string | null;
}

export function ContactButtons({
  phone,
  latitude,
  longitude,
  clinicName,
}: ContactButtonsProps) {
  const handleCall = () => {
    if (!phone) {
      Alert.alert("No phone", "This veterinarian has not provided a phone number.");
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, "");
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const handleWhatsApp = () => {
    if (!phone) {
      Alert.alert("No phone", "This veterinarian has not provided a phone number.");
      return;
    }
    // Remove + and spaces for WhatsApp format
    const cleanPhone = phone.replace(/[\s+\-()]/g, "");
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };

  const handleMap = () => {
    if (!latitude || !longitude) {
      Alert.alert("No location", "This veterinarian has not provided their location.");
      return;
    }
    const label = clinicName ?? "Veterinarian";
    Linking.openURL(
      `https://maps.google.com/?q=${latitude},${longitude}&label=${encodeURIComponent(label)}`,
    );
  };

  return (
    <View className="mt-2 bg-white px-4 py-4">
      <Text className="mb-3 text-base font-semibold text-brand-text">
        Contact
      </Text>
      <View className="flex-row gap-3">
        {/* Call */}
        <Pressable
          onPress={handleCall}
          className="flex-1 items-center rounded-xl bg-brand-primary/10 py-3 active:opacity-70"
          accessibilityLabel="Call veterinarian"
        >
          <Ionicons name="call" size={22} color={colors.primary} />
          <Text className="mt-1 text-xs font-medium text-brand-primary">
            Call
          </Text>
        </Pressable>

        {/* WhatsApp */}
        <Pressable
          onPress={handleWhatsApp}
          className="flex-1 items-center rounded-xl py-3 active:opacity-70"
          style={{ backgroundColor: `${colors.secondary}15` }}
          accessibilityLabel="Open WhatsApp"
        >
          <Ionicons name="logo-whatsapp" size={22} color={colors.secondary} />
          <Text className="mt-1 text-xs font-medium" style={{ color: colors.secondary }}>
            WhatsApp
          </Text>
        </Pressable>

        {/* Map */}
        <Pressable
          onPress={handleMap}
          className="flex-1 items-center rounded-xl bg-gray-100 py-3 active:opacity-70"
          accessibilityLabel="View on map"
        >
          <Ionicons name="map" size={22} color={colors.gray[600]} />
          <Text className="mt-1 text-xs font-medium text-gray-600">
            Map
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
