import chalk from "chalk";
import boxen from "boxen";
import yoctoSpinner from "yocto-spinner";
import {
  text,
  isCancel,
  cancel,
  intro,
  outro,
  multiselect,
} from "@clack/prompts";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google-service";
import { ChatService } from "../../service/chat.service";
import { getStoredToken } from "../../lib/token";
import { prisma } from "../../lib/prisma";
import {
  availableTools,
  getEnabledTools,
  getEnabledToolName,
  enableTools,
  resetTools,
} from "../../config/tools.config";

marked.use(
  markedTerminal({
    code: chalk.cyan,
    blockquote: chalk.gray.italic,
    heading: chalk.green.bold,
    firstHeading: chalk.magenta.underline.bold,
    hr: chalk.reset,
    listitem: chalk.reset,
    list: chalk.reset,
    paragraph: chalk.reset,
    strong: chalk.bold,
    em: chalk.italic,
    codespan: chalk.yellow.bgBlack,
    del: chalk.dim.gray.strikethrough,
    link: chalk.blue.underline,
    href: chalk.blue.underline,
  }),
);

const aiService = new AIService();
const chatService = new ChatService();

async function getUserFromToken() {
  const token = await getStoredToken();
  if (!token || !token?.access_token) {
    throw new Error(
      "No authentication token found. Please run 'Scrappy login' first.",
    );
  }
  const spinner = yoctoSpinner({ text: "Authenticating user..." }).start();
  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: { token: token.access_token },
      },
    },
  });

  if (!user) {
    spinner.error("User not found");
    throw new Error("User not found. Please login again");
  }

  spinner.success(`Welcome back, ${user.name}`);
  return user;
}

async function selectTools() {
  const toolChoices = availableTools.map((tool) => ({
    value: tool.id,
    label: tool.name,
    hint: tool.description,
  }));
  const selectedToolIds = await multiselect({
    message: chalk.cyan(
      "Select tools to enable for this chat (use space to select, enter to confirm):",
    ),
    options: toolChoices,
    required: false,
  });

  if (isCancel(selectedToolIds)) {
    cancel(chalk.red("Tool selection cancelled. Exiting."));
    process.exit(0);
  }

  enableTools(selectedToolIds);

  if (selectedToolIds.length === 0) {
    console.log(chalk.yellow("No tools selected. Proceeding without tools."));
  } else {
    const toolsBox = boxen(
      chalk.green(
        ` Enabled tools: ${selectedToolIds
          .map((id) => {
            const tool = availableTools.find((t) => t.id === id);
            return `• ${tool?.name}`;
          })
          .join("\n")} `,
      ),
      {
        padding: 1,
        borderColor: "green",
        borderStyle: "round",
        margin: { top: 1, bottom: 1 },
        title: "🛠️  Tools Enabled ",
        titleAlignment: "center",
      },
    );
    console.log(toolsBox);
  }
  return selectedToolIds.length > 0;
}

async function initConversation(
  userId: string,
  conversationId = null,
  tool: "tool",
) {
  const spinner = yoctoSpinner({
    text: "Initializing conversation...",
  }).start();
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    tool,
  );
  spinner.success("Conversation ready");
  const enableToolsNames = getEnabledToolName();
  const toolsDisplay =
    enableToolsNames.length > 0
      ? ` \n ${chalk.gray(`Tools: ${enableToolsNames.join(", ")}`)}`
      : `\n ${chalk.gray(`No tools enabled`)}`;

  const conversationInfo = boxen(
    `chalk.bold("Conversation")}: ${conversation.title} \n ${chalk.gray(`ID: ${conversation.id}`)} \n ${chalk.gray(`Mode: ${conversation.mode}`)}${toolsDisplay}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "💭 Chat Session",
      titleAlignment: "center",
    },
  );
  console.log(conversationInfo);

  if (conversation.messages?.length > 0) {
    console.log(chalk.yellow("Previous messages \n"));
    displayMessages(conversation.messages);
  }
  return conversation;
}

async function displayMessages(message: any) {
  message.forEach(async (msg: any) => {
    if (msg.role === "user") {
      const userBox = boxen(chalk.white(msg.content), {
        padding: 1,
        margin: { left: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "blue",
        title: "You",
        titleAlignment: "left",
      });

      console.log(userBox);
    } else {
      // render markdown for assistant messages
      const renderedContent = await marked.parse(msg.content);
      const assistantBox = boxen(renderedContent?.trim(), {
        padding: 1,
        margin: { right: 2, bottom: 1 },
        borderStyle: "round",
        borderColor: "green",
        title: "Scrappy AI",
        titleAlignment: "left",
      });
      console.log(assistantBox);
    }
  });
}

async function saveMessage(conversationId: any, role: any, content: any) {
  return await chatService.addMessage(conversationId, role, content);
}
async function getAIResponse(conversationId: string) {
  const spinner = yoctoSpinner({ text: "Getting AI response..." }).start();
  const message = await chatService.getConversationMessages(conversationId);
  const formattedMessages = chatService.formatMessagesForAI(message);
  const enabledTools = getEnabledTools();
  let fullResponse = "";
  let isFirstChunk = true;
  const toolCallsDetected: any[] = [];
  try {
    const result = await aiService.sendMessage(
      formattedMessages,
      (chunk) => {
        if (isFirstChunk) {
          spinner.stop();
          console.log("\n");
          const headerBox = boxen(chalk.green("🤖 Scrappy AI:"));
          console.log(headerBox);
          console.log(chalk.gray("-".repeat(60)));
          isFirstChunk = false;
        }
        fullResponse += chunk;
      },
      enabledTools,
      (toolCall) => {
        toolCallsDetected.push(toolCall);
      },
    );

    if (toolCallsDetected.length > 0) {
      console.log("\n");
      const toolCallBox = boxen(
        toolCallsDetected
          .map(
            (tc) =>
              `${chalk.cyan("Tool Call:")} ${tc.toolName}\n${chalk.gray("Args: ")}${JSON.stringify(tc.args, null, 2)}`,
          )
          .join("\n\n"),
        {
          padding: 1,
          margin: 1,
          borderColor: "cyan",
          borderStyle: "round",
          title: "🛠️  Tool Calls Made ",
        },
      );
      console.log(toolCallBox);
    }

    if (result.toolResults && result.toolResults.length > 0) {
      const toolResultBox = boxen(
        result.toolResults
          .map(
            (tr) =>
              `${chalk.green("Tool Result:")} ${tr.toolName}\n${chalk.gray("Output: ")}${JSON.stringify(tr.output, null, 2)}`,
          )
          .slice(0, 200)
          .join("\n\n"),
        {
          padding: 1,
          margin: 1,
          borderColor: "green",
          borderStyle: "round",
          title: "🛠️  Tool Results ",
        },
      );
      console.log(toolResultBox);
    }

    console.log("\n");
    const renderedMarkdown = marked.parse(fullResponse);
    console.log(renderedMarkdown);
    console.log(chalk.gray("-".repeat(60)));
    console.log("\n");
    return result.content;
  } catch (error) {
    spinner.error("Failed to get AI response");
    throw error;
  }
}
async function updateConversationTitle(
  conversationId: string,
  userInput: string,
  messageCount: number,
) {
  if (messageCount === 1) {
    const title = userInput.slice(0, 50) + (userInput.length > 50 ? "..." : "");
    await chatService.updateConversationTitle(conversationId, title);
  }
}

async function chatLoop(conversationId: string) {
  const enabledTools = getEnabledToolName();
  const helpBox = boxen(
    `${chalk.cyan("Type your message and press enter to send.")}\n${chalk.cyan("Type 'exit' to end the chat session.")}\n${enabledTools.length > 0 ? chalk.cyan(`Enabled tools: ${enabledTools.join(", ")}`) : chalk.cyan("No tools enabled.")} \n ${chalk.gray("Type 'exit' to end conversation")} \n ${chalk.gray(" Press Ctrl+C to cancel at any time")}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderColor: "gray",
      borderStyle: "round",
      dimBorder: true,
    },
  );

  console.log(helpBox);
  while (true) {
    const userInput = await text({
      message: chalk.blue("Your message"),
      placeholder: "Type your message...",
      validate(value) {
        if (!value || value.length === 0) {
          return "Message cannot be empty";
        }
      },
    });
    if (isCancel(userInput)) {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      process.exit(0);
    }

    if (userInput.toLowerCase() === "exit") {
      const exitBox = boxen(chalk.yellow("Chat session ended. Goodbye! 👋"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      });
      console.log(exitBox);
      break;
    }

    const userBox = boxen(chalk.white(userInput), {
      padding: 1,
      margin: { left: 2, bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "You",
      titleAlignment: "left",
    });

    console.log(userBox);

    await saveMessage(conversationId, "user", userInput);

    const message = await chatService.getConversationMessages(conversationId);
    const aiResponse = await getAIResponse(conversationId);
    await saveMessage(conversationId, "assistant", aiResponse);
    await updateConversationTitle(conversationId, userInput, message.length);
  }
}

export async function startToolChat(conversationId = null) {
  try {
    intro(
      boxen(chalk.green(" Welcome to Scrappy AI Tool Chat "), {
        padding: 1,
        borderColor: "green",
        margin: 1,
      }),
    );
    const user = await getUserFromToken();
    const toolsEnabled = await selectTools();
    const conversation = await initConversation(
      user.id,
      conversationId,
      "tool",
    );
    await chatLoop(conversation.id);

    resetTools();

    outro(chalk.green(" Thank you for using Scrappy AI Tool Chat "));
  } catch (error) {
    const errorBox = boxen(
      chalk.red(
        ` An error occurred: ${error instanceof Error ? error.message : String(error)} `,
      ),
      {
        padding: 1,
        borderColor: "red",
        borderStyle: "round",
        margin: 1,
      },
    );
    console.log(errorBox);
    process.exit(1);
  }
}
