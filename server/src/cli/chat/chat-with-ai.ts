import chalk from "chalk";
import boxen from "boxen";
import yoctoSpinner from "yocto-spinner";
import { text, isCancel, cancel, intro, outro } from "@clack/prompts";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { AIService } from "../ai/google-service";
import { ChatService } from "../../service/chat.service";
import { getStoredToken } from "../../lib/token";
import { prisma } from "../../lib/prisma";
import { tr } from "zod/v4/locales";

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

async function initConversation(
  userId: string,
  conversationId = null,
  mode: string,
) {
  const spinner = yoctoSpinner({
    text: "Initializing conversation...",
  }).start();
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    mode,
  );
  spinner.success("Conversation ready");
  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title} \n ${chalk.gray(`ID: ${conversation.id}`)} \n ${chalk.gray(`Mode: ${conversation.mode}`)}`,
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

  if (conversation.message?.length > 0) {
    console.log(chalk.yellow("Previous message \n"));
    displayMessages(conversation.message);
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

async function getAIResponse(conversationId: any) {
  const spinner = yoctoSpinner({ text: "Scrappy AI is typing..." }).start();
  const dbMessages = await chatService.getConversationMessages(conversationId);
  const aiMessages = chatService.formatMessagesForAI(dbMessages);
  let fullResponse = "";
  let isFirstChunk = true;
  try {
    const result = await aiService.sendMessage(aiMessages, (chunk) => {
      if (isFirstChunk) {
        spinner.stop();
        console.log("\n");
        const header = chalk.green.bold("Assistant: ");
        console.log(header);
        console.log(chalk.gray("-".repeat(60)));
        isFirstChunk = false;
      }
      fullResponse += chunk;
    });

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

async function chatLoop(conversation: any) {
  const helpBox = boxen(
    `${chalk.gray("Type your message & press enter")}\n${chalk.gray("Markdown formatting is supported in response")}\n${chalk.gray("Type 'exit' to end conversation")}\n${chalk.gray("Press Ctrl+C to quit anytime")}`,
    {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "gray",
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
    await saveMessage(conversation.id, "user", userInput);

    const message = await chatService.getConversationMessages(conversation.id);
    const aiResponse = await getAIResponse(conversation.id);
    await saveMessage(conversation.id, "assistant", aiResponse);
    await updateConversationTitle(conversation.id, userInput, message.length);
  }
}

export async function startChat(mode = "chat", conversationId = null) {
  try {
    intro(
      boxen(chalk.bold.cyan("Scrappy AI Chat"), {
        padding: 1,
        borderStyle: "double",
        borderColor: "cyan",
      }),
    );

    const user = await getUserFromToken();
    const conversation = await initConversation(user.id, conversationId, mode);
    await chatLoop(conversation);
    outro(chalk.green("✨ Thanks for chatting with Scrappy AI!"));
  } catch (error) {
    const errorBox = boxen(
      chalk.red(`❌ Error : ${(error as Error).message}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
      },
    );
    console.error(errorBox);
    process.exit(1);
  }
}
