import { google } from "@ai-sdk/google";
import chalk from "chalk";

export const availableTools = [
  {
    id: "google_search",
    name: "Google Search",
    description:
      "Useful for when you need to answer questions about current events or the real world. Input should be a search query.",
    getTool: () => {
      return google.tools.googleSearch({});
    },
    enable: false,
  },
  // Ai please add tools for code execution & url context
  {
    id: "code_execution",
    name: "Code Execution",
    description:
      "Execute JavaScript code snippets to perform calculations or data processing. Input should be valid JavaScript code.",
    getTool: () => {
      return google.tools.codeExecution({});
    },
    enable: false,
  },
  {
    id: "url_context",
    name: "URL Context",
    description:
      "Fetch and summarize content from a given URL. Input should be a valid URL.",
    getTool: () => {
      return google.tools.urlContext({});
    },
    enable: false,
  },
];

export function getEnabledTools() {
  const tools: any = {};
  try {
    for (const toolConfig of availableTools) {
      if (toolConfig.enable) {
        tools[toolConfig.id] = toolConfig.getTool();
      }
    }
    if (Object.keys(tools).length > 0) {
      console.log(
        chalk.gray(`[DEBUG] Enabled tools: ${Object.keys(tools).join(", ")}`),
      );
    } else {
      console.log(chalk.gray(`[DEBUG] No tools enabled`));
    }
    return Object.keys(tools).length > 0 ? tools : undefined;
  } catch (error) {
    console.error(
      chalk.red("[ERROR] Failed to initialize tools:"),
      error instanceof Error ? error.message : String(error),
    );
    return undefined;
  }
}

export function toggleTool(toolId: string) {
  const tool = availableTools.find((t) => t.id === toolId);
  if (tool) {
    tool.enable = !tool.enable;
    console.log(
      chalk.green(
        `Tool "${tool.name}" is now ${tool.enable ? "enabled" : "disabled"}.`,
      ),
    );
    return tool.enable;
  }
  console.log(chalk.red(`[Debug] Tool ${toolId} not found`));
  return false;
}
export function enableTools(toolIds: string[]) {
  console.log(chalk.gray(`[DEBUG] enableTools called with: `), toolIds);
  availableTools.forEach((tool) => {
    const wasEnabled = tool.enable;
    tool.enable = toolIds.includes(tool.id);
    if (tool.enable !== wasEnabled) {
      console.log(
        chalk.gray(
          ` [Debug] Tool "${tool.name}" is now ${tool.enable ? "enabled" : "disabled"}.`,
        ),
      );
    }
  });

  const enabledCount: number = availableTools.filter((t) => t.enable).length;
  console.log(
    chalk.gray(
      ` [Debug] Total enabled tools: ${enabledCount}/${availableTools.length}`,
    ),
  );
}

export function getEnabledToolName() {
  const name = availableTools
    .filter((t) => t.enable)
    .map((t) => t.name);
  console.log(chalk.gray(`[Debug] getEnabledToolName returning: ${name}`));
  return name;
}

export function resetTools() {
  availableTools.forEach((tool) => {
    tool.enable = false;
  });
  console.log(chalk.gray(`[Debug] All tools have been reset (disabled)`));
}
