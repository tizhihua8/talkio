import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../../../src/stores/settings-store";

const STT_MODELS = [
  { label: "whisper-large-v3-turbo", value: "whisper-large-v3-turbo" },
  { label: "whisper-large-v3", value: "whisper-large-v3" },
  { label: "whisper-1", value: "whisper-1" },
];

const STT_PRESETS = [
  { label: "Groq (Free)", baseUrl: "https://api.groq.com/openai/v1", defaultModel: "whisper-large-v3-turbo" },
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", defaultModel: "whisper-1" },
];

export default function SttSettingsScreen() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [baseUrl, setBaseUrl] = useState(settings.sttBaseUrl);
  const [apiKey, setApiKey] = useState(settings.sttApiKey);
  const [model, setModel] = useState(settings.sttModel);

  const handleSave = () => {
    if (!apiKey.trim()) {
      Alert.alert(t("common.error"), t("settings.sttApiKeyRequired"));
      return;
    }
    updateSettings({ sttBaseUrl: baseUrl.trim(), sttApiKey: apiKey.trim(), sttModel: model });
    Alert.alert(t("common.success"), t("settings.sttSaved"));
  };

  return (
    <ScrollView className="flex-1 bg-bg-secondary" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Presets */}
      <View className="px-5 pt-4 mb-6">
        <Text className="mb-2 ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t("settings.sttPresets")}
        </Text>
        <View className="flex-row gap-2">
          {STT_PRESETS.map((preset) => {
            const isActive = baseUrl === preset.baseUrl;
            return (
              <Pressable
                key={preset.label}
                onPress={() => {
                  setBaseUrl(preset.baseUrl);
                  setModel(preset.defaultModel);
                }}
                className={`flex-1 items-center rounded-xl border px-3 py-3 ${
                  isActive ? "border-primary bg-primary/5" : "border-slate-200 bg-white"
                }`}
              >
                <Ionicons
                  name={preset.label.includes("Groq") ? "flash-outline" : "logo-apple"}
                  size={20}
                  color={isActive ? "#007AFF" : "#94a3b8"}
                />
                <Text className={`mt-1 text-xs font-semibold ${isActive ? "text-primary" : "text-slate-500"}`}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Base URL */}
      <View className="px-5 mb-4">
        <Text className="mb-1.5 ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Base URL
        </Text>
        <View className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <TextInput
            value={baseUrl}
            onChangeText={setBaseUrl}
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
            onChangeText={setApiKey}
            placeholder={t("settings.sttApiKeyPlaceholder")}
            placeholderTextColor="#cbd5e1"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            className="text-[15px] text-text-main"
          />
        </View>
      </View>

      {/* Model Selection */}
      <View className="px-5 mb-6">
        <Text className="mb-1.5 ml-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {t("settings.sttModelLabel")}
        </Text>
        <View className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {STT_MODELS.map((m, idx) => (
            <Pressable
              key={m.value}
              onPress={() => setModel(m.value)}
              className={`flex-row items-center justify-between px-4 py-3 ${
                idx < STT_MODELS.length - 1 ? "border-b border-slate-50" : ""
              }`}
            >
              <Text className="text-[15px] text-text-main">{m.label}</Text>
              {model === m.value && <Ionicons name="checkmark" size={18} color="#007AFF" />}
            </Pressable>
          ))}
        </View>
        <Text className="mt-1.5 ml-2 text-[11px] text-slate-400">
          {t("settings.sttModelHint")}
        </Text>
      </View>

      {/* Save Button */}
      <View className="px-5">
        <Pressable
          onPress={handleSave}
          className="items-center rounded-xl bg-primary py-3.5"
        >
          <Text className="text-base font-semibold text-white">{t("common.save")}</Text>
        </Pressable>
      </View>

      {/* Help */}
      <View className="px-8 mt-6">
        <View className="rounded-xl border border-blue-100/50 bg-blue-50/50 p-4">
          <Text className="text-xs leading-relaxed text-slate-500">
            <Ionicons name="information-circle" size={10} color="#6b7280" /> {t("settings.sttHelp")}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
