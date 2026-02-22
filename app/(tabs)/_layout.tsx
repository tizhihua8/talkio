import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../../src/hooks/useThemeColors";

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "500" },
        tabBarStyle: {
          borderTopColor: colors.tabBarBorder,
          backgroundColor: colors.tabBarBg,
        },
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: "600", fontSize: 18, color: colors.textPrimary },
        freezeOnBlur: true,
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: t("tabs.chats"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="experts"
        options={{
          title: t("tabs.models"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: t("tabs.personas"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
