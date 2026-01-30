#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login } from "./commands/auth/login.js";

dotenv.config();

async function main() {
  console.log(
    chalk.cyan(
      figlet.textSync("AI Agent CLI", {
        font: "Standard",
        horizontalLayout: "default",
      }),
    ),
  );

  console.log(chalk.gray("A cli based AI tool \n"));

  const program = new Command("aiagent");

  program.version("0.1.0").description("AI Agent CLI Tool").addCommand(login);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.error(chalk.red("Error starting CLI:"), err);
  process.exit(1);
});
