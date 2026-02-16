/**
 * Prettify a raw model ID into a human-friendly display name.
 * e.g. "gpt-4o-2024-08-06" → "GPT-4o"
 *      "claude-3.5-sonnet-20241022" → "Claude 3.5 Sonnet"
 *      "deepseek-chat" → "DeepSeek Chat"
 */
export function prettifyModelName(modelId: string): string {
  // Known prefix mappings (order matters: longest match first)
  const KNOWN_PREFIXES: [RegExp, string][] = [
    // OpenAI GPT-5.x
    [/^gpt-5\.3/i, "GPT-5.3"],
    [/^gpt-5\.2/i, "GPT-5.2"],
    [/^gpt-5\.1/i, "GPT-5.1"],
    [/^gpt-5/i, "GPT-5"],
    [/^gpt-4\.1-nano/i, "GPT-4.1 Nano"],
    [/^gpt-4\.1-mini/i, "GPT-4.1 Mini"],
    [/^gpt-4\.1/i, "GPT-4.1"],
    [/^gpt-4o-mini/i, "GPT-4o Mini"],
    [/^gpt-4o/i, "GPT-4o"],
    [/^gpt-4-turbo/i, "GPT-4 Turbo"],
    [/^gpt-4/i, "GPT-4"],
    [/^gpt-3\.5-turbo/i, "GPT-3.5 Turbo"],
    [/^o4-mini/i, "o4 Mini"],
    [/^o3-pro/i, "o3 Pro"],
    [/^o3-mini/i, "o3 Mini"],
    [/^o3/i, "o3"],
    [/^o1-mini/i, "o1 Mini"],
    [/^o1-preview/i, "o1 Preview"],
    [/^o1-pro/i, "o1 Pro"],
    [/^o1/i, "o1"],
    // Anthropic Claude 4.x
    [/^claude-opus-4[.-]6/i, "Claude Opus 4.6"],
    [/^claude-opus-4[.-]5/i, "Claude Opus 4.5"],
    [/^claude-sonnet-4[.-]5/i, "Claude Sonnet 4.5"],
    [/^claude-haiku-4[.-]5/i, "Claude Haiku 4.5"],
    [/^claude-opus-4[.-]1/i, "Claude Opus 4.1"],
    [/^claude-opus-4/i, "Claude Opus 4"],
    [/^claude-sonnet-4/i, "Claude Sonnet 4"],
    [/^claude-3[.-]7-sonnet/i, "Claude 3.7 Sonnet"],
    [/^claude-3\.5-sonnet/i, "Claude 3.5 Sonnet"],
    [/^claude-3\.5-haiku/i, "Claude 3.5 Haiku"],
    [/^claude-3-opus/i, "Claude 3 Opus"],
    [/^claude-3-sonnet/i, "Claude 3 Sonnet"],
    [/^claude-3-haiku/i, "Claude 3 Haiku"],
    // Google Gemini
    [/^gemini-3-pro/i, "Gemini 3 Pro"],
    [/^gemini-3-flash/i, "Gemini 3 Flash"],
    [/^gemini-2\.5-pro/i, "Gemini 2.5 Pro"],
    [/^gemini-2\.5-flash-lite/i, "Gemini 2.5 Flash Lite"],
    [/^gemini-2\.5-flash/i, "Gemini 2.5 Flash"],
    [/^gemini-2\.0-flash/i, "Gemini 2.0 Flash"],
    [/^gemini-2\.0-pro/i, "Gemini 2.0 Pro"],
    [/^gemini-1\.5-pro/i, "Gemini 1.5 Pro"],
    [/^gemini-1\.5-flash/i, "Gemini 1.5 Flash"],
    [/^gemini-pro/i, "Gemini Pro"],
    // DeepSeek
    [/^deepseek-r1/i, "DeepSeek R1"],
    [/^deepseek-v3/i, "DeepSeek V3"],
    [/^deepseek-chat/i, "DeepSeek Chat"],
    [/^deepseek-reasoner/i, "DeepSeek Reasoner"],
    [/^deepseek-coder/i, "DeepSeek Coder"],
    // Qwen
    [/^qwen3-235b/i, "Qwen3 235B"],
    [/^qwen3-32b/i, "Qwen3 32B"],
    [/^qwen3/i, "Qwen3"],
    [/^qwq/i, "QwQ"],
    [/^qwen-max/i, "Qwen Max"],
    [/^qwen-plus/i, "Qwen Plus"],
    [/^qwen-flash/i, "Qwen Flash"],
    [/^qwen-turbo/i, "Qwen Turbo"],
    [/^qwen-long/i, "Qwen Long"],
    // Meta Llama
    [/^llama-4/i, "Llama 4"],
    [/^llama-3\.3/i, "Llama 3.3"],
    [/^llama-3\.2/i, "Llama 3.2"],
    [/^llama-3\.1/i, "Llama 3.1"],
    [/^llama-3/i, "Llama 3"],
    // Mistral
    [/^mistral-large/i, "Mistral Large"],
    [/^mistral-medium/i, "Mistral Medium"],
    [/^mistral-small/i, "Mistral Small"],
    [/^pixtral/i, "Pixtral"],
    [/^codestral/i, "Codestral"],
    [/^mixtral/i, "Mixtral"],
    // xAI / Moonshot
    [/^grok-3/i, "Grok 3"],
    [/^grok-2/i, "Grok 2"],
    [/^kimi-k2/i, "Kimi K2"],
    [/^moonshot/i, "Moonshot"],
  ];

  for (const [pattern, name] of KNOWN_PREFIXES) {
    if (pattern.test(modelId)) return name;
  }

  // Fallback: strip date suffixes and prettify
  let name = modelId
    .replace(/-\d{4}-?\d{2}-?\d{2}$/, "") // remove date suffix like -20241022
    .replace(/-\d{4}$/, "")               // remove year suffix like -2024
    .replace(/:[\w.-]+$/, "");             // remove version tag like :latest

  // Convert kebab-case to Title Case
  name = name
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return name;
}
