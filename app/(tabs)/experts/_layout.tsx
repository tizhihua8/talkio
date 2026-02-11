import { Stack } from "expo-router";

export default function ExpertsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ headerBackTitle: "Experts" }} />
    </Stack>
  );
}
