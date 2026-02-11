import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ExpertsLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("models.title"),
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: "#ffffff" },
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
