import { forwardRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  /** Show a toggle to reveal/hide secure text. Only works when secureTextEntry is true. */
  toggleSecure?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, toggleSecure, secureTextEntry, className, ...rest },
  ref,
) {
  const [hidden, setHidden] = useState(true);

  const isSecure = secureTextEntry && hidden;

  return (
    <View className="mb-4 w-full">
      <Text className="mb-1.5 text-sm font-medium text-brand-text">
        {label}
      </Text>

      <View
        className={`flex-row items-center rounded-xl border bg-white px-4 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        <TextInput
          ref={ref}
          className="flex-1 py-3.5 text-base text-brand-text"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...rest}
        />

        {secureTextEntry && toggleSecure && (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            className="ml-2"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </Pressable>
        )}
      </View>

      {error && (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      )}
    </View>
  );
});
