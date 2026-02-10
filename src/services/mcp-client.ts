import type { McpTool, McpToolSchema } from "../types";

export interface McpExecutionResult {
  success: boolean;
  content: string;
  error?: string;
}

type LocalToolHandler = (args: Record<string, unknown>) => Promise<McpExecutionResult>;

const localHandlers = new Map<string, LocalToolHandler>();

export function registerLocalTool(
  toolId: string,
  handler: LocalToolHandler,
): void {
  localHandlers.set(toolId, handler);
}

export async function executeTool(
  tool: McpTool,
  args: Record<string, unknown>,
): Promise<McpExecutionResult> {
  if (tool.type === "local") {
    return executeLocalTool(tool, args);
  }
  return executeRemoteTool(tool, args);
}

async function executeLocalTool(
  tool: McpTool,
  args: Record<string, unknown>,
): Promise<McpExecutionResult> {
  const handler = localHandlers.get(tool.id);
  if (!handler) {
    return {
      success: false,
      content: "",
      error: `No handler registered for tool: ${tool.name}`,
    };
  }

  try {
    return await handler(args);
  } catch (err) {
    return {
      success: false,
      content: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function executeRemoteTool(
  tool: McpTool,
  args: Record<string, unknown>,
): Promise<McpExecutionResult> {
  if (!tool.endpoint) {
    return { success: false, content: "", error: "No endpoint configured" };
  }

  try {
    const response = await fetch(tool.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "tools/call",
        params: { name: tool.schema?.name ?? tool.name, arguments: args },
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        content: "",
        error: `Remote MCP error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      content: typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content),
    };
  } catch (err) {
    return {
      success: false,
      content: "",
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export function toolToApiDef(tool: McpTool): {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
} | null {
  const schema: McpToolSchema | null = tool.schema;
  if (!schema) return null;

  return {
    type: "function",
    function: {
      name: schema.name,
      description: schema.description,
      parameters: schema.parameters,
    },
  };
}
