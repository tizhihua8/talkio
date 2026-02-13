import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, Switch } from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useIdentityStore } from "../../../src/stores/identity-store";
// Remote MCP tool editor (built-in tools are managed separately)

export default function ToolEditScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const getMcpToolById = useIdentityStore((s) => s.getMcpToolById);
  const addMcpTool = useIdentityStore((s) => s.addMcpTool);
  const updateMcpTool = useIdentityStore((s) => s.updateMcpTool);

  const existing = id ? getMcpToolById(id) : undefined;
  const isNew = !existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [endpoint, setEndpoint] = useState(existing?.endpoint ?? "");
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("toolEdit.nameRequired"));
      return;
    }
    if (!endpoint.trim()) {
      Alert.alert(t("common.error"), t("toolEdit.endpointRequired"));
      return;
    }

    const data = {
      name: name.trim(),
      type: "remote" as const,
      scope: "global" as const,
      description: description.trim(),
      endpoint: endpoint.trim(),
      nativeModule: null,
      permissions: [] as string[],
      enabled,
      schema: {
        name: name.trim().toLowerCase().replace(/\s+/g, "_"),
        description: description.trim(),
        parameters: { type: "object" as const, properties: {} },
      },
    };

    if (isNew) {
      addMcpTool(data);
    } else {
      updateMcpTool(id!, data);
    }
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-white" keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-4">
        <Text className="mb-1 text-sm font-medium text-text-muted">{t("toolEdit.name")}</Text>
        <TextInput
          className="rounded-xl border border-border-light bg-bg-secondary px-4 py-3 text-base text-text-main"
          value={name}
          onChangeText={setName}
          placeholder={t("toolEdit.namePlaceholder")}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View className="px-4 pt-4">
        <Text className="mb-1 text-sm font-medium text-text-muted">{t("toolEdit.description")}</Text>
        <TextInput
          className="min-h-[80px] rounded-xl border border-border-light bg-bg-secondary px-4 py-3 text-sm text-text-main"
          value={description}
          onChangeText={setDescription}
          placeholder={t("toolEdit.descPlaceholder")}
          placeholderTextColor="#9ca3af"
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="px-4 pt-4">
        <Text className="mb-1 text-sm font-medium text-text-muted">{t("toolEdit.endpointUrl")}</Text>
        <TextInput
          className="rounded-xl border border-border-light bg-bg-secondary px-4 py-3 text-sm text-text-main"
          value={endpoint}
          onChangeText={setEndpoint}
          placeholder="https://mcp-server.example.com/sse"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="url"
        />
      </View>

      <View className="mx-4 mt-4 flex-row items-center justify-between rounded-xl border border-border-light bg-bg-secondary px-4 py-3">
        <Text className="text-sm text-text-main">{t("toolEdit.enabled")}</Text>
        <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: "#e5e7eb", true: "#007AFF" }} thumbColor="#fff" ios_backgroundColor="#e5e7eb" />
      </View>

      <View className="px-4 pb-8 pt-6">
        <Pressable onPress={handleSave} className="items-center rounded-2xl bg-primary py-4">
          <Text className="text-base font-semibold text-white">
            {isNew ? t("toolEdit.addTool") : t("toolEdit.saveChanges")}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
