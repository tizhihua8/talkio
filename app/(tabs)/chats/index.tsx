import { useState, useCallback } from "react";
import { View, Text, Pressable, TextInput, Alert } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatStore } from "../../../src/stores/chat-store";
import { useProviderStore } from "../../../src/stores/provider-store";
import { useIdentityStore } from "../../../src/stores/identity-store";
import { ModelAvatar } from "../../../src/components/common/ModelAvatar";
import { CapabilityTag } from "../../../src/components/common/CapabilityTag";
import { EmptyState } from "../../../src/components/common/EmptyState";
import type { Conversation } from "../../../src/types";

type FilterType = "all" | "single" | "group";

export default function ChatsScreen() {
  const router = useRouter();
  const conversations = useChatStore((s) => s.conversations);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const getModelById = useProviderStore((s) => s.getModelById);
  const getIdentityById = useIdentityStore((s) => s.getIdentityById);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = conversations.filter((c) => {
    if (filter === "single" && c.type !== "single") return false;
    if (filter === "group" && c.type !== "group") return false;
    if (searchQuery) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert("Delete Chat", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteConversation(id) },
      ]);
    },
    [deleteConversation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const firstModel = getModelById(item.participants[0]?.modelId);
      const modelName = firstModel?.displayName ?? "Unknown";
      const identity = item.participants[0]?.identityId
        ? getIdentityById(item.participants[0].identityId)
        : null;

      return (
        <Pressable
          onPress={() => router.push(`/(tabs)/chats/${item.id}`)}
          onLongPress={() => handleDelete(item.id)}
          className="flex-row items-center border-b border-border-light bg-white px-4 py-3"
        >
          <ModelAvatar
            name={modelName}
            size="md"
            online={firstModel ? true : undefined}
          />
          <View className="ml-3 flex-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <Text className="text-base font-semibold text-text-main" numberOfLines={1}>
                  {item.type === "group" ? item.title : modelName}
                </Text>
                {firstModel?.capabilities.reasoning && (
                  <View className="ml-2">
                    <CapabilityTag label="Reasoning" type="reasoning" />
                  </View>
                )}
              </View>
              <Text className="ml-2 text-xs text-text-hint">
                {formatDate(item.updatedAt)}
              </Text>
            </View>
            <Text className="mt-0.5 text-sm text-text-muted" numberOfLines={1}>
              {identity ? `${identity.name}: ` : ""}
              {item.lastMessage ?? "Start a conversation"}
            </Text>
          </View>
        </Pressable>
      );
    },
    [getModelById, getIdentityById, router, handleDelete],
  );

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pb-2 pt-1">
        <View className="flex-row items-center rounded-xl bg-bg-secondary px-3 py-2">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            className="ml-2 flex-1 text-sm text-text-main"
            placeholder="Search chats..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View className="flex-row px-4 pb-2">
        {(["all", "single", "group"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            className={`mr-2 rounded-full px-3.5 py-1.5 ${
              filter === f ? "bg-primary" : "bg-bg-secondary"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                filter === f ? "text-white" : "text-text-muted"
              }`}
            >
              {f === "all" ? "All" : f === "single" ? "Direct" : "Groups"}
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          description="Go to Experts tab to start chatting with a model"
        />
      ) : (
        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
