import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Modal, TextInput, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useProviderStore } from "../../stores/provider-store";
import { useThemeColors } from "../../hooks/useThemeColors";
import { ModelAvatar } from "../common/ModelAvatar";

interface ModelPickerModalProps {
  visible: boolean;
  excludeModelIds: string[];
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export const ModelPickerModal = React.memo(function ModelPickerModal({
  visible,
  excludeModelIds,
  onSelect,
  onClose,
}: ModelPickerModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const models = useProviderStore((s) => s.models);
  const getProviderById = useProviderStore((s) => s.getProviderById);
  const [search, setSearch] = useState("");

  const available = useMemo(() => {
    const excludeSet = new Set(excludeModelIds);
    return models
      .filter((m) => m.enabled && !excludeSet.has(m.id))
      .filter((m) =>
        search
          ? m.displayName.toLowerCase().includes(search.toLowerCase()) ||
            m.modelId.toLowerCase().includes(search.toLowerCase())
          : true,
      );
  }, [models, excludeModelIds, search]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between border-b border-border-light px-4 py-3">
          <Pressable onPress={onClose} hitSlop={8} className="active:opacity-60">
            <Text className="text-base text-primary">{t("common.cancel")}</Text>
          </Pressable>
          <Text className="text-base font-semibold text-text-main">{t("chat.addMember")}</Text>
          <View style={{ width: 60 }} />
        </View>

        <View className="px-4 py-2">
          <View className="flex-row items-center rounded-xl bg-bg-input px-3 py-2">
            <Ionicons name="search" size={18} color={colors.searchIcon} />
            <TextInput
              className="ml-2 flex-1 text-[15px] text-text-main"
              placeholder={t("common.search")}
              placeholderTextColor={colors.textHint}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} className="active:opacity-60">
                <Ionicons name="close-circle" size={18} color={colors.searchIcon} />
              </Pressable>
            )}
          </View>
        </View>

        {available.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-sm text-text-hint">{t("chat.noAvailableModels")}</Text>
          </View>
        ) : (
          <FlatList
            data={available}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const provider = getProviderById(item.providerId);
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  className="flex-row items-center px-5 py-3 active:bg-bg-hover"
                >
                  <View className="h-10 w-10 overflow-hidden rounded-lg">
                    <ModelAvatar name={item.displayName} size="sm" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[16px] font-medium text-text-main" numberOfLines={1}>
                      {item.displayName}
                    </Text>
                    <Text className="text-[13px] text-text-hint" numberOfLines={1}>
                      {provider?.name ?? item.providerId}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
});
