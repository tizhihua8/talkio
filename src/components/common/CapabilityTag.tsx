import { View, Text } from "react-native";
import { TAG_COLORS } from "../../constants";

interface CapabilityTagProps {
  label: string;
  type: string;
  active?: boolean;
}

export function CapabilityTag({ label, type, active = true }: CapabilityTagProps) {
  const colors = TAG_COLORS[type] ?? TAG_COLORS.streaming;

  return (
    <View
      className={`rounded-full px-2 py-0.5 ${active ? colors.bg : "bg-gray-100"}`}
    >
      <Text
        className={`text-xs font-medium ${active ? colors.text : "text-gray-400"}`}
      >
        {label}
      </Text>
    </View>
  );
}
