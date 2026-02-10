import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useProviderStore } from "../../../src/stores/provider-store";
import { useChatStore } from "../../../src/stores/chat-store";
import { ModelAvatar } from "../../../src/components/common/ModelAvatar";
import { CapabilityTag } from "../../../src/components/common/CapabilityTag";

export default function ModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const getModelById = useProviderStore((s) => s.getModelById);
  const getProviderById = useProviderStore((s) => s.getProviderById);
  const probeModelCapabilities = useProviderStore((s) => s.probeModelCapabilities);
  const createConversation = useChatStore((s) => s.createConversation);
  const [probing, setProbing] = useState(false);

  const model = id ? getModelById(id) : undefined;
  const provider = model ? getProviderById(model.providerId) : undefined;

  useEffect(() => {
    navigation.setOptions({ title: model?.displayName ?? "Model" });
  }, [model]);

  if (!model) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-text-muted">Model not found</Text>
      </View>
    );
  }

  const handleStartChat = async () => {
    const conv = await createConversation("single", [
      { modelId: model.id, identityId: null },
    ]);
    router.push(`/(tabs)/chats/${conv.id}`);
  };

  const handleProbe = async () => {
    setProbing(true);
    try {
      const caps = await probeModelCapabilities(model.id);
      Alert.alert("Detection Complete", `Vision: ${caps.vision}\nTools: ${caps.toolCall}\nReasoning: ${caps.reasoning}`);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Detection failed");
    } finally {
      setProbing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="items-center px-4 pt-8">
        <ModelAvatar name={model.displayName} size="lg" online />
        <Text className="mt-3 text-xl font-bold text-text-main">
          {model.displayName}
        </Text>
        <Text className="mt-1 text-sm text-text-muted">
          {provider?.name} · {model.modelId}
        </Text>
      </View>

      <View className="mx-4 mt-6 rounded-xl border border-border-light bg-bg-secondary p-4">
        <Text className="mb-3 text-sm font-semibold text-text-main">Capabilities</Text>
        <View className="flex-row flex-wrap gap-2">
          <CapabilityTag label="Vision" type="vision" active={model.capabilities.vision} />
          <CapabilityTag label="Tools" type="tools" active={model.capabilities.toolCall} />
          <CapabilityTag label="Reasoning" type="reasoning" active={model.capabilities.reasoning} />
          <CapabilityTag label="Streaming" type="streaming" active={model.capabilities.streaming} />
        </View>
        <View className="mt-3 flex-row items-center">
          <Text className="text-xs text-text-muted">
            {model.capabilitiesVerified ? "✅ Verified" : "⚠️ Inferred from model ID"}
          </Text>
          <Pressable
            onPress={handleProbe}
            disabled={probing}
            className="ml-auto flex-row items-center rounded-full bg-primary-light px-3 py-1"
          >
            {probing ? (
              <ActivityIndicator size="small" color="#2b2bee" />
            ) : (
              <>
                <Ionicons name="flash" size={14} color="#2b2bee" />
                <Text className="ml-1 text-xs font-medium text-primary">Detect</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <View className="mx-4 mt-4 rounded-xl border border-border-light bg-bg-secondary p-4">
        <Text className="mb-2 text-sm font-semibold text-text-main">Details</Text>
        <DetailRow label="Model ID" value={model.modelId} />
        <DetailRow label="Provider" value={provider?.name ?? "Unknown"} />
        <DetailRow label="Max Context" value={`${(model.maxContextLength / 1000).toFixed(0)}K tokens`} />
        <DetailRow label="Status" value={model.enabled ? "Active" : "Disabled"} />
      </View>

      <View className="mx-4 mt-6 mb-8">
        <Pressable
          onPress={handleStartChat}
          className="items-center rounded-2xl bg-primary py-4"
        >
          <Text className="text-base font-semibold text-white">Start Chat</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-b border-border-light py-2 last:border-b-0">
      <Text className="text-sm text-text-muted">{label}</Text>
      <Text className="text-sm font-medium text-text-main">{value}</Text>
    </View>
  );
}
