/**
 * Prettify a raw model ID into a human-friendly display name.
 * e.g. "gpt-4o-2024-08-06" → "GPT-4o"
 *      "claude-3.5-sonnet-20241022" → "Claude 3.5 Sonnet"
 *      "deepseek-chat" → "DeepSeek Chat"
 */
export function prettifyModelName(modelId: string): string {
  // Known prefix mappings (order matters: longest match first)
  const KNOWN_PREFIXES: [RegExp, string][] = [
    [/^gpt-4o-mini/i, "GPT-4o Mini"],
    [/^gpt-4o/i, "GPT-4o"],
    [/^gpt-4-turbo/i, "GPT-4 Turbo"],
    [/^gpt-4/i, "GPT-4"],
    [/^gpt-3\.5-turbo/i, "GPT-3.5 Turbo"],
    [/^o1-mini/i, "o1 Mini"],
    [/^o1-preview/i, "o1 Preview"],
    [/^o1-pro/i, "o1 Pro"],
    [/^o3-mini/i, "o3 Mini"],
    [/^o3/i, "o3"],
    [/^o1/i, "o1"],
    [/^claude-3\.5-sonnet/i, "Claude 3.5 Sonnet"],
    [/^claude-3\.5-haiku/i, "Claude 3.5 Haiku"],
    [/^claude-3-opus/i, "Claude 3 Opus"],
    [/^claude-3-sonnet/i, "Claude 3 Sonnet"],
    [/^claude-3-haiku/i, "Claude 3 Haiku"],
    [/^claude-3\.7-sonnet/i, "Claude 3.7 Sonnet"],
    [/^claude-4-sonnet/i, "Claude 4 Sonnet"],
    [/^claude-4-opus/i, "Claude 4 Opus"],
    [/^gemini-2\.0-flash/i, "Gemini 2.0 Flash"],
    [/^gemini-1\.5-pro/i, "Gemini 1.5 Pro"],
    [/^gemini-1\.5-flash/i, "Gemini 1.5 Flash"],
    [/^gemini-pro/i, "Gemini Pro"],
    [/^deepseek-chat/i, "DeepSeek Chat"],
    [/^deepseek-reasoner/i, "DeepSeek Reasoner"],
    [/^deepseek-coder/i, "DeepSeek Coder"],
    [/^qwen-turbo/i, "Qwen Turbo"],
    [/^qwen-plus/i, "Qwen Plus"],
    [/^qwen-max/i, "Qwen Max"],
    [/^qwen-long/i, "Qwen Long"],
    [/^llama-3\.3/i, "Llama 3.3"],
    [/^llama-3\.2/i, "Llama 3.2"],
    [/^llama-3\.1/i, "Llama 3.1"],
    [/^llama-3/i, "Llama 3"],
    [/^mistral-large/i, "Mistral Large"],
    [/^mistral-medium/i, "Mistral Medium"],
    [/^mistral-small/i, "Mistral Small"],
    [/^mixtral/i, "Mixtral"],
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
