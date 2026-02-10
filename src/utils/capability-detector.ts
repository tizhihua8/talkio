import { CAPABILITY_KEYWORDS } from "../constants";
import type { ModelCapabilities } from "../types";

export function inferCapabilities(modelId: string): ModelCapabilities {
  const id = modelId.toLowerCase();

  return {
    vision: CAPABILITY_KEYWORDS.vision.some((kw) => id.includes(kw)),
    reasoning: CAPABILITY_KEYWORDS.reasoning.some((kw) => id.includes(kw)),
    toolCall: CAPABILITY_KEYWORDS.toolCall.some((kw) => id.includes(kw)),
    streaming: true,
  };
}

export function inferMaxContext(modelId: string): number {
  const id = modelId.toLowerCase();
  if (id.includes("200k") || id.includes("1m")) return 200000;
  if (id.includes("128k")) return 128000;
  if (id.includes("32k")) return 32000;
  if (id.includes("16k")) return 16000;
  return 8000;
}
