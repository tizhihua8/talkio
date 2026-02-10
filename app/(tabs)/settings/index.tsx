import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProviderStore } from "../../../src/stores/provider-store";
import { useSettingsStore } from "../../../src/stores/settings-store";

export default function SettingsScreen() {
  const router = useRouter();
  const providers = useProviderStore((s) => s.providers);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return (
    <ScrollView className="flex-1 bg-bg-secondary">
      <View className="mx-4 mt-3 rounded-xl bg-white">
        <SettingsRow
          icon="server-outline"
          label="Providers"
          detail={`${providers.length} configured`}
          onPress={() => router.push("/(tabs)/settings/providers")}
        />
        <SettingsRow
          icon="sync-outline"
          label="Data Sync"
          detail={settings.syncEnabled ? "Enabled" : "Off"}
          onPress={() => router.push("/(tabs)/settings/sync")}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          label="Privacy & Permissions"
          onPress={() => router.push("/(tabs)/settings/privacy")}
          isLast
        />
      </View>

      <View className="mx-4 mt-4 rounded-xl bg-white">
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center">
            <Ionicons name="hand-left-outline" size={20} color="#6b7280" />
            <Text className="ml-3 text-base text-text-main">Haptic Feedback</Text>
          </View>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={(v) => updateSettings({ hapticFeedback: v })}
            trackColor={{ true: "#2b2bee" }}
          />
        </View>
        <View className="mx-4 h-px bg-border-light" />
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center">
            <Ionicons name="flash-outline" size={20} color="#6b7280" />
            <Text className="ml-3 text-base text-text-main">Quick Prompts</Text>
          </View>
          <Switch
            value={settings.quickPromptEnabled}
            onValueChange={(v) => updateSettings({ quickPromptEnabled: v })}
            trackColor={{ true: "#2b2bee" }}
          />
        </View>
        <View className="mx-4 h-px bg-border-light" />
        <View className="flex-row items-center justify-between px-4 py-3.5">
          <View className="flex-row items-center">
            <Ionicons name="mic-outline" size={20} color="#6b7280" />
            <Text className="ml-3 text-base text-text-main">Voice Auto-transcribe</Text>
          </View>
          <Switch
            value={settings.voiceAutoTranscribe}
            onValueChange={(v) => updateSettings({ voiceAutoTranscribe: v })}
            trackColor={{ true: "#2b2bee" }}
          />
        </View>
      </View>

      <View className="mx-4 mt-4 rounded-xl bg-white">
        <View className="items-center px-4 py-6">
          <Ionicons name="lock-closed" size={20} color="#9ca3af" />
          <Text className="mt-2 text-center text-xs text-text-hint">
            End-to-End Encryption{"\n"}API keys are stored securely on this device{"\n"}and are never sent to our servers.
          </Text>
        </View>
      </View>

      <View className="items-center py-6">
        <Text className="text-xs text-text-hint">Avatar v0.1.0</Text>
      </View>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  detail,
  onPress,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <>
      <Pressable onPress={onPress} className="flex-row items-center px-4 py-3.5">
        <Ionicons name={icon} size={20} color="#6b7280" />
        <Text className="ml-3 flex-1 text-base text-text-main">{label}</Text>
        {detail && <Text className="mr-2 text-sm text-text-muted">{detail}</Text>}
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </Pressable>
      {!isLast && <View className="mx-4 h-px bg-border-light" />}
    </>
  );
}
