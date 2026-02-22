import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, TextInput, Alert, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import { Swipeable } from "react-native-gesture-handler";
import { FlashList } from "@shopify/flash-list";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatStore } from "../../../src/stores/chat-store";
import { useProviderStore } from "../../../src/stores/provider-store";
import { useIdentityStore } from "../../../src/stores/identity-store";
import { useThemeColors } from "../../../src/hooks/useThemeColors";
import { useConversations } from "../../../src/hooks/useConversations";
import { ModelAvatar } from "../../../src/components/common/ModelAvatar";
import { EmptyState } from "../../../src/components/common/EmptyState";
import type { Conversation } from "../../../src/types";

type FilterType = "all" | "single" | "group";

export default function ChatsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const conversations = useConversations();
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const colors = useThemeColors();

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setShowSearch((v) => !v)}
            className="p-2 active:opacity-60"
          >
            <Ionicons name="search" size={22} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(tabs)/experts")}
            className="p-2 active:opacity-60"
          >
            <Ionicons name="create-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, router, colors]);

  const filtered = useMemo(() => conversations.filter((c) => {
    if (filter === "single" && c.type !== "single") return false;
    if (filter === "group" && c.type !== "group") return false;
    if (searchQuery) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }), [conversations, filter, searchQuery]);

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(t("chats.deleteChat"), t("common.areYouSure"), [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.delete"), style: "destructive", onPress: () => deleteConversation(id) },
      ]);
    },
    [deleteConversation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => (
      <ConversationItem item={item} onDelete={handleDelete} />
    ),
    [handleDelete],
  );

  return (
    <View className="flex-1 bg-bg-light">
      {showSearch && (
        <View className="px-4 pb-2">
          <View className="flex-row items-center rounded-xl bg-ios-gray px-3 py-2">
            <Ionicons name="search" size={18} color={colors.searchIcon} />
            <TextInput
              className="ml-2 flex-1 text-[15px] text-text-main"
              placeholder={t("chats.searchChats")}
              placeholderTextColor={colors.textHint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={10} className="active:opacity-60">
                <Ionicons name="close-circle" size={18} color={colors.searchIcon} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View className="px-4 pb-3">
        <View className="flex-row gap-2">
          {(["all", "single", "group"] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 active:opacity-70 ${
                filter === f ? "bg-primary" : "bg-divider"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filter === f ? "text-white" : "text-text-main"
                }`}
              >
                {f === "all" ? t("chats.filterAll") : f === "single" ? t("chats.filterSingle") : t("chats.filterGroups")}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <OnboardingOrEmpty />
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

// ── Onboarding / Empty state ──
function OnboardingOrEmpty() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const providers = useProviderStore((s) => s.providers);
  const enabledProviders = providers.filter((p) => p.status === "connected");
  const hasProviders = enabledProviders.length > 0;

  if (!hasProviders) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name="sparkles" size={40} color={colors.accent} />
        </View>
        <Text className="text-center text-xl font-bold text-text-main">
          {t("onboarding.welcome", { defaultValue: "Welcome to Talkio" })}
        </Text>
        <Text className="mt-3 text-center text-sm leading-5 text-text-muted">
          {t("onboarding.setupHint", { defaultValue: "To get started, configure an AI provider in Settings. You can add OpenAI, Anthropic, Gemini, or any compatible API." })}
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          className="mt-6 rounded-xl bg-primary px-8 py-3 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">
            {t("onboarding.goToSettings", { defaultValue: "Set Up Provider" })}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
      <Text className="mt-4 text-center text-lg font-semibold text-text-main">
        {t("chats.noConversations")}
      </Text>
      <Text className="mt-2 text-center text-sm text-text-muted">
        {t("chats.goToModels")}
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/experts")}
        className="mt-5 rounded-xl bg-primary px-6 py-2.5 active:opacity-80"
      >
        <Text className="text-sm font-semibold text-white">
          {t("chats.startChat", { defaultValue: "Start a Chat" })}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Memoized conversation list item ──
const ConversationItem = React.memo(function ConversationItem({
  item,
  onDelete,
}: {
  item: Conversation;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const getModelById = useProviderStore((s) => s.getModelById);
  const getProviderById = useProviderStore((s) => s.getProviderById);
  const getIdentityById = useIdentityStore((s) => s.getIdentityById);

  const firstModel = getModelById(item.participants[0]?.modelId);
  const modelName = firstModel?.displayName ?? t("common.unknown");
  const provider = firstModel ? getProviderById(firstModel.providerId) : null;
  const isConnected = provider?.status === "connected";
  const identity = item.participants[0]?.identityId
    ? getIdentityById(item.participants[0].identityId)
    : null;

  return (
    <Swipeable
      renderRightActions={(_progress, dragX) => {
        const scale = dragX.interpolate({
          inputRange: [-80, 0],
          outputRange: [1, 0.5],
          extrapolate: "clamp",
        });
        return (
          <Pressable
            onPress={() => onDelete(item.id)}
            style={{
              width: 80,
              backgroundColor: colors.danger,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
              <Ionicons name="trash-outline" size={22} color="#fff" />
              <Text className="mt-0.5 text-[10px] font-medium text-white">{t("common.delete")}</Text>
            </Animated.View>
          </Pressable>
        );
      }}
      overshootRight={false}
      friction={2}
    >
      <Pressable
        onPress={() => router.push(`/chat/${item.id}`)}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        className="flex-row items-center gap-4 border-b border-divider bg-bg-light px-4 py-3 active:bg-bg-hover"
      >
        <View className="relative">
          <View className="h-12 w-12 overflow-hidden rounded-full">
            <ModelAvatar name={modelName} size="md" />
          </View>
          {firstModel && (
            <View className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg-light ${isConnected ? "bg-accent-green" : "bg-border-light"}`} />
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="flex-1 text-[16px] font-semibold text-text-main" numberOfLines={1}>
              {item.type === "group" ? item.title : modelName}
            </Text>
            <Text className="ml-2 text-xs text-text-hint">
              {formatDate(item.updatedAt, t("common.yesterday"))}
            </Text>
          </View>
          <Text className="text-sm text-text-hint" numberOfLines={1}>
            {identity ? `${identity.name}: ` : ""}
            {item.lastMessage ?? t("chats.startConversation")}
          </Text>
        </View>
      </Pressable>
    </Swipeable>
  );
});

function formatDate(iso: string, yesterdayLabel: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return yesterdayLabel;
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
