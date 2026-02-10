import { useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useIdentityStore } from "../../../src/stores/identity-store";
import type { Identity, McpTool } from "../../../src/types";

type Tab = "identities" | "tools";

export default function DiscoverScreen() {
  const router = useRouter();
  const identities = useIdentityStore((s) => s.identities);
  const mcpTools = useIdentityStore((s) => s.mcpTools);
  const removeIdentity = useIdentityStore((s) => s.removeIdentity);
  const removeMcpTool = useIdentityStore((s) => s.removeMcpTool);
  const [activeTab, setActiveTab] = useState<Tab>("identities");

  const handleDeleteIdentity = (id: string) => {
    Alert.alert("Delete Identity", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeIdentity(id) },
    ]);
  };

  const handleDeleteTool = (id: string) => {
    Alert.alert("Delete Tool", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeMcpTool(id) },
    ]);
  };

  return (
    <View className="flex-1 bg-bg-secondary">
      <View className="flex-row bg-white px-4 pb-3">
        {(["identities", "tools"] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-3 rounded-full px-4 py-2 ${
              activeTab === tab ? "bg-primary" : "bg-bg-secondary"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab ? "text-white" : "text-text-muted"
              }`}
            >
              {tab === "identities" ? "Identity Cards" : "MCP Tools"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 px-4 pt-3">
        {activeTab === "identities" ? (
          <>
            {identities.map((identity) => (
              <IdentityCard
                key={identity.id}
                identity={identity}
                onEdit={() =>
                  router.push({
                    pathname: "/(tabs)/discover/identity-edit",
                    params: { id: identity.id },
                  })
                }
                onDelete={() => handleDeleteIdentity(identity.id)}
              />
            ))}
            <Pressable
              onPress={() => router.push("/(tabs)/discover/identity-edit")}
              className="mb-4 items-center rounded-xl border border-dashed border-border-light bg-white py-6"
            >
              <Ionicons name="add-circle-outline" size={28} color="#2b2bee" />
              <Text className="mt-1 text-sm font-medium text-primary">
                Create Identity Card
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {mcpTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onEdit={() =>
                  router.push({
                    pathname: "/(tabs)/discover/tool-edit",
                    params: { id: tool.id },
                  })
                }
                onDelete={() => handleDeleteTool(tool.id)}
              />
            ))}
            <Pressable
              onPress={() => router.push("/(tabs)/discover/tool-edit")}
              className="mb-4 items-center rounded-xl border border-dashed border-border-light bg-white py-6"
            >
              <Ionicons name="add-circle-outline" size={28} color="#2b2bee" />
              <Text className="mt-1 text-sm font-medium text-primary">
                Add MCP Tool
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function IdentityCard({
  identity,
  onEdit,
  onDelete,
}: {
  identity: Identity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onEdit} onLongPress={onDelete} className="mb-3 rounded-xl bg-white p-4">
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
          <Ionicons name="sparkles" size={20} color="#2b2bee" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-text-main">{identity.name}</Text>
          <Text className="text-xs text-text-muted">
            Temp: {identity.params.temperature} · MCP: {identity.mcpToolIds.length} tools
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>
      <Text className="mt-2 text-sm text-text-muted" numberOfLines={2}>
        {identity.systemPrompt}
      </Text>
    </Pressable>
  );
}

function ToolCard({
  tool,
  onEdit,
  onDelete,
}: {
  tool: McpTool;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onEdit} onLongPress={onDelete} className="mb-3 rounded-xl bg-white p-4">
      <View className="flex-row items-center">
        <View
          className={`h-10 w-10 items-center justify-center rounded-lg ${
            tool.type === "local" ? "bg-emerald-50" : "bg-blue-50"
          }`}
        >
          <Ionicons
            name={tool.type === "local" ? "phone-portrait-outline" : "cloud-outline"}
            size={20}
            color={tool.type === "local" ? "#059669" : "#2563eb"}
          />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-text-main">{tool.name}</Text>
          <Text className="text-xs text-text-muted">
            {tool.type} · {tool.scope} · {tool.enabled ? "Enabled" : "Disabled"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>
      <Text className="mt-2 text-sm text-text-muted" numberOfLines={1}>
        {tool.description}
      </Text>
    </Pressable>
  );
}
