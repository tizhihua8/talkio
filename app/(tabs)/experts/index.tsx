import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useProviderStore } from "../../../src/stores/provider-store";
import { useChatStore } from "../../../src/stores/chat-store";
import { ModelAvatar } from "../../../src/components/common/ModelAvatar";
import { CapabilityTag } from "../../../src/components/common/CapabilityTag";
import { EmptyState } from "../../../src/components/common/EmptyState";
import type { Model } from "../../../src/types";

export default function ExpertsScreen() {
  const router = useRouter();
  const providers = useProviderStore((s) => s.providers);
  const models = useProviderStore((s) => s.getEnabledModels);
  const getProviderById = useProviderStore((s) => s.getProviderById);
  const createConversation = useChatStore((s) => s.createConversation);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([]);
  const [groupMode, setGroupMode] = useState(false);

  const enabledModels = models();
  const filtered = enabledModels.filter((m) =>
    searchQuery
      ? m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.modelId.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const groupedModels = groupByCapability(filtered);

  const handleStartChat = useCallback(
    async (model: Model) => {
      if (groupMode) {
        setSelectedForGroup((prev) =>
          prev.includes(model.id)
            ? prev.filter((id) => id !== model.id)
            : [...prev, model.id],
        );
        return;
      }
      const conv = await createConversation("single", [
        { modelId: model.id, identityId: null },
      ]);
      router.push(`/(tabs)/chats/${conv.id}`);
    },
    [groupMode, createConversation, router],
  );

  const handleCreateGroup = useCallback(async () => {
    if (selectedForGroup.length < 2) {
      Alert.alert("Select Models", "Pick at least 2 models for a group chat.");
      return;
    }
    const participants = selectedForGroup.map((id) => ({
      modelId: id,
      identityId: null,
    }));
    const conv = await createConversation("group", participants);
    setGroupMode(false);
    setSelectedForGroup([]);
    router.push(`/(tabs)/chats/${conv.id}`);
  }, [selectedForGroup, createConversation, router]);

  const renderModelItem = useCallback(
    ({ item }: { item: Model }) => {
      const provider = getProviderById(item.providerId);
      const isSelected = selectedForGroup.includes(item.id);

      return (
        <Pressable
          onPress={() => handleStartChat(item)}
          className={`mx-4 mb-2 flex-row items-center rounded-xl border bg-white px-4 py-3 ${
            isSelected ? "border-primary bg-primary-light" : "border-border-light"
          }`}
        >
          <ModelAvatar name={item.displayName} size="md" online />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-semibold text-text-main">
                {item.displayName}
              </Text>
              {item.capabilitiesVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#2b2bee"
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text className="text-xs text-text-muted">
              {provider?.name ?? "Unknown"} · {item.modelId}
            </Text>
            <View className="mt-1 flex-row flex-wrap gap-1">
              {item.capabilities.reasoning && (
                <CapabilityTag label="Reasoning" type="reasoning" />
              )}
              {item.capabilities.vision && (
                <CapabilityTag label="Vision" type="vision" />
              )}
              {item.capabilities.toolCall && (
                <CapabilityTag label="Tools" type="tools" />
              )}
            </View>
          </View>
          {groupMode && (
            <View className="ml-2">
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={isSelected ? "#2b2bee" : "#d1d5db"}
              />
            </View>
          )}
          {!groupMode && (
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          )}
        </Pressable>
      );
    },
    [getProviderById, handleStartChat, groupMode, selectedForGroup],
  );

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="bg-white px-4 pb-3">
        <View className="flex-row items-center rounded-xl bg-bg-secondary px-3 py-2">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="ml-2 flex-1 text-sm text-text-main"
            placeholder="Search models..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="bg-white px-4 pb-3">
        <Text className="mb-2 text-xs font-semibold uppercase text-text-muted">
          Active Providers
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {providers.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => router.push("/(tabs)/settings/providers")}
              className="mr-3 items-center"
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-bg-secondary">
                <Text className="text-lg font-bold text-text-main">
                  {p.name.slice(0, 2)}
                </Text>
              </View>
              <Text className="mt-1 text-[10px] text-text-muted">{p.name}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push("/(tabs)/settings/providers")}
            className="items-center"
          >
            <View className="h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border-light">
              <Ionicons name="add" size={20} color="#9ca3af" />
            </View>
            <Text className="mt-1 text-[10px] text-text-muted">Add</Text>
          </Pressable>
        </ScrollView>
      </View>

      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-xs font-semibold uppercase text-text-muted">
          {filtered.length} Models
        </Text>
        <Pressable
          onPress={() => {
            setGroupMode(!groupMode);
            setSelectedForGroup([]);
          }}
          className={`rounded-full px-3 py-1 ${groupMode ? "bg-primary" : "bg-white"}`}
        >
          <Text className={`text-xs font-medium ${groupMode ? "text-white" : "text-primary"}`}>
            {groupMode ? "Cancel" : "Group Chat"}
          </Text>
        </Pressable>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No models found"
          description="Add a provider in Settings to get started"
        />
      ) : (
        <FlashList
          data={filtered}
          renderItem={renderModelItem}
          estimatedItemSize={90}
          keyExtractor={(item) => item.id}
        />
      )}

      {groupMode && selectedForGroup.length >= 2 && (
        <View className="absolute bottom-4 left-4 right-4">
          <Pressable
            onPress={handleCreateGroup}
            className="items-center rounded-2xl bg-primary py-4"
          >
            <Text className="text-base font-semibold text-white">
              Create Group Chat ({selectedForGroup.length} models)
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function groupByCapability(models: Model[]): Map<string, Model[]> {
  const groups = new Map<string, Model[]>();
  for (const m of models) {
    const key = m.capabilities.reasoning
      ? "Reasoning"
      : m.capabilities.vision
        ? "Multimodal"
        : "General";
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }
  return groups;
}
