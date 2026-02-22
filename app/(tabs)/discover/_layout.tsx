import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../src/hooks/useThemeColors";

export default function DiscoverLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.textPrimary },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("personas.title"),
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: colors.bg },
          headerLargeTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen name="identity-edit" options={{ title: t("personas.editIdentity"), presentation: "modal" }} />
      <Stack.Screen name="tool-edit" options={{ title: t("personas.editTool"), presentation: "modal" }} />
    </Stack>
  );
}
