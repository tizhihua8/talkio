import React from "react";
import { View, Text, Pressable, useColorScheme } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

let CodeHighlighter: any = null;
let atomOneDark: any = {};
let atomOneLight: any = {};

try {
  CodeHighlighter = require("react-native-code-highlighter").default;
  const styles = require("react-syntax-highlighter/dist/esm/styles/hljs");
  atomOneDark = styles.atomOneDark;
  atomOneLight = styles.atomOneLight;
} catch {
  // fallback below
}

interface MarkdownCodeBlockProps {
  content: string;
  language?: string;
}

export function MarkdownCodeBlock({ content, language = "text" }: MarkdownCodeBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const lang = language || "text";

  const handleCopy = () => {
    Clipboard.setStringAsync(content);
  };

  return (
    <View className="mt-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
      <View className="flex-row items-center justify-between px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
        <Text className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {lang.toUpperCase()}
        </Text>
        <Pressable onPress={handleCopy} className="flex-row items-center gap-1 px-2 py-1 rounded active:bg-gray-200 dark:active:bg-gray-700">
          <Ionicons name="copy-outline" size={14} color={isDark ? "#9ca3af" : "#6b7280"} />
          <Text className="text-xs text-gray-500 dark:text-gray-400">Copy</Text>
        </Pressable>
      </View>
      <View className="px-3 py-2">
        {CodeHighlighter ? (
          <CodeHighlighter
            customStyle={{ backgroundColor: "transparent" }}
            scrollViewProps={{ contentContainerStyle: { backgroundColor: "transparent" } }}
            textStyle={{ fontSize: 13, fontFamily: "monospace" }}
            hljsStyle={isDark ? atomOneDark : atomOneLight}
            language={lang}
            horizontal={false}
          >
            {content}
          </CodeHighlighter>
        ) : (
          <Text className="text-[13px] font-mono text-gray-200 dark:text-gray-300">
            {content}
          </Text>
        )}
      </View>
    </View>
  );
}
