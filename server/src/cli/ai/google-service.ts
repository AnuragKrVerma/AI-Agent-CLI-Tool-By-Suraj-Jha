import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, generateObject, streamText } from "ai";
import { config } from "../../config/google.config.js";
import chalk from "chalk";

export class AIService {
  model: any;
  constructor() {
    if (!config.googleApiKey) {
      throw new Error(
        "Google Generative AI API key is not set in environment variables.",
      );
    }
    const google = createGoogleGenerativeAI({
      apiKey: config.googleApiKey,
    });
    this.model = google(config.model);
  }

  /**
   * Send a message & get streaming response
   * @param {Array} messages
   * @param {Function} onChunk
   * @param {Object} tools
   * @param {Function} onToolCall
   * @return {Promise<Object>}
   *
   */

  async sendMessage(
    messages: any,
    onChunk: (chunk: string) => void,
    tools: Record<string, unknown> | undefined = undefined,
    onToolCall?: (toolCall: any) => void,
  ) {
    try {
      const streamConfig: any = {
        model: this.model,
        messages: messages,
      };

      if (tools && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
        streamConfig.maxSteps = 5;

        console.log(`[DEBUG] Tools enabled : ${Object.keys(tools).join(", ")}`);
      }

      const result = streamText(streamConfig);

      let fullResponse = "";
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }
      const fullResult = result;

      const toolCalls = [];
      const toolResults = [];
      if (fullResult.steps && Array.isArray(fullResult.steps)) {
        for (const step of fullResult.steps) {
          if (step.toolCall && step.toolCalls.length > 0) {
            for (const toolCall of step.toolCalls) {
              toolCalls.push(toolCall);
              if (onToolCall) {
                onToolCall(toolCall);
              }
            }
          }
          if (step.toolResults && step.toolResults.length > 0) {
            toolResults.push(...step.toolResults);
          }
        }
      }

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage,
        toolCalls: toolCalls,
        toolResults: toolResults,
        steps: fullResult.steps,
      };
    } catch (error) {
      console.error(chalk.red("Error in sendMessage:"), error);
      throw error;
    }
  }

  /**
   * Get a non-streaming response
   * @param {Array} messages - Array of messages objects
   * @param {Object} tools - Optional tools
   * @returns {Promise<string>} Response text
   */

  async getMessage(messages: any, tools = undefined) {
    let fullResponse = "";
    const result = await this.sendMessage(
      messages,
      (chunk) => {
        fullResponse += chunk;
      },
      tools,
    );

    return result.content;
  }

  /**
   * Generate structured output using a zod scheme
   * @param {Object} scheme - Zod schema object
   * @param {String} prompt - Prompt to generate
   * @param {Promise<Object>} - Parsed output matching the schema
   */
  async generateStructuredOutput(scheme: any, prompt: string) {
    try {
      const result = await generateObject({
        model: this.model,
        prompt,
        schema: scheme,
      });
      return result.object;
    } catch (error) {
      console.error(
        chalk.red("AI Structured Generation Error:"),
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
