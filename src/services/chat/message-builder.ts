import type {
  Conversation,
  Message,
  ChatApiMessage,
  Identity,
} from "../../types";
import {
  updateConversation as dbUpdateConversation,
  getConversation as dbGetConversation,
} from "../../storage/database";
import { ApiClient } from "../api-client";
import { fileToDataUri } from "../../utils/image-storage";
import { logger } from "../logger";

const log = logger.withContext("MessageBuilder");

export function resolveTargetModels(
  conv: Conversation,
  mentionedModelIds?: string[],
): string[] {
  if (conv.type === "single") {
    if (!conv.participants[0]) return [];
    return [conv.participants[0].modelId];
  }
  if (mentionedModelIds && mentionedModelIds.length > 0) {
    return mentionedModelIds;
  }
  return conv.participants.map((p) => p.modelId);
}

export async function buildApiMessages(
  messages: Message[],
  targetModelId: string,
  identity: Identity | undefined,
): Promise<ChatApiMessage[]> {
  const apiMessages: ChatApiMessage[] = [];

  if (identity) {
    apiMessages.push({ role: "system", content: identity.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === "system") continue;

    const hasImages = msg.images && msg.images.length > 0;

    let content: ChatApiMessage["content"];
    if (hasImages) {
      // Convert file:// URIs to data URIs for the API
      const imageParts = await Promise.all(
        msg.images.map(async (uri) => ({
          type: "image_url" as const,
          image_url: { url: await fileToDataUri(uri) },
        })),
      );
      content = [
        ...(msg.content ? [{ type: "text" as const, text: msg.content }] : []),
        ...imageParts,
      ];
    } else {
      content = msg.content;
    }

    const apiMsg: ChatApiMessage = { role: msg.role, content };

    if (msg.role === "assistant" && msg.senderModelId !== targetModelId && msg.senderName) {
      // Convert other models' responses to "user" role to avoid "must end with user message" errors
      apiMsg.role = "user";
      const prefix = `[${msg.senderName} said]: `;
      if (typeof apiMsg.content === "string") {
        apiMsg.content = prefix + apiMsg.content;
      }
    }

    apiMessages.push(apiMsg);
  }

  return apiMessages;
}

export async function autoGenerateTitle(
  conversationId: string,
  client: ApiClient,
  model: { modelId: string; displayName: string },
  previousMessages: Message[],
  assistantContent: string,
): Promise<void> {
  // Only generate title if this is the first assistant message in the conversation
  const assistantCount = previousMessages.filter((m) => m.role === "assistant").length;
  if (assistantCount > 0) return; // already has prior responses

  const conv = await dbGetConversation(conversationId);
  if (!conv) return;

  // Skip if title was manually set (not the default "Model Group" or model name pattern)
  const isDefaultTitle = conv.title.startsWith("Model Group") || conv.title === model.displayName;
  if (!isDefaultTitle) return;

  const userMsg = previousMessages.find((m) => m.role === "user");
  if (!userMsg) return;

  try {
    const resp = await client.chat({
      model: model.modelId,
      messages: [
        {
          role: "system",
          content: "Generate a very short title (3-8 words) for this conversation. Return ONLY the title text, no quotes, no punctuation at the end.",
        },
        {
          role: "user",
          content: `User: ${userMsg.content.slice(0, 300)}\n\nAssistant: ${assistantContent.slice(0, 300)}\n\nGenerate a short title for this conversation.`,
        },
      ],
      stream: false,
      temperature: 0.3,
      max_tokens: 30,
    });

    const title = (resp.choices?.[0]?.message?.content ?? "").trim().replace(/^["']|["']$/g, "");
    if (!title || title.length > 60) return;

    await dbUpdateConversation(conversationId, { title });
  } catch {
    // Non-critical, silently fail
  }
}
