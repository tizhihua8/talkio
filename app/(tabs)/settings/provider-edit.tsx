import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProviderStore } from "../../../src/stores/provider-store";
import { CapabilityTag } from "../../../src/components/common/CapabilityTag";
import { PROVIDER_PRESETS } from "../../../src/constants";
import type { Model } from "../../../src/types";

export default function ProviderEditScreen() {
  const router = useRouter();
  const addProvider = useProviderStore((s) => s.addProvider);
  const testConnection = useProviderStore((s) => s.testConnection);
  const fetchModels = useProviderStore((s) => s.fetchModels);

  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [pulledModels, setPulledModels] = useState<Model[]>([]);
  const [pulling, setPulling] = useState(false);
  const [savedProviderId, setSavedProviderId] = useState<string | null>(null);

  const applyPreset = (key: string) => {
    const preset = PROVIDER_PRESETS[key];
    if (preset) {
      setName(preset.name);
      setBaseUrl(preset.baseUrl);
    }
  };

  const handleTest = async () => {
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    setTesting(true);
    const provider = addProvider({
      name: name.trim(),
      type: "official",
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
    });
    setSavedProviderId(provider.id);

    const ok = await testConnection(provider.id);
    setConnected(ok);
    setTesting(false);

    if (!ok) {
      Alert.alert("Connection Failed", "Check your API key and base URL.");
    }
  };

  const handlePullModels = async () => {
    if (!savedProviderId) return;
    setPulling(true);
    try {
      const models = await fetchModels(savedProviderId);
      setPulledModels(models);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to fetch models");
    } finally {
      setPulling(false);
    }
  };

  const handleSave = () => {
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-4">
        <Text className="mb-2 text-xs font-semibold uppercase text-text-muted">Quick Select</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(PROVIDER_PRESETS).map((key) => (
            <Pressable
              key={key}
              onPress={() => applyPreset(key)}
              className="mr-2 rounded-full border border-border-light px-3 py-1.5"
            >
              <Text className="text-xs text-text-muted">{PROVIDER_PRESETS[key].name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="px-4 pt-4">
        <Text className="mb-1 text-xs font-semibold uppercase text-text-muted">Provider Details</Text>
        <View className="mt-2 rounded-xl border border-border-light bg-bg-secondary">
          <View className="flex-row items-center border-b border-border-light px-4 py-3">
            <Text className="w-20 text-sm text-text-muted">Name</Text>
            <TextInput
              className="flex-1 text-sm text-text-main"
              value={name}
              onChangeText={setName}
              placeholder="OpenRouter"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View className="flex-row items-center border-b border-border-light px-4 py-3">
            <Text className="w-20 text-sm text-text-muted">Base URL</Text>
            <TextInput
              className="flex-1 text-sm text-text-main"
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://openrouter.ai/api/v1"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <View className="flex-row items-center px-4 py-3">
            <Text className="w-20 text-sm text-text-muted">API Key</Text>
            <TextInput
              className="flex-1 text-sm text-text-main"
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      <View className="px-4 pt-4">
        <Pressable
          onPress={handleTest}
          disabled={testing}
          className={`items-center rounded-2xl py-4 ${
            connected === true ? "bg-success" : connected === false ? "bg-error" : "bg-primary"
          }`}
        >
          {testing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-semibold text-white">
              {connected === true
                ? "✅ Connection Successful"
                : connected === false
                  ? "❌ Connection Failed — Retry"
                  : "Test Connection"}
            </Text>
          )}
        </Pressable>
      </View>

      {connected && (
        <View className="px-4 pt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase text-text-muted">
              Pulled Models ({pulledModels.length})
            </Text>
            <Pressable onPress={handlePullModels} disabled={pulling} className="flex-row items-center">
              {pulling ? (
                <ActivityIndicator size="small" color="#2b2bee" />
              ) : (
                <>
                  <Ionicons name="refresh" size={14} color="#2b2bee" />
                  <Text className="ml-1 text-xs font-medium text-primary">Refresh</Text>
                </>
              )}
            </Pressable>
          </View>

          {pulledModels.map((m) => (
            <View key={m.id} className="mt-2 rounded-xl border border-border-light bg-bg-secondary p-3">
              <Text className="text-sm font-semibold text-text-main">{m.displayName}</Text>
              <Text className="text-xs text-text-muted">{m.modelId}</Text>
              <View className="mt-1.5 flex-row flex-wrap gap-1">
                <CapabilityTag label="Vision" type="vision" active={m.capabilities.vision} />
                <CapabilityTag label="Tools" type="tools" active={m.capabilities.toolCall} />
                <CapabilityTag label="Reasoning" type="reasoning" active={m.capabilities.reasoning} />
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="px-4 pb-8 pt-6">
        {connected && (
          <Pressable onPress={handleSave} className="items-center rounded-2xl bg-primary py-4">
            <Text className="text-base font-semibold text-white">Save</Text>
          </Pressable>
        )}
      </View>

      <View className="items-center pb-6">
        <Ionicons name="lock-closed" size={16} color="#9ca3af" />
        <Text className="mt-1 text-center text-[10px] text-text-hint">
          API keys are stored securely on this device and are never sent to our servers.
        </Text>
      </View>
    </ScrollView>
  );
}
