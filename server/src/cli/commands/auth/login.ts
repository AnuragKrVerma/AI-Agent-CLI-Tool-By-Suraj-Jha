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
import { prisma } from "../../../lib/prisma.js";
import {
  clearStoredToken,
  getStoredToken,
  isTokenExpired,
  storeToken,
} from "../../../lib/token.js";

dotenv.config();

const URL = process.env.BACKEND_URL || "http://localhost:3005";
const CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";

export const CONFIG_DIR = path.join(os.homedir(), ".scrappy-ai");
export const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

export async function loginAction() {
  const options = z
    .object({
      serverUrl: z.string().optional(),
      clientId: z.string().optional(),
    })
    .parse({});

  const clientId = options.clientId || CLIENT_ID;
  const serverUrl = options.serverUrl || URL;

  // TOKEN MANAGEMENT

  intro(chalk.bold("🔐 Auth CLI Login"));

  // TODO: Change this with token management utils
  const existingToken = await getStoredToken();
  const expired = await isTokenExpired();

  if (existingToken && !expired) {
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
      const urlToOpen = verification_uri_complete || verification_uri;
      await open(urlToOpen);
    }

    console.log(
      chalk.gray(
        `Waiting for authorization (expire in ${Math.floor(expires_in / 60)} minutes)...`,
      ),
    );

    const token = await pollForToken(
      authClient,
      device_code,
      clientId,
      interval,
    );

    if (token) {
      const saved = await storeToken(token);
      if (!saved) {
        logger.error("Failed to store the token.");
        console.log(
          chalk.yellow("\n Warning: Could not save authentication token"),
        );
        console.log(chalk.yellow("You may need to login again on next use.\n"));
      }
    }

    // TODO: get the user data

    outro(chalk.green("🎉 Login successful! You are now authenticated.\n"));

    console.log(chalk.gray(`\n Token saved to: ${TOKEN_FILE}\n`));

    console.log(
      chalk.gray("You can now use AI commands without logging in again"),
    );
  } catch (error) {
    spinner.stop();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error during device authorization: ${errorMessage}`);
    process.exit(1);
  }
}

async function pollForToken(
  authClient: any,
  device_code: string,
  clientId: string,
  initialInterval: number,
) {
  let pollingInterval = initialInterval;
  const spinner = yoctoSpinner({ text: "", color: "cyan" });
  let dots = 0;

  return new Promise((resolve, reject) => {
    const poll = async () => {
      dots = (dots + 1) % 4;
      spinner.text = chalk.gray(
        `Polling for authorization ${".".repeat(dots)}${" ".repeat(3 - dots)}`,
      );

      if (!spinner.isSpinning) spinner.start();

      try {
        const { data, error } = await authClient.device.token({
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          device_code: device_code,
          client_id: clientId,
          fetchOptions: {
            headers: {
              "user-agent": `My CLI`,
            },
          },
        });

        if (data?.access_token) {
          // TODO: need to hide it after development cause its not good practice to show tokens in console
          console.log(
            chalk.bold.yellow(`Your access token is: ${data.access_token}`),
          );
          spinner.stop();
          resolve(data.access_token);
          return;
        } else if (error) {
          switch (error.error) {
            case "authorization_pending":
              // Continue polling
              break;
            case "slow_down":
              pollingInterval += 5;
              break;
            case "access_denied":
              console.error("Access was denied by the user");
              return;
            case "expired_token":
              console.error("The device code has expired. Please try again.");
              return;
            default:
              spinner.stop();
              logger.error(`Error: ${error.error_description}`);

              process.exit(1);
          }
        }
      } catch (error) {
        spinner.stop();
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error(`Network Error: ${errorMessage}`);
        process.exit(1);
      }
      setTimeout(poll, pollingInterval * 1000);
    };
    setTimeout(poll, pollingInterval * 1000);
  });
}

export async function logoutAction() {
  intro(chalk.bold("🔐 Auth CLI Logout"));

  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.red("You are not logged in."));
    outro();
    process.exit(0);
  }
  const shouldLogout = await confirm({
    message: "Are you sure you want to log out?",
    initialValue: false,
  });

  if (isCancel(shouldLogout) || !shouldLogout) {
    cancel("Logout cancelled.");
    process.exit(0);
  }
  const cleared = await clearStoredToken();
  if (cleared) {
    outro(chalk.green("🎉 You have been logged out successfully.\n"));
  } else {
    console.log(chalk.red("Failed to log out. Please try again."));
  }
}

export async function whoamiAction() {
  intro(chalk.bold("🔐 Auth CLI WhoAmI"));
  const token = await getStoredToken();
  if (!token) {
    console.log(chalk.red("You are not logged in."));
    outro();
    process.exit(0);
  }

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
      email: true,
      name: true,
      image: true,
    },
  });
  if (!user) {
    console.log(chalk.red("User not found."));
    outro();
    process.exit(1);
  }
  console.log(chalk.green("You are logged in as:\n"));
  console.log(`ID: ${chalk.bold.blue(user.id)}`);
  console.log(`Name: ${chalk.bold.blue(user.name)}`);
  console.log(`Email: ${chalk.bold.blue(user.email)}`);
  outro();
}

// Commander setup

export const login = new Command("login")
  .description("Login to the AI Agent CLI")
  .option("--serverUrl <serverUrl>", "Authentication server URL", URL)
  .option("--clientId <clientId>", "OAuth Client ID", CLIENT_ID)
  .action(loginAction);

export const logout = new Command("logout")
  .description("Logout from the AI Agent CLI")
  .action(logoutAction);

export const whoami = new Command("whoami")
  .description("Display the currently logged in user")
  .option("--serverUrl <serverUrl>", "Authentication server URL", URL)
  .action(whoamiAction);