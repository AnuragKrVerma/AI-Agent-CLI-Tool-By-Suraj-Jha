#!/usr/bin/env node

import dotenv from "dotenv";
import chalk from "chalk";
import figlet from "figlet";
import { Command } from "commander";
import { login, logout, whoami } from "./commands/auth/login.js";
import { wakeUp } from "./commands/ai/wakeUp.js";

dotenv.config();

async function main() {
  console.log(
    chalk.cyan(
      figlet.textSync("Scrappy AI Tool", {
        font: "Standard",
        horizontalLayout: "default",
      }),
    ),
  );

  console.log(chalk.gray("A cli based AI tool \n"));

  const program = new Command("Scrappy");

  program
    .version("0.1.0")
    .description("Scrappy AI Tool")
    .addCommand(login)
    .addCommand(logout)
    .addCommand(whoami)
    .addCommand(wakeUp);

  program.action(() => {
    program.help();
  });

  program.parse();
}

main().catch((err) => {
  console.error(chalk.red("Error starting CLI:"), err);
  process.exit(1);
});
