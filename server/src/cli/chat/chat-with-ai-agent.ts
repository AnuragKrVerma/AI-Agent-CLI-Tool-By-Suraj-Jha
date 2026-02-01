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
  confirm,
} from "@clack/prompts";
import { AIService } from "../ai/google-service";
import { ChatService } from "../../service/chat.service";
import { getStoredToken } from "../../lib/token";
import { prisma } from "../../lib/prisma";
import { generateApplication } from "../../config/agent.config";

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

async function initConversation(userId: string, conversationId = null) {
  const spinner = yoctoSpinner({
    text: "Initializing conversation...",
  }).start();
  const conversation = await chatService.getOrCreateConversation(
    userId,
    conversationId,
    "agent",
  );
  spinner.success("Conversation ready");

  const conversationInfo = boxen(
    `${chalk.bold("Conversation")}: ${conversation.title} \n ${chalk.gray(`ID: ${conversation.id}`)} \n ${chalk.gray(`Mode: ${conversation.mode}`)}${chalk.cyan(`Working Directory: ${process.cwd()}`)}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: "round",
      borderColor: "cyan",
      title: "🤖 Agent Mode",
      titleAlignment: "center",
    },
  );
  console.log(conversationInfo);

  return conversation;
}

async function saveMessage(conversationId: any, role: any, content: any) {
  return await chatService.addMessage(conversationId, role, content);
}

async function agentLoop(conversation: any) {
  const helpBox = boxen(
    `${chalk.cyan.bold("What can the agent do?")}\n\n` +
      `${chalk.gray("- Generate a full-stack application based on your requirements")}\n` +
      `${chalk.gray("- Create files and folders in the current directory")}\n` +
      `${chalk.gray("- Include setup commands to run the application")}\n\n` +
      `${chalk.cyan("Type your application requirements and press enter to start the generation process.")}\n\n` +
      `${chalk.yellow.bold("Example")}` +
      `${chalk.gray("\nCreate a todo app using React for frontend and Node.js for backend with a MongoDB database.")}\n\n` +
      `${chalk.gray("Create Restful API using Express.js with endpoints for user authentication, CRUD operations for tasks, and integration with a MongoDB database.")}\n\n` +
      `${chalk.gray("The frontend should be built with React, using functional components and hooks. It should have pages for user registration, login, and a dashboard to manage tasks. Use Axios for API calls.")}\n\n` +
      `${chalk.gray("Include setup commands to install dependencies and run both the frontend and backend servers.")}\n\n` +
      `${chalk.gray("Press Ctrl+C to cancel at any time.")}`,
    {
      padding: 1,
      borderStyle: "round",
      borderColor: "blue",
      title: "🤖 Agent Instructions",
      margin: { bottom: 1 },
    },
  );
  console.log(helpBox);
  while (true) {
    const userInput = await text({
      message: chalk.cyan("What would you like the agent to create?"),
      placeholder: "Describe the application you want to generate...",
      validate: (value) => {
        if (!value || value.trim().length === 0) {
          return "Please enter a valid description.";
        }
        if (value.trim().length < 10) {
          return "Description is too short. Please provide more details.";
        }
      },
    });
    if (isCancel(userInput)) {
      cancel(chalk.red("Agent session cancelled by user."));
      process.exit(0);
    }
    if (userInput.toLocaleLowerCase() === "exit") {
      outro(chalk.green.bold("🤖 Agent session ended. Goodbye!"));
      process.exit(0);
    }

    const userBox = boxen(chalk.blueBright.bold(`🧑 User: ${userInput}`), {
      padding: 1,
      margin: { bottom: 1 },
      borderStyle: "round",
      borderColor: "blue",
      title: "🧑 Your Request",
      titleAlignment: "left",
    });
    console.log(userBox);
    await saveMessage(conversation.id, "user", userInput);

    try {
      const result = await generateApplication(
        userInput,
        aiService,
        process.cwd(),
      );
      if (result && result.success) {
        const responsemessage = `Application "${result.folderName}" generated successfully in folder "${result.folderName}".\nFiles created: ${result.files.length}\nSetup Commands:\n${result.commands.join("\n")}`;

        await saveMessage(conversation.id, "assistant", responsemessage);

        // Ask if the user wants to generate another application
        const continuePrompt = await confirm({
          message: chalk.cyan(
            "Would you like to generate another application?",
          ),
          initialValue: false,
        });

        if (!continuePrompt || isCancel(continuePrompt)) {
          outro(
            chalk.green.bold("👋 Great. Check your generated application  !"),
          );
          break;
        }
      } else {
        const errorMessage =
          "Failed to generate application. Please try again.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(chalk.red(`\n  ${errorMsg} `));
      await saveMessage(conversation.id, "assistant", errorMsg);

      const retry = await confirm({
        message: chalk.yellow("Do you want to try again?"),
        initialValue: true,
      });
      if (!retry || isCancel(retry)) {
        break;
      }
    }
  }
}

export async function startAgentChat(conversationId = null) {
  try {
    intro(
      boxen(
        chalk.bold.green("🤖 Welcome to Scrappy AI Agent Mode!") +
          chalk.gray("Autonomous Application Generator"),
        { padding: 1, borderColor: "magenta", borderStyle: "round" },
      ),
    );

    const user = await getUserFromToken();
    const shouldContinue = await confirm({
      message: chalk.yellow(
        "The agent will create files & folders in the current directory. Do you want to continue?",
      ),
      initialValue: true,
    });
    if (!shouldContinue || isCancel(shouldContinue)) {
      cancel(chalk.red("Agent mode cancelled by user."));
      process.exit(0);
    }

    const conversation = await initConversation(user.id, conversationId);

    await agentLoop(conversation);

    outro(chalk.green.bold("🤖 Agent session ended. Goodbye!"));
  } catch (error) {
    const errorBox = boxen(
      chalk.red(
        "Error during agent chat: " +
          (error instanceof Error ? error.message : String(error)),
      ),
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
