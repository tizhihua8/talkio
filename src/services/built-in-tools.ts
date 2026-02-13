import { Platform } from "react-native";
import * as Battery from "expo-battery";
import * as Network from "expo-network";
import * as Clipboard from "expo-clipboard";
import { registerLocalTool, type McpExecutionResult } from "./mcp-client";
import type { McpTool } from "../types";

// ── Built-in tool definitions ──

export const BUILT_IN_TOOLS: Omit<McpTool, "id">[] = [
  {
    name: "Get Current Time",
    type: "local",
    scope: "global",
    description: "Returns current date, time, timezone, and day of week",
    endpoint: null,
    nativeModule: "get_current_time",
    permissions: [],
    enabled: true,
    builtIn: true,
    schema: {
      name: "get_current_time",
      description: "Get current date, time, timezone, and day of week",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    name: "Get Device Info",
    type: "local",
    scope: "global",
    description: "Returns device platform, OS version, model, and battery/network status",
    endpoint: null,
    nativeModule: "get_device_info",
    permissions: [],
    enabled: true,
    builtIn: true,
    schema: {
      name: "get_device_info",
      description: "Get device platform, OS version, model, battery level, and network status",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    name: "Read Clipboard",
    type: "local",
    scope: "global",
    description: "Read current text content from the device clipboard",
    endpoint: null,
    nativeModule: "read_clipboard",
    permissions: [],
    enabled: false,
    builtIn: true,
    schema: {
      name: "read_clipboard",
      description: "Read the current text content from the device clipboard",
      parameters: { type: "object", properties: {} },
    },
  },
];

// ── Handler implementations ──

async function handleGetCurrentTime(): Promise<McpExecutionResult> {
  const now = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    success: true,
    content: JSON.stringify({
      date: now.toLocaleDateString("en-CA"), // YYYY-MM-DD
      time: now.toLocaleTimeString("en-US", { hour12: false }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: `UTC${now.getTimezoneOffset() > 0 ? "-" : "+"}${Math.abs(now.getTimezoneOffset() / 60)}`,
      dayOfWeek: days[now.getDay()],
      timestamp: now.toISOString(),
    }),
  };
}

async function handleGetDeviceInfo(): Promise<McpExecutionResult> {
  let batteryLevel: number | null = null;
  let networkType = "unknown";

  try {
    batteryLevel = await Battery.getBatteryLevelAsync();
    batteryLevel = Math.round(batteryLevel * 100);
  } catch { /* not available */ }

  try {
    const state = await Network.getNetworkStateAsync();
    networkType = state.type ?? "unknown";
  } catch { /* not available */ }

  return {
    success: true,
    content: JSON.stringify({
      platform: Platform.OS,
      osVersion: Platform.Version,
      batteryLevel: batteryLevel !== null ? `${batteryLevel}%` : "unknown",
      networkType,
    }),
  };
}

async function handleReadClipboard(): Promise<McpExecutionResult> {
  try {
    const text = await Clipboard.getStringAsync();
    return {
      success: true,
      content: text || "(clipboard is empty)",
    };
  } catch (err) {
    return {
      success: false,
      content: "",
      error: err instanceof Error ? err.message : "Failed to read clipboard",
    };
  }
}

// ── Registration ──

const HANDLER_MAP: Record<string, () => Promise<McpExecutionResult>> = {
  get_current_time: handleGetCurrentTime,
  get_device_info: handleGetDeviceInfo,
  read_clipboard: handleReadClipboard,
};

export function registerBuiltInTools(toolIds: Map<string, string>): void {
  for (const [nativeModule, toolId] of toolIds.entries()) {
    const handler = HANDLER_MAP[nativeModule];
    if (handler) {
      registerLocalTool(toolId, () => handler());
    }
  }
}
