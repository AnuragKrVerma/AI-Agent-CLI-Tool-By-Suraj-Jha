import chalk from "chalk";
import { Command } from "commander";
import yoctoSpinner from "yocto-spinner";
import { getStoredToken } from "../../../lib/token";
import { prisma } from "../../../lib/prisma";
import { select } from "@clack/prompts";
import { startChat } from "../../chat/chat-with-ai";
import { startToolChat } from "../../chat/chat-with-ai-tool";
import { startAgentChat } from "../../chat/chat-with-ai-agent";

const wakeUpAction = async () => {
  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.red("Not Authenticated. Please Login"));
    return;
  }

  const spinner = yoctoSpinner({ text: "Fetching user information..." });
  spinner.start();
  const user = await prisma.user.findFirst({
    where: {
      sessions: {
        some: {
          token: token.access_token,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  spinner.stop();

  if (!user) {
    console.log(chalk.red("User not found. Please login again."));
    return;
  }

  console.log(
    chalk.green(
      `Welcome back, ${user.name || user.email}! Your AI service is awake.`,
    ),
  );

  const choice = await select({
    message: "Choose an AI interaction mode:",
    options: [
      {
        value: "chat",
        label: "Chat",
        hint: "Simple chat with the AI",
      },
      {
        value: "tools",
        label: "Tools",
        hint: "Chat with Tools (Google Search, Code Execution)",
      },
      {
        value: "agent",
        label: "Agentic Mode",
        hint: "Advanced AI Agent (Coming Soon)",
      },
    ],
  });

  switch (choice) {
    case "chat":
      await startChat("chat");
      break;
    case "tools":
      await startToolChat();
      break;
    case "agent":
      await startAgentChat();
      break;
  }
};

export const wakeUp = new Command("wakeup")
  .description("Wake up the AI service")
  .action(wakeUpAction);
