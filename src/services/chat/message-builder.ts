import type {
  Conversation,
  ConversationParticipant,
  Message,
  ChatApiMessage,
  Identity,
} from "../../types";
import { fileToDataUri } from "../../utils/image-storage";
import { useProviderStore } from "../../stores/provider-store";
import { useIdentityStore } from "../../stores/identity-store";
import { logger } from "../logger";

const log = logger.withContext("MessageBuilder");

export function resolveTargetParticipants(
  conv: Conversation,
  mentionedModelIds?: string[],
): ConversationParticipant[] {
  if (conv.type === "single") {
    if (!conv.participants[0]) return [];
    return [conv.participants[0]];
  }
  if (mentionedModelIds && mentionedModelIds.length > 0) {
    const mentionedSet = new Set(mentionedModelIds);
    return conv.participants.filter((p) => mentionedSet.has(p.modelId));
  }
  return conv.participants;
}

/**
 * Build API messages for a specific participant.
 *
 * Self/other distinction uses `participantId` — one simple comparison.
 * In group chats, a system prompt is injected describing the participants.
 */
export async function buildApiMessages(
  messages: Message[],
  identity: Identity | undefined,
  targetParticipantId: string | null,
  conv?: Conversation,
): Promise<ChatApiMessage[]> {
  const apiMessages: ChatApiMessage[] = [];
  const isGroup = conv?.type === "group";

  // Group chat: inject context so the AI knows who's in the conversation
  if (isGroup && conv) {
    const roster = buildGroupRoster(conv, targetParticipantId);
    const groupPrompt = identity?.systemPrompt
      ? `${identity.systemPrompt}\n\n${roster}`
      : roster;
    apiMessages.push({ role: "system", content: groupPrompt });
  } else if (identity) {
    apiMessages.push({ role: "system", content: identity.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === "system") continue;

    const content = await resolveContent(msg);
    const apiMsg: ChatApiMessage = { role: msg.role, content };

    if (isGroup) {
      // User messages: add prefix so AI can distinguish human from other AI participants
      if (msg.role === "user" && typeof apiMsg.content === "string") {
        apiMsg.content = `[User said]: ${apiMsg.content}`;
      }

      // Assistant messages: self stays "assistant", others become "user" with prefix
      if (msg.role === "assistant" && msg.senderName) {
        const isSelf = msg.participantId != null && msg.participantId === targetParticipantId;
        if (!isSelf) {
          apiMsg.role = "user";
          const prefix = `[${msg.senderName} said]: `;
          if (typeof apiMsg.content === "string") {
            apiMsg.content = prefix + apiMsg.content;
          }
        }
      }
    }

    apiMessages.push(apiMsg);
  }

  return apiMessages;
}

/**
 * Build a group chat roster string for the system prompt.
 */
function buildGroupRoster(conv: Conversation, selfParticipantId: string | null): string {
  const providerStore = useProviderStore.getState();
  const identityStore = useIdentityStore.getState();

  const lines = conv.participants.map((p) => {
    const model = providerStore.getModelById(p.modelId);
    const modelName = model?.displayName ?? p.modelId;
    const identity = p.identityId ? identityStore.getIdentityById(p.identityId) : null;
    const label = identity?.name ?? modelName;
    const isSelf = p.id === selfParticipantId;
    return `- ${label}${isSelf ? "  ← you" : ""}`;
  });

  return [
    "You are in a group chat with multiple AI participants and one human user.",
    "Participants:",
    ...lines,
    "",
    "The human user's messages appear as: [User said]: content",
    "Other AI participants' messages appear as: [Name said]: content",
    "Your own previous messages appear as role=assistant (no prefix).",
    "Always distinguish between the human user and other AI participants.",
    "Think independently — form your own opinions and do not simply agree with or echo others.",
    "If you disagree, say so directly and explain why. Constructive debate is encouraged.",
    "Do not repeat, summarize, or rephrase what others said unless asked.",
  ].join("\n");
}

/**
 * Resolve message content, converting image URIs to data URIs.
 */
async function resolveContent(msg: Message): Promise<ChatApiMessage["content"]> {
  const hasImages = msg.images && msg.images.length > 0;
  if (!hasImages) return msg.content;

  const imageParts = await Promise.all(
    msg.images.map(async (uri) => ({
      type: "image_url" as const,
      image_url: { url: await fileToDataUri(uri) },
    })),
  );
  return [
    ...(msg.content ? [{ type: "text" as const, text: msg.content }] : []),
    ...imageParts,
  ];
}
