import { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, Platform, Alert, ActionSheetIOS } from "react-native";
import * as Clipboard from "expo-clipboard";
import { KeyboardAvoidingView, KeyboardController } from "react-native-keyboard-controller";
import { useTranslation } from "react-i18next";
import { LegendList } from "@legendapp/list";
import type { LegendListRef } from "@legendapp/list";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useChatStore } from "../../src/stores/chat-store";
import { useProviderStore } from "../../src/stores/provider-store";
import { useIdentityStore } from "../../src/stores/identity-store";
import { MessageBubble } from "../../src/components/chat/MessageBubble";
import { ChatInput } from "../../src/components/chat/ChatInput";
import { IdentitySlider } from "../../src/components/chat/IdentitySlider";
import type { Message } from "../../src/types";

KeyboardController.preload();

export default function ChatDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const listRef = useRef<LegendListRef>(null);

  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const setCurrentConversation = useChatStore((s) => s.setCurrentConversation);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const updateParticipantIdentity = useChatStore((s) => s.updateParticipantIdentity);
  const getModelById = useProviderStore((s) => s.getModelById);
  const getIdentityById = useIdentityStore((s) => s.getIdentityById);

  const conv = conversations.find((c) => c.id === id);
  const isGroup = conv?.type === "group";
  const [showIdentitySlider, setShowIdentitySlider] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [editingParticipantModelId, setEditingParticipantModelId] = useState<string | null>(null);

  // For single chat, use the first participant
  const currentParticipant = conv?.participants[0];
  const model = currentParticipant ? getModelById(currentParticipant.modelId) : null;
  const activeIdentity = currentParticipant?.identityId
    ? getIdentityById(currentParticipant.identityId)
    : null;

  useEffect(() => {
    if (id) setCurrentConversation(id);
    return () => setCurrentConversation(null);
  }, [id]);

  useEffect(() => {
    const title = isGroup
      ? conv?.title ?? t("chat.group")
      : model?.displayName ?? t("chat.chatTitle");

    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          onPress={handleHeaderPress}
          className="items-center"
        >
          <Text className="text-sm font-bold tracking-tight text-text-main">{title}</Text>
          {isGroup ? (
            <View className="mt-0.5 flex-row items-center gap-1">
              <Ionicons name="people-outline" size={12} color="#007AFF" />
              <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {t("chat.modelCount", { count: conv?.participants.length ?? 0 })}
              </Text>
              <Ionicons name={showParticipants ? "chevron-up" : "chevron-down"} size={12} color="#007AFF" />
            </View>
          ) : (
            <View className="mt-0.5 flex-row items-center gap-1">
              <Ionicons name="person-circle-outline" size={12} color="#007AFF" />
              <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {activeIdentity ? activeIdentity.name : t("chat.mountIdentity")}
              </Text>
              <Ionicons name="chevron-down" size={12} color="#007AFF" />
            </View>
          )}
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={clearHistory} className="px-2">
          <Ionicons name="create-outline" size={20} color="#007AFF" />
        </Pressable>
      ),
    });
  }, [conv, model, activeIdentity, isGroup, showParticipants]);

  const lastMsg = messages[messages.length - 1];
  const lastMsgContent = lastMsg?.content;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 9999999, animated: true });
      }, 150);
    }
  }, [messages.length, lastMsgContent]);

  const handleSend = useCallback(
    (text: string, mentionedModelIds?: string[], images?: string[]) => {
      sendMessage(text, mentionedModelIds, images);
    },
    [sendMessage],
  );

  const handleIdentitySelect = useCallback(
    (identityId: string | null) => {
      const targetModelId = editingParticipantModelId ?? currentParticipant?.modelId;
      if (id && targetModelId) {
        updateParticipantIdentity(id, targetModelId, identityId);
      }
      setShowIdentitySlider(false);
      setEditingParticipantModelId(null);
    },
    [id, editingParticipantModelId, currentParticipant, updateParticipantIdentity],
  );

  const handleHeaderPress = useCallback(() => {
    if (isGroup) {
      setShowParticipants((v) => !v);
      setShowIdentitySlider(false);
    } else {
      setShowIdentitySlider((v) => !v);
    }
  }, [isGroup]);

  const handleEditParticipantIdentity = useCallback((modelId: string) => {
    setEditingParticipantModelId(modelId);
    setShowIdentitySlider(true);
  }, []);

  const copyMessage = useCallback(async (content: string) => {
    await Clipboard.setStringAsync(content);
  }, []);

  const deleteMessage = useChatStore((s) => s.deleteMessageById);

  const handleDeleteMessage = useCallback((messageId: string) => {
    Alert.alert(t("common.delete"), t("chat.deleteMessageConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => deleteMessage(messageId) },
    ]);
  }, [deleteMessage]);

  const handleLongPress = useCallback((message: Message) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t("common.cancel"), t("common.copy"), t("common.delete")],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 1) copyMessage(message.content);
          if (index === 2) handleDeleteMessage(message.id);
        },
      );
    } else {
      Alert.alert(t("chat.messageOptions"), undefined, [
        { text: t("common.copy"), onPress: () => copyMessage(message.content) },
        { text: t("common.delete"), style: "destructive", onPress: () => handleDeleteMessage(message.id) },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    }
  }, [copyMessage, handleDeleteMessage]);

  const clearHistory = useCallback(() => {
    if (!id) return;
    Alert.alert(t("chat.clearHistory"), t("chat.clearHistoryConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          for (const msg of messages) {
            await useChatStore.getState().deleteMessageById(msg.id);
          }
        },
      },
    ]);
  }, [id, messages]);

  const lastAssistantId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i].id;
    }
    return null;
  })();

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        message={item}
        isGroup={isGroup}
        isLastAssistant={item.id === lastAssistantId}
        onLongPress={handleLongPress}
      />
    ),
    [isGroup, handleLongPress, lastAssistantId],
  );

  if (!conv) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-text-muted">{t("chat.conversationNotFound")}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-chat">
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={50}
    >
      {/* Group participant panel */}
      {isGroup && showParticipants && conv && (
        <View className="border-b border-slate-100 bg-white px-4 py-2">
          {conv.participants.map((p) => {
            const pModel = getModelById(p.modelId);
            const pIdentity = p.identityId ? getIdentityById(p.identityId) : null;
            return (
              <View key={p.modelId} className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center flex-1">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10 mr-3">
                    <Text className="text-xs font-bold text-primary">
                      {(pModel?.displayName ?? "?").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-slate-900" numberOfLines={1}>
                      {pModel?.displayName ?? p.modelId}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => handleEditParticipantIdentity(p.modelId)}
                  className="flex-row items-center rounded-full bg-slate-100 px-3 py-1.5"
                >
                  <Ionicons name="person-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
                  <Text className="text-[12px] text-slate-600">
                    {pIdentity ? pIdentity.name : t("chat.noIdentity")}
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color="#94a3b8" style={{ marginLeft: 2 }} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {/* Identity slider */}
      <IdentitySlider
        visible={showIdentitySlider}
        activeIdentityId={
          editingParticipantModelId
            ? conv?.participants.find((p) => p.modelId === editingParticipantModelId)?.identityId ?? null
            : currentParticipant?.identityId ?? null
        }
        onSelect={handleIdentitySelect}
      />

      <LegendList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
        recycleItems
        maintainScrollAtEnd
        maintainScrollAtEndThreshold={0.1}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <ChatInput
        onSend={handleSend}
        isGenerating={isGenerating}
        isGroup={isGroup}
        participants={conv.participants}
      />
    </KeyboardAvoidingView>
    </View>
  );
}
