import React, { memo, useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";

let CodeHighlighter: any = null;
let atomOneLight: any = {};
let highlighterLoaded = false;

// Lazy-load the heavy syntax highlighter on first use
const loadHighlighter = (() => {
  let promise: Promise<void> | null = null;
  return () => {
    if (highlighterLoaded) return Promise.resolve();
    if (!promise) {
      promise = new Promise<void>((resolve) => {
        try {
          CodeHighlighter = require("react-native-code-highlighter").default;
          const styles = require("react-syntax-highlighter/dist/esm/styles/hljs");
          atomOneLight = styles.atomOneLight;
          highlighterLoaded = true;
        } catch {
          // not available
        }
        resolve();
      });
    }
    return promise;
  };
})();

interface MarkdownCodeBlockProps {
  content: string;
  language?: string;
}

export const MarkdownCodeBlock = memo(function MarkdownCodeBlock({ content, language = "text" }: MarkdownCodeBlockProps) {
  const lang = language || "text";
  const [ready, setReady] = useState(highlighterLoaded);

  useEffect(() => {
    if (!ready) {
      loadHighlighter().then(() => setReady(true));
    }
  }, [ready]);

  const handleCopy = () => {
    Clipboard.setStringAsync(content);
  };

  return (
    <View className="mt-1 rounded-xl border border-border-light bg-slate-50 overflow-hidden">
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-border-light bg-slate-100/50">
        <Text className="text-[10px] font-mono font-bold text-text-muted uppercase">
          {lang}
        </Text>
        <Pressable onPress={handleCopy} hitSlop={8} className="flex-row items-center gap-1 px-2 py-1.5 rounded active:bg-slate-200">
          <Ionicons name="copy-outline" size={12} color="#6b7280" />
        </Pressable>
      </View>
      <View className="px-3 py-2">
        {ready && CodeHighlighter ? (
          <CodeHighlighter
            customStyle={{ backgroundColor: "transparent" }}
            scrollViewProps={{ contentContainerStyle: { backgroundColor: "transparent" } }}
            textStyle={{ fontSize: 13, fontFamily: "monospace" }}
            hljsStyle={atomOneLight}
            language={lang}
            horizontal={false}
          >
            {content}
          </CodeHighlighter>
        ) : (
          <Text className="text-[13px] font-mono text-gray-800 dark:text-gray-300">
            {content}
          </Text>
        )}
      </View>
    </View>
  );
});
