import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../hooks/useThemeColors";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons name={icon} size={48} color={colors.searchIcon} />
      <Text className="mt-4 text-center text-lg font-semibold text-text-main">
        {title}
      </Text>
      {description && (
        <Text className="mt-2 text-center text-sm text-text-muted">
          {description}
        </Text>
      )}
    </View>
  );
}
