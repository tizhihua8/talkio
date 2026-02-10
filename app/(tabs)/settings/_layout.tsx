import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Settings", headerLargeTitle: true }} />
      <Stack.Screen name="providers" options={{ title: "Providers" }} />
      <Stack.Screen name="provider-edit" options={{ title: "Add Provider", presentation: "modal" }} />
      <Stack.Screen name="sync" options={{ title: "Data Sync" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy" }} />
    </Stack>
  );
}
