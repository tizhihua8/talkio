import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function DiscoverLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("personas.title"),
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: "#ffffff" },
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen name="identity-edit" options={{ title: t("personas.editIdentity"), presentation: "modal" }} />
      <Stack.Screen name="tool-edit" options={{ title: t("personas.editTool"), presentation: "modal" }} />
    </Stack>
  );
}
