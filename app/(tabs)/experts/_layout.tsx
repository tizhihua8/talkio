import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../src/hooks/useThemeColors";

export default function ExpertsLayout() {
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
          title: t("models.title"),
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: colors.bg },
          headerLargeTitleStyle: { color: colors.textPrimary },
        }}
      />
    </Stack>
  );
}
