/**
 * chat-service.ts — Re-exports from modular chat/ directory.
 *
 * The actual implementation is split into:
 *   chat/message-builder.ts  — resolveTargetModels, buildApiMessages, autoGenerateTitle
 *   chat/tool-executor.ts    — buildTools, executeToolCalls
 *   chat/generate-response.ts — generateResponse (main orchestrator)
 */

export { resolveTargetModels, buildApiMessages, autoGenerateTitle } from "./chat/message-builder";
export { buildTools, executeToolCalls } from "./chat/tool-executor";
export { generateResponse } from "./chat/generate-response";
