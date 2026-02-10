import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyScreen() {
  return (
    <ScrollView className="flex-1 bg-bg-secondary">
      <View className="mx-4 mt-4 rounded-xl bg-white p-4">
        <View className="flex-row items-center">
          <Ionicons name="shield-checkmark" size={24} color="#2b2bee" />
          <Text className="ml-2 text-base font-semibold text-text-main">Privacy First</Text>
        </View>
        <Text className="mt-2 text-sm leading-5 text-text-muted">
          Avatar is designed with privacy at its core. Your data stays on your device.
        </Text>
      </View>

      <View className="mx-4 mt-4 rounded-xl bg-white p-4">
        <Text className="mb-3 text-sm font-semibold text-text-main">Data Storage</Text>
        <PrivacyItem
          icon="phone-portrait-outline"
          title="Local Storage Only"
          description="All conversations, settings, and API keys are stored locally using encrypted storage (MMKV + SQLite)."
        />
        <PrivacyItem
          icon="key-outline"
          title="API Key Security"
          description="API keys are stored on-device only. They are sent directly to your configured provider endpoints and never pass through any intermediate servers."
        />
        <PrivacyItem
          icon="cloud-offline-outline"
          title="No Cloud by Default"
          description="No data is uploaded to any cloud service unless you explicitly enable WebDAV sync."
        />
      </View>

      <View className="mx-4 mt-4 rounded-xl bg-white p-4">
        <Text className="mb-3 text-sm font-semibold text-text-main">Permissions</Text>
        <PrivacyItem
          icon="mic-outline"
          title="Microphone"
          description="Used for voice input. Only active when you press the mic button."
        />
        <PrivacyItem
          icon="camera-outline"
          title="Camera"
          description="Used for scanning QR codes and capturing images for vision models."
        />
        <PrivacyItem
          icon="images-outline"
          title="Photo Library"
          description="Used for attaching images to conversations with vision-capable models."
        />
      </View>

      <View className="mx-4 mb-8 mt-4 rounded-xl bg-white p-4">
        <Text className="mb-3 text-sm font-semibold text-text-main">Data Management</Text>
        <Text className="text-sm leading-5 text-text-muted">
          You can export or delete all your data at any time from the Settings page. We do not collect analytics or telemetry data.
        </Text>
      </View>
    </ScrollView>
  );
}

function PrivacyItem({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="mb-3 flex-row">
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-lg bg-primary-light">
        <Ionicons name={icon} size={16} color="#2b2bee" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-medium text-text-main">{title}</Text>
        <Text className="mt-0.5 text-xs leading-4 text-text-muted">{description}</Text>
      </View>
    </View>
  );
}
