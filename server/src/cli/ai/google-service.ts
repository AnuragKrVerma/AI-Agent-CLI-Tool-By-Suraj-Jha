import { google } from "@ai-sdk/google";
import { streamText } from "ai";
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
    this.model = google(config.model, {
      apiKey: config.googleApiKey,
    });
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

  async sendMessage(messages: any, onChunk: { (chunk: any): void; (arg0: string): void; }, tools = undefined, onToolCall = null) {
    try {
      const streamConfig = {
        model: this.model,
        messages: messages,
      };

      const result = streamText(streamConfig);

      let fullResponse = "";
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        if (onChunk) {
          onChunk(chunk);
        }
      }
      const fullResult = result;

      return {
        content: fullResponse,
        finishResponse: fullResult.finishReason,
        usage: fullResult.usage,
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
   * @param {Promise<string>} - Response text
   */

  async getMessage(messages: any, tools = undefined) {
    let fullResponse = "";
    await this.sendMessage(messages, (chunk) => {
      fullResponse += chunk;
    });

    return fullResponse;
  }
}
