import type { ModelCapabilities } from "../types";

// ── Known model capability map (updated Feb 2026) ──────────────────
// Each entry: [pattern, { vision, reasoning, toolCall, streaming }, maxContext]
// pattern is matched via id.includes(pattern), order matters (first match wins)
const KNOWN_MODELS: [string, ModelCapabilities, number][] = [
  // ── OpenAI (current: GPT-5.x, o3) ──
  ["gpt-5.3",   { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 200000],
  ["gpt-5.2",   { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 200000],
  ["gpt-5.1",   { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 200000],
  ["gpt-5",     { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 200000],
  ["o3-pro",    { vision: true,  reasoning: true,  toolCall: true,  streaming: true }, 200000],
  ["o3-mini",   { vision: false, reasoning: true,  toolCall: true,  streaming: true }, 200000],
  ["o3",        { vision: true,  reasoning: true,  toolCall: true,  streaming: true }, 200000],
  // Legacy (retiring but still in API)
  ["gpt-4.1-nano", { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 1000000],
  ["gpt-4.1-mini", { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 1000000],
  ["gpt-4.1",      { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 1000000],
  ["o4-mini",   { vision: true,  reasoning: true,  toolCall: true,  streaming: true }, 200000],
  ["gpt-4o-mini",  { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["gpt-4o",    { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["gpt-4-turbo",  { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["gpt-4",     { vision: false, reasoning: false, toolCall: true,  streaming: true }, 8000],
  ["gpt-3.5",   { vision: false, reasoning: false, toolCall: true,  streaming: true }, 16000],

  // ── Anthropic Claude (current: 4.x) ──
  ["claude-opus-4-6",   { vision: true, reasoning: true,  toolCall: true, streaming: true }, 1000000],
  ["claude-opus-4.6",   { vision: true, reasoning: true,  toolCall: true, streaming: true }, 1000000],
  ["claude-opus-4-5",   { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-opus-4.5",   { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-sonnet-4-5", { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-sonnet-4.5", { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-haiku-4-5",  { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-haiku-4.5",  { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-opus-4-1",   { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-opus-4",     { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-sonnet-4",   { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  // Legacy 3.x
  ["claude-3-7-sonnet", { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-3.7-sonnet", { vision: true, reasoning: true,  toolCall: true, streaming: true }, 200000],
  ["claude-3-5-sonnet", { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],
  ["claude-3.5-sonnet", { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],
  ["claude-3-5-haiku",  { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],
  ["claude-3.5-haiku",  { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],
  ["claude-3-opus",     { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],
  ["claude-3-sonnet",   { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],
  ["claude-3-haiku",    { vision: true, reasoning: false, toolCall: true, streaming: true }, 200000],

  // ── Google Gemini (current: 3.x, 2.5) ──
  ["gemini-3-pro",        { vision: true, reasoning: true,  toolCall: true, streaming: true }, 1000000],
  ["gemini-3-flash",      { vision: true, reasoning: true,  toolCall: true, streaming: true }, 1000000],
  ["gemini-2.5-pro",      { vision: true, reasoning: true,  toolCall: true, streaming: true }, 1000000],
  ["gemini-2.5-flash-lite", { vision: true, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["gemini-2.5-flash",    { vision: true, reasoning: true,  toolCall: true, streaming: true }, 1000000],
  // Legacy 2.0 (retiring Mar 2026)
  ["gemini-2.0-flash",    { vision: true, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["gemini-2.0-pro",      { vision: true, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["gemini-1.5-pro",      { vision: true, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["gemini-1.5-flash",    { vision: true, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["gemini-1.0-pro",      { vision: true, reasoning: false, toolCall: true, streaming: true }, 32000],

  // ── DeepSeek (current: V3.2) ──
  ["deepseek-reasoner",   { vision: false, reasoning: true,  toolCall: true,  streaming: true }, 128000],
  ["deepseek-chat",       { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["deepseek-r1",         { vision: false, reasoning: true,  toolCall: false, streaming: true }, 128000],
  ["deepseek-v3",         { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["deepseek-v2",         { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["deepseek-coder",      { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],

  // ── Qwen (current: Qwen3 / Qwen-Max/Plus/Flash/Coder) ──
  ["qwen-max",    { vision: false, reasoning: true,  toolCall: true, streaming: true }, 262144],
  ["qwen-plus",   { vision: false, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["qwen-flash",  { vision: false, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["qwen-coder",  { vision: false, reasoning: false, toolCall: true, streaming: true }, 1000000],
  ["qwen3-235b",  { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwen3-30b",   { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwen3-32b",   { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwen3-14b",   { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwen3-8b",    { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwen3-4b",    { vision: false, reasoning: true,  toolCall: true, streaming: true }, 32000],
  ["qwen3",       { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwq",         { vision: false, reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["qwen2.5-vl",  { vision: true,  reasoning: false, toolCall: true, streaming: true }, 128000],
  ["qwen2.5-coder", { vision: false, reasoning: false, toolCall: true, streaming: true }, 128000],
  ["qwen2.5",     { vision: false, reasoning: false, toolCall: true, streaming: true }, 128000],

  // ── Meta Llama ──
  ["llama-4",     { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 1000000],
  ["llama-3.3",   { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["llama-3.2-90b", { vision: true, reasoning: false, toolCall: true, streaming: true }, 128000],
  ["llama-3.2-11b", { vision: true, reasoning: false, toolCall: true, streaming: true }, 128000],
  ["llama-3.2",   { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["llama-3.1",   { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["llama-3",     { vision: false, reasoning: false, toolCall: false, streaming: true }, 8000],

  // ── Mistral ──
  ["mistral-large",  { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["mistral-small",  { vision: false, reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["pixtral",        { vision: true,  reasoning: false, toolCall: true,  streaming: true }, 128000],
  ["codestral",      { vision: false, reasoning: false, toolCall: true,  streaming: true }, 32000],
  ["mixtral",        { vision: false, reasoning: false, toolCall: true,  streaming: true }, 32000],
  ["mistral",        { vision: false, reasoning: false, toolCall: true,  streaming: true }, 32000],

  // ── xAI Grok ──
  ["grok-3",      { vision: true,  reasoning: true,  toolCall: true, streaming: true }, 128000],
  ["grok-2",      { vision: true,  reasoning: false, toolCall: true, streaming: true }, 128000],

  // ── Moonshot Kimi ──
  ["kimi-k2",     { vision: false, reasoning: true,  toolCall: true, streaming: true }, 256000],
  ["moonshot",    { vision: false, reasoning: false, toolCall: true, streaming: true }, 128000],
];

// Default for unrecognized models: vision & toolCall on (most modern models support them)
const DEFAULT_CAPS: ModelCapabilities = {
  vision: true,
  reasoning: false,
  toolCall: true,
  streaming: true,
};

export function inferCapabilities(modelId: string): ModelCapabilities {
  const id = modelId.toLowerCase();
  for (const [pattern, caps] of KNOWN_MODELS) {
    if (id.includes(pattern)) return { ...caps };
  }
  return { ...DEFAULT_CAPS };
}

export function inferMaxContext(modelId: string): number {
  const id = modelId.toLowerCase();
  for (const [pattern, , ctx] of KNOWN_MODELS) {
    if (id.includes(pattern)) return ctx;
  }
  // Fallback heuristics for unknown models
  if (id.includes("1m") || id.includes("1000k")) return 1000000;
  if (id.includes("200k")) return 200000;
  if (id.includes("128k")) return 128000;
  if (id.includes("32k")) return 32000;
  if (id.includes("16k")) return 16000;
  return 8000;
}
