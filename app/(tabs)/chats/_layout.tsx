import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ChatsLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: t("tabs.chats"),
          headerLargeTitle: true,
          headerLargeStyle: { backgroundColor: "#ffffff" },
          headerStyle: { backgroundColor: "#ffffff" },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{ headerShown: true, headerBackTitle: t("layout.backChats") }}
      />
    </Stack>
  );
}
