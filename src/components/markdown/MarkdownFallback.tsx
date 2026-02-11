import React from "react";
import Markdown from "react-native-markdown-display";

const mdStyles = {
  body: { fontSize: 15, lineHeight: 22, color: "#1f2937" },
  heading1: { fontSize: 22, fontWeight: "700" as const, color: "#111827", marginTop: 8, marginBottom: 4 },
  heading2: { fontSize: 19, fontWeight: "700" as const, color: "#111827", marginTop: 6, marginBottom: 4 },
  heading3: { fontSize: 17, fontWeight: "600" as const, color: "#111827", marginTop: 4, marginBottom: 2 },
  paragraph: { marginTop: 0, marginBottom: 6 },
  strong: { fontWeight: "700" as const },
  em: { fontStyle: "italic" as const },
  link: { color: "#2563eb" },
  blockquote: { backgroundColor: "#f9fafb", borderLeftWidth: 3, borderLeftColor: "#d1d5db", paddingLeft: 10, paddingVertical: 4, marginVertical: 4 },
  code_inline: { backgroundColor: "#f3f4f6", paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, fontSize: 13, fontFamily: "monospace", color: "#e11d48" },
  code_block: { backgroundColor: "#1f2937", padding: 12, borderRadius: 8, fontSize: 13, fontFamily: "monospace", color: "#e5e7eb", marginVertical: 4 },
  fence: { backgroundColor: "#1f2937", padding: 12, borderRadius: 8, fontSize: 13, fontFamily: "monospace", color: "#e5e7eb", marginVertical: 4 },
  bullet_list: { marginVertical: 2 },
  ordered_list: { marginVertical: 2 },
  list_item: { marginVertical: 2 },
  hr: { backgroundColor: "#e5e7eb", height: 1, marginVertical: 8 },
};

interface MarkdownFallbackProps {
  content: string;
}

export function MarkdownFallback({ content }: MarkdownFallbackProps) {
  return (
    <Markdown style={mdStyles}>
      {content}
    </Markdown>
  );
}
