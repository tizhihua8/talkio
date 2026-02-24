import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import BottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import type { BottomSheetMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useIdentityStore } from "../../stores/identity-store";
import { useThemeColors } from "../../hooks/useThemeColors";

interface IdentitySliderProps {
  visible: boolean;
  activeIdentityId: string | null;
  onSelect: (identityId: string | null) => void;
  onClose: () => void;
  label?: string;
}

export const IdentitySlider = React.memo(function IdentitySlider({
  visible,
  activeIdentityId,
  onSelect,
  onClose,
  label,
}: IdentitySliderProps) {
  const { t } = useTranslation();
  const identities = useIdentityStore((s) => s.identities);
  const colors = useThemeColors();
  const sheetRef = useRef<BottomSheetMethods>(null);

  const groupedIdentities = useMemo(() => {
    const map = new Map<string, typeof identities[0][]>();
    identities.forEach((id) => {
      const cat = id.category?.trim() || t("identityEdit.uncategorized", { defaultValue: "未分组 / Uncategorized" });
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(id);
    });
    const groups: { category: string; data: typeof identities[0][] }[] = [];
    Array.from(map.keys()).sort().forEach((k) => {
      groups.push({ category: k, data: map.get(k)! });
    });
    return groups;
  }, [identities, t]);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSelect = useCallback((identityId: string | null) => {
    onSelect(identityId);
  }, [onSelect]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.3} />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["55%"]}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={handleClose}
      handleIndicatorStyle={{ backgroundColor: colors.chevron, width: 36 }}
      backgroundStyle={{ backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
    >
      <BottomSheetView style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-border-light px-4 pb-3">
          <View className="flex-1">
            <Text className="text-base font-semibold text-text-main">
              {label ?? t("personas.editIdentity")}
            </Text>
          </View>
          <Pressable onPress={handleClose} hitSlop={8} className="active:opacity-60">
            <Ionicons name="close" size={20} color={colors.searchIcon} />
          </Pressable>
        </View>

        {/* Identity list */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Remove current role */}
          {activeIdentityId && (
            <Pressable
              onPress={() => handleSelect(null)}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 active:opacity-80"
            >
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-semibold text-red-500">{t("personas.removeRole")}</Text>
                <Text className="text-[12px] text-red-400">{t("personas.removeRoleHint")}</Text>
              </View>
            </Pressable>
          )}

          {groupedIdentities.map((group) => (
            <View key={group.category} className="mb-2">
              <Text className="mb-2 px-1 text-[12px] font-semibold tracking-wider text-text-hint uppercase">
                {group.category}
              </Text>
              {group.data.map((identity) => {
                const isActive = identity.id === activeIdentityId;
                return (
                  <Pressable
                    key={identity.id}
                    onPress={() => handleSelect(identity.id)}
                    className={`mb-2 flex-row items-center gap-3 rounded-xl border px-4 py-3 active:opacity-80 ${isActive ? "border-primary/30 bg-primary/5" : "border-border-light bg-bg-card"
                      }`}
                  >
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-lg ${isActive ? "bg-primary" : "bg-bg-input"
                        }`}
                    >
                      <Ionicons
                        name={getIconName(identity.icon)}
                        size={20}
                        color={isActive ? colors.textInverse : colors.sectionHeader}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-[14px] font-semibold ${isActive ? "text-primary" : "text-text-main"}`}
                        numberOfLines={1}
                      >
                        {identity.name}
                      </Text>
                      <Text className="text-[12px] leading-tight text-text-hint" numberOfLines={2}>
                        {identity.systemPrompt.slice(0, 80)}
                      </Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  );
});

function getIconName(icon: string): keyof typeof Ionicons.glyphMap {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    code: "code-slash-outline",
    translate: "language-outline",
    architecture: "git-network-outline",
    security: "shield-checkmark-outline",
    finance: "cash-outline",
    writing: "create-outline",
    research: "search-outline",
    marketing: "megaphone-outline",
    design: "color-palette-outline",
    general: "sparkles-outline",
  };
  return iconMap[icon] ?? "sparkles-outline";
}
