import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../src/hooks/useThemeColors";

export default function SettingsLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSecondary },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.textPrimary },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t("settings.title"),
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: colors.bgSecondary },
          headerLargeTitleStyle: { color: colors.textPrimary },
        }}
      />
      <Stack.Screen name="providers" options={{ title: t("layout.providers") }} />
      <Stack.Screen name="provider-edit" options={{ title: t("layout.addProvider"), presentation: "modal" }} />
      <Stack.Screen name="privacy" options={{ title: t("layout.privacy") }} />
      <Stack.Screen name="web-config" options={{ title: t("layout.webConfig") }} />
      <Stack.Screen name="stt" options={{ title: t("settings.sttProvider") }} />
    </Stack>
  );
}
