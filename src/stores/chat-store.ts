import { create } from "zustand";
import type {
  Conversation,
  ConversationParticipant,
  Message,
  ChatApiMessage,
  ChatApiToolDef,
  StreamDelta,
  Identity,
} from "../types";
import {
  insertConversation,
  updateConversation as dbUpdateConversation,
  deleteConversation as dbDeleteConversation,
  getAllConversations,
  insertMessage,
  updateMessage as dbUpdateMessage,
  getMessages as dbGetMessages,
  searchMessages as dbSearchMessages,
  deleteMessage as dbDeleteMessage,
} from "../storage/database";
import { generateId } from "../utils/id";
import { ApiClient } from "../services/api-client";
import { executeTool, toolToApiDef } from "../services/mcp-client";
import { useProviderStore } from "./provider-store";
import { useIdentityStore } from "./identity-store";

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  isGenerating: boolean;
  activeBranchId: string | null;

  loadConversations: () => Promise<void>;
  createConversation: (
    type: "single" | "group",
    participants: ConversationParticipant[],
    title?: string,
  ) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  setCurrentConversation: (id: string | null) => void;
  loadMessages: (conversationId: string) => Promise<void>;
  updateParticipantIdentity: (
    conversationId: string,
    modelId: string,
    identityId: string | null,
  ) => Promise<void>;

  sendMessage: (text: string, mentionedModelIds?: string[]) => Promise<void>;
  branchFromMessage: (messageId: string) => Promise<string>;
  switchBranch: (branchId: string | null) => void;
  deleteMessageById: (messageId: string) => Promise<void>;
  searchAllMessages: (query: string) => Promise<Message[]>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isGenerating: false,
  activeBranchId: null,

  loadConversations: async () => {
    const conversations = await getAllConversations();
    set({ conversations });
  },

  createConversation: async (type, participants, title) => {
    const providerStore = useProviderStore.getState();
    const defaultTitle =
      title ??
      (type === "group"
        ? `Model Group (${participants.length})`
        : providerStore.getModelById(participants[0]?.modelId)?.displayName ??
          "New Chat");

    const conv: Conversation = {
      id: generateId(),
      type,
      title: defaultTitle,
      participants,
      lastMessage: null,
      lastMessageAt: null,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await insertConversation(conv);
    set({ conversations: [conv, ...get().conversations] });
    return conv;
  },

  deleteConversation: async (id) => {
    await dbDeleteConversation(id);
    const conversations = get().conversations.filter((c) => c.id !== id);
    set({
      conversations,
      currentConversationId:
        get().currentConversationId === id ? null : get().currentConversationId,
      messages: get().currentConversationId === id ? [] : get().messages,
    });
  },

  setCurrentConversation: (id) => {
    set({ currentConversationId: id, messages: [], activeBranchId: null });
    if (id) get().loadMessages(id);
  },

  loadMessages: async (conversationId) => {
    const messages = await dbGetMessages(conversationId, get().activeBranchId);
    set({ messages });
  },

  updateParticipantIdentity: async (conversationId, modelId, identityId) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const participants = conv.participants.map((p) =>
      p.modelId === modelId ? { ...p, identityId } : p,
    );
    await dbUpdateConversation(conversationId, { participants });

    const conversations = get().conversations.map((c) =>
      c.id === conversationId ? { ...c, participants } : c,
    );
    set({ conversations });
  },

  sendMessage: async (text, mentionedModelIds) => {
    const state = get();
    const convId = state.currentConversationId;
    if (!convId) return;

    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;

    const userMsg: Message = {
      id: generateId(),
      conversationId: convId,
      role: "user",
      senderModelId: null,
      senderName: "You",
      identityId: null,
      content: text,
      reasoningContent: null,
      toolCalls: [],
      toolResults: [],
      branchId: state.activeBranchId,
      parentMessageId: null,
      isStreaming: false,
      createdAt: new Date().toISOString(),
    };

    await insertMessage(userMsg);
    set({ messages: [...state.messages, userMsg], isGenerating: true });

    await dbUpdateConversation(convId, {
      lastMessage: text,
      lastMessageAt: userMsg.createdAt,
    });
    const conversations = get().conversations.map((c) =>
      c.id === convId
        ? { ...c, lastMessage: text, lastMessageAt: userMsg.createdAt, updatedAt: userMsg.createdAt }
        : c,
    );
    set({ conversations });

    const targetModelIds = resolveTargetModels(conv, mentionedModelIds);

    for (const modelId of targetModelIds) {
      await generateResponse(convId, modelId, conv);
    }

    set({ isGenerating: false });
  },

  branchFromMessage: async (messageId) => {
    const branchId = generateId();
    const state = get();
    const msgIndex = state.messages.findIndex((m) => m.id === messageId);
    if (msgIndex < 0) return branchId;

    const branchedMessages = state.messages.slice(0, msgIndex + 1).map((m) => ({
      ...m,
      id: generateId(),
      branchId,
    }));

    for (const msg of branchedMessages) {
      await insertMessage(msg);
    }

    set({ activeBranchId: branchId });
    await get().loadMessages(get().currentConversationId!);
    return branchId;
  },

  switchBranch: (branchId) => {
    set({ activeBranchId: branchId });
    const convId = get().currentConversationId;
    if (convId) get().loadMessages(convId);
  },

  deleteMessageById: async (messageId) => {
    await dbDeleteMessage(messageId);
    set({ messages: get().messages.filter((m) => m.id !== messageId) });
  },

  searchAllMessages: async (query) => {
    return dbSearchMessages(query);
  },
}));

function resolveTargetModels(
  conv: Conversation,
  mentionedModelIds?: string[],
): string[] {
  if (conv.type === "single") {
    return [conv.participants[0].modelId];
  }

  if (mentionedModelIds && mentionedModelIds.length > 0) {
    return mentionedModelIds;
  }

  return [];
}

async function generateResponse(
  conversationId: string,
  modelId: string,
  conv: Conversation,
): Promise<void> {
  const providerStore = useProviderStore.getState();
  const identityStore = useIdentityStore.getState();
  const chatStore = useChatStore.getState();

  const model = providerStore.getModelById(modelId);
  if (!model) return;

  const provider = providerStore.getProviderById(model.providerId);
  if (!provider) return;

  const participant = conv.participants.find((p) => p.modelId === modelId);
  const identity: Identity | undefined = participant?.identityId
    ? identityStore.getIdentityById(participant.identityId)
    : undefined;

  const apiMessages = buildApiMessages(chatStore.messages, modelId, identity, model.displayName);
  const tools = buildTools(identity);

  const assistantMsg: Message = {
    id: generateId(),
    conversationId,
    role: "assistant",
    senderModelId: modelId,
    senderName: model.displayName,
    identityId: identity?.id ?? null,
    content: "",
    reasoningContent: null,
    toolCalls: [],
    toolResults: [],
    branchId: chatStore.activeBranchId,
    parentMessageId: null,
    isStreaming: true,
    createdAt: new Date().toISOString(),
  };

  await insertMessage(assistantMsg);
  useChatStore.setState((s) => ({
    messages: [...s.messages, assistantMsg],
  }));

  const client = new ApiClient(provider);

  try {
    const stream = client.streamChat({
      model: model.modelId,
      messages: apiMessages,
      stream: true,
      temperature: identity?.params.temperature,
      top_p: identity?.params.topP,
      max_tokens: identity?.params.maxTokens,
      tools: tools.length > 0 ? tools : undefined,
    });

    let content = "";
    let reasoningContent = "";
    const pendingToolCalls: Array<{
      id: string;
      name: string;
      arguments: string;
    }> = [];

    for await (const delta of stream) {
      if (delta.content) {
        content += delta.content;
      }
      if (delta.reasoning_content) {
        reasoningContent += delta.reasoning_content;
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!pendingToolCalls[tc.index]) {
            pendingToolCalls[tc.index] = {
              id: tc.id ?? "",
              name: tc.function?.name ?? "",
              arguments: "",
            };
          }
          if (tc.id) pendingToolCalls[tc.index].id = tc.id;
          if (tc.function?.name) pendingToolCalls[tc.index].name = tc.function.name;
          if (tc.function?.arguments) {
            pendingToolCalls[tc.index].arguments += tc.function.arguments;
          }
        }
      }

      useChatStore.setState((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                content,
                reasoningContent: reasoningContent || null,
                toolCalls: pendingToolCalls.map((tc) => ({
                  id: tc.id,
                  name: tc.name,
                  arguments: tc.arguments,
                })),
              }
            : m,
        ),
      }));
    }

    if (pendingToolCalls.length > 0) {
      const toolResults = await executeToolCalls(pendingToolCalls);
      useChatStore.setState((s) => ({
        messages: s.messages.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, toolResults }
            : m,
        ),
      }));
    }

    await dbUpdateMessage(assistantMsg.id, {
      content,
      reasoningContent: reasoningContent || null,
      toolCalls: pendingToolCalls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
      })),
      isStreaming: false,
    });

    useChatStore.setState((s) => ({
      messages: s.messages.map((m) =>
        m.id === assistantMsg.id ? { ...m, isStreaming: false } : m,
      ),
    }));

    await dbUpdateConversation(conversationId, {
      lastMessage: content.slice(0, 100),
      lastMessageAt: new Date().toISOString(),
    });
  } catch (err) {
    const errorContent = `Error: ${err instanceof Error ? err.message : "Unknown error"}`;
    await dbUpdateMessage(assistantMsg.id, {
      content: errorContent,
      isStreaming: false,
    });
    useChatStore.setState((s) => ({
      messages: s.messages.map((m) =>
        m.id === assistantMsg.id
          ? { ...m, content: errorContent, isStreaming: false }
          : m,
      ),
    }));
  }
}

function buildApiMessages(
  messages: Message[],
  targetModelId: string,
  identity: Identity | undefined,
  modelDisplayName: string,
): ChatApiMessage[] {
  const apiMessages: ChatApiMessage[] = [];

  if (identity) {
    apiMessages.push({ role: "system", content: identity.systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === "system") continue;

    const apiMsg: ChatApiMessage = {
      role: msg.role,
      content: msg.content,
    };

    if (msg.role === "assistant" && msg.senderModelId !== targetModelId && msg.senderName) {
      apiMsg.name = msg.senderName.replace(/[^a-zA-Z0-9_-]/g, "_");
      if (!apiMsg.name) {
        apiMsg.content = `[Note: The following was generated by ${msg.senderName}]\n${msg.content}`;
      }
    }

    apiMessages.push(apiMsg);
  }

  return apiMessages;
}

function buildTools(identity: Identity | undefined): ChatApiToolDef[] {
  const identityStore = useIdentityStore.getState();
  const allTools = [
    ...identityStore.getGlobalTools(),
    ...(identity ? identityStore.getToolsForIdentity(identity.id) : []),
  ];

  return allTools
    .map((t) => toolToApiDef(t))
    .filter((t): t is ChatApiToolDef => t !== null);
}

async function executeToolCalls(
  toolCalls: Array<{ id: string; name: string; arguments: string }>,
): Promise<Array<{ toolCallId: string; content: string }>> {
  const identityStore = useIdentityStore.getState();
  const results: Array<{ toolCallId: string; content: string }> = [];

  for (const tc of toolCalls) {
    const tool = identityStore.mcpTools.find(
      (t) => t.schema?.name === tc.name || t.name === tc.name,
    );

    if (!tool) {
      results.push({
        toolCallId: tc.id,
        content: `Tool not found: ${tc.name}`,
      });
      continue;
    }

    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.arguments);
    } catch {
      // empty args
    }

    const result = await executeTool(tool, args);
    results.push({
      toolCallId: tc.id,
      content: result.success ? result.content : `Error: ${result.error}`,
    });
  }

  return results;
}
