import { cancel, confirm, intro, outro, isCancel } from "@clack/prompts";
import { logger } from "better-auth";
import { createAuthClient } from "better-auth/client";
import { deviceAuthorizationClient } from "better-auth/client/plugins";
import chalk from "chalk";
import open from "open";
import os from "os";
import { Command } from "commander";
import path from "path";
import yoctoSpinner from "yocto-spinner";
import fs from "node:fs/promises";
import * as z from "zod/v4";
import dotenv from "dotenv";
import { prisma } from "@/../../src/lib/prisma";

dotenv.config();

const URL = process.env.BACKEND_URL || "http://localhost:3005";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";

const CONFIG_DIR = path.join(os.homedir(), ".better-auth");
const TOKEN_PATH = path.join(CONFIG_DIR, "token.json");

export async function loginAction() {
  const options = z
    .object({
      serverUrl: z.string().optional(),
      clientId: z.string().optional(),
    })
    .parse({});

  const clientId = options.clientId || CLIENT_ID;
  const serverUrl = options.serverUrl || URL;

  intro(chalk.bold("🔐 Auth CLI Login"));

  // TODO: Change this with token management utils
  const exixtingToken = false;
  const expired = false;

  if (exixtingToken && !expired) {
    const shouldReAuth = await confirm({
      message: "You are already logged in. Do you want to re-authenticate?",
      initialValue: false,
    });
    if (!shouldReAuth) {
      return;
    }
    if (isCancel(shouldReAuth)) {
      cancel("Login cancelled.");
      return;
    }
  }

  const authClient = createAuthClient({
    baseURL: serverUrl,
    plugins: [deviceAuthorizationClient()],
  });

  const spinner = yoctoSpinner({ text: "Starting device authorization..." });
  spinner.start();

  try {
    const { data, error } = await authClient.device.code({
      client_id: clientId,
      scope: "openid profile email",
    });
    spinner.stop();
    if (error || !data) {
      logger.error(
        `Failed to start device authorization: ${error?.error_description}`,
      );
      process.exit(1);
    }

    const {
      device_code,
      user_code,
      verification_uri,
      verification_uri_complete,
      expires_in,
      interval = 5,
    } = data;

    console.log(
      chalk.green("\n✔ Device authorization started successfully!\n"),
    );
    console.log(
      `Please visit ${chalk.underline.blue(
        verification_uri,
      )} to authorize the application.`,
    );
    console.log(`Your user code is: ${chalk.bold.yellow(user_code)}\n`);

    const openBrowser = await confirm({
      message: "Do you want to open the verification URL in your browser?",
      initialValue: true,
    });

    if (!isCancel(openBrowser) && openBrowser) {
      const urlToOpen = verification_uri || verification_uri_complete;
      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expire in ${Math.floor(expires_in / 60)} minutes)...`,
      ),
    );
  } catch (error) {}
}

// Commander setup

export const login = new Command("login")
  .description("Login to the AI Agent CLI")
  .option("--serverUrl <serverUrl>", "Authentication server URL", URL)
  .option("--clientId <clientId>", "OAuth Client ID", CLIENT_ID)
  .action(loginAction);
