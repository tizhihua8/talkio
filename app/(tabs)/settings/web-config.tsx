import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useProviderStore } from "../../../src/stores/provider-store";
import {
  startConfigServer,
  stopConfigServer,
  type ProviderConfig,
} from "../../../src/services/config-server";

export default function WebConfigScreen() {
  const { t } = useTranslation();
  const addProvider = useProviderStore((s) => s.addProvider);
  const testConnection = useProviderStore((s) => s.testConnection);

  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [receivedCount, setReceivedCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const handleConfig = async (config: ProviderConfig) => {
      const provider = addProvider({
        name: config.name,
        type: "official",
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      });
      await testConnection(provider.id);
      if (mounted) {
        setReceivedCount((c) => c + 1);
        Alert.alert(
          t("webConfig.providerAdded"),
          t("webConfig.providerAddedDetail", { name: config.name }),
        );
      }
    };

    startConfigServer(handleConfig)
      .then((url) => {
        if (mounted) setServerUrl(url);
      })
      .catch((err) => {
        Alert.alert(
          t("common.error"),
          err instanceof Error ? err.message : "Failed to start server",
        );
      });

    return () => {
      mounted = false;
      stopConfigServer();
    };
  }, []);

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="flex-1 items-center justify-center px-8">
        {serverUrl ? (
          <>
            <View className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <QRCode value={serverUrl} size={200} />
            </View>

            <Text className="mb-2 text-center text-lg font-bold text-text-main">
              {t("webConfig.scanOrVisit")}
            </Text>

            <View className="mb-6 rounded-xl bg-white px-5 py-3">
              <Text className="text-center text-base font-mono font-semibold text-primary">
                {serverUrl}
              </Text>
            </View>

            <Text className="mb-2 text-center text-sm text-text-muted">
              {t("webConfig.instructions")}
            </Text>

            {receivedCount > 0 && (
              <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
                <Text className="text-sm font-medium text-green-700">
                  {t("webConfig.received", { count: receivedCount })}
                </Text>
              </View>
            )}

            <View className="mt-8 flex-row items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
              <Ionicons name="shield-checkmark-outline" size={16} color="#3b82f6" />
              <Text className="flex-1 text-xs text-blue-600">
                {t("webConfig.securityNote")}
              </Text>
            </View>
          </>
        ) : (
          <View className="items-center">
            <Ionicons name="hourglass-outline" size={32} color="#9ca3af" />
            <Text className="mt-3 text-sm text-text-muted">
              {t("webConfig.starting")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
