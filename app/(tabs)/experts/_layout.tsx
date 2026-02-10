import { Stack } from "expo-router";

export default function ExpertsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Experts", headerLargeTitle: true }} />
      <Stack.Screen name="[id]" options={{ headerBackTitle: "Experts" }} />
    </Stack>
  );
}
