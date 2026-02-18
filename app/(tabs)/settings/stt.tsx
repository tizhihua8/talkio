import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../../src/stores/settings-store";
import { ApiClient } from "../../../src/services/api-client";

export default function SttSettingsScreen() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [baseUrl, setBaseUrl] = useState(settings.sttBaseUrl);
  const [apiKey, setApiKey] = useState(settings.sttApiKey);
  const [model, setModel] = useState(settings.sttModel);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const handleFetchModels = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      Alert.alert(t("common.error"), t("settings.sttFetchRequiresFields"));
      return;
    }
    setIsFetching(true);
    try {
      const client = new ApiClient({
        id: "stt-probe",
        name: "STT",
        type: "openai",
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim(),
        enabled: true,
        status: "connected",
        createdAt: "",
        customHeaders: [],
      });
      const raw = await client.listModels();
      const ids = raw.map((m) => m.id).sort();
      setFetchedModels(ids);
      if (ids.length > 0 && !ids.includes(model)) {
        setModel(ids[0]);
      }
    } catch (err) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("providerEdit.fetchFailed"));
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert(t("common.error"), t("settings.sttApiKeyRequired"));
      return;
    }
    updateSettings({ sttBaseUrl: baseUrl.trim(), sttApiKey: apiKey.trim(), sttModel: model });
    Alert.alert(t("common.success"), t("settings.sttSaved"));
  };

  const modelList = fetchedModels.length > 0 ? fetchedModels : (settings.sttModel ? [settings.sttModel] : []);

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Base URL */}
      <View className="px-5 pt-4 mb-4">
        <Text className="mb-1.5 ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Base URL
        </Text>
        <View className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <TextInput
            value={baseUrl}
            onChangeText={(v) => { setBaseUrl(v); setFetchedModels([]); }}
            placeholder="https://api.groq.com/openai/v1"
            placeholderTextColor="#cbd5e1"
            autoCapitalize="none"
            autoCorrect={false}
            className="text-[15px] text-text-main"
          />
        </View>
      </View>

      {/* API Key */}
      <View className="px-5 mb-4">
        <Text className="mb-1.5 ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          API Key
        </Text>
        <View className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <TextInput
            value={apiKey}
            onChangeText={(v) => { setApiKey(v); setFetchedModels([]); }}
            placeholder={t("settings.sttApiKeyPlaceholder")}
            placeholderTextColor="#cbd5e1"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            className="text-[15px] text-text-main"
          />
        </View>
      </View>

      {/* Fetch Models Button */}
      <View className="px-5 mb-4">
        <Pressable
          onPress={handleFetchModels}
          disabled={isFetching}
          className="flex-row items-center justify-center rounded-xl border border-primary py-3"
        >
          {isFetching ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={16} color="#007AFF" />
              <Text className="ml-2 text-[15px] font-medium text-primary">{t("settings.sttFetchModels")}</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Model List */}
      {modelList.length > 0 && (
        <View className="px-5 mb-6">
          <Text className="mb-1.5 ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("settings.sttModelLabel")}
          </Text>
          <View className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {modelList.map((id, idx) => (
              <Pressable
                key={id}
                onPress={() => setModel(id)}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  idx < modelList.length - 1 ? "border-b border-slate-50" : ""
                }`}
              >
                <Text className="flex-1 text-[15px] text-text-main" numberOfLines={1}>{id}</Text>
                {model === id && <Ionicons name="checkmark" size={18} color="#007AFF" />}
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Save */}
      <View className="px-5">
        <Pressable onPress={handleSave} className="items-center rounded-xl bg-primary py-3.5">
          <Text className="text-base font-semibold text-white">{t("common.save")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
