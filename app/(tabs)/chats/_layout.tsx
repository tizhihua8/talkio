import { Stack } from "expo-router";

export default function ChatsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Messages", headerLargeTitle: true }} />
      <Stack.Screen
        name="[id]"
        options={{ headerShown: true, headerBackTitle: "Chats" }}
      />
    </Stack>
  );
}
