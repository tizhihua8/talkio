import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIdentityStore } from "../../stores/identity-store";

interface IdentitySliderProps {
  visible: boolean;
  activeIdentityId: string | null;
  onSelect: (identityId: string | null) => void;
}

export function IdentitySlider({
  visible,
  activeIdentityId,
  onSelect,
}: IdentitySliderProps) {
  const identities = useIdentityStore((s) => s.identities);

  if (!visible) return null;

  return (
    <View className="border-b border-border-light bg-gray-50 px-2 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {activeIdentityId && (
          <Pressable
            onPress={() => onSelect(null)}
            className="mr-2 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            style={{ minWidth: 100 }}
          >
            <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
            <Text className="mt-1 text-xs font-medium text-red-500">
              Remove
            </Text>
          </Pressable>
        )}

        {identities.map((identity) => {
          const isActive = identity.id === activeIdentityId;
          return (
            <Pressable
              key={identity.id}
              onPress={() => onSelect(identity.id)}
              className={`mr-2 rounded-xl border px-4 py-3 ${
                isActive
                  ? "border-primary bg-primary-light"
                  : "border-border-light bg-white"
              }`}
              style={{ minWidth: 120 }}
            >
              <Ionicons
                name={getIconName(identity.icon)}
                size={20}
                color={isActive ? "#2b2bee" : "#6b7280"}
              />
              <Text
                className={`mt-1 text-sm font-semibold ${
                  isActive ? "text-primary" : "text-text-main"
                }`}
                numberOfLines={1}
              >
                {identity.name}
              </Text>
              <Text className="mt-0.5 text-xs text-text-muted" numberOfLines={2}>
                {identity.systemPrompt.slice(0, 50)}...
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function getIconName(icon: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    code: "code-slash-outline",
    translate: "language-outline",
    architecture: "git-network-outline",
    security: "shield-checkmark-outline",
    finance: "cash-outline",
    writing: "create-outline",
    research: "search-outline",
    marketing: "megaphone-outline",
    design: "color-palette-outline",
    general: "sparkles-outline",
  };
  return iconMap[icon] ?? "sparkles-outline";
}
