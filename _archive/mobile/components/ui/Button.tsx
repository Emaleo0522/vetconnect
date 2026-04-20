import { ActivityIndicator, Pressable, Text } from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantStyles: Record<
  ButtonVariant,
  { container: string; text: string; loaderColor: string }
> = {
  primary: {
    container: "bg-brand-primary",
    text: "text-white font-semibold",
    loaderColor: "#FFFFFF",
  },
  secondary: {
    container: "bg-brand-secondary",
    text: "text-white font-semibold",
    loaderColor: "#FFFFFF",
  },
  outline: {
    container: "bg-transparent border-2 border-brand-primary",
    text: "text-brand-primary font-semibold",
    loaderColor: "#2B7A9E",
  },
  danger: {
    container: "bg-transparent border-2 border-red-500",
    text: "text-red-500 font-semibold",
    loaderColor: "#E53E3E",
  },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const styles = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full items-center justify-center rounded-xl px-6 py-4 active:opacity-70 ${styles.container} ${isDisabled ? "opacity-50" : ""} ${className}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={styles.loaderColor} size="small" />
      ) : (
        <Text className={`text-base ${styles.text}`}>{title}</Text>
      )}
    </Pressable>
  );
}
