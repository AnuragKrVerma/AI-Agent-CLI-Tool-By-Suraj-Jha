import fs, { access } from "fs/promises";
import { CONFIG_DIR, TOKEN_FILE } from "../cli/commands/auth/login.js";
import chalk from "chalk";

export async function getStoredToken() {
  try {
    const data = await fs.readFile(TOKEN_FILE, "utf-8");
    const token = JSON.parse(data);
    return token;
  } catch (error) {
    return null;
  }
}

export async function storeToken(token: any) {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });

    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_type: token.token_type,
      scope: token.scope,
      expires_at: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : null,
      created_at: new Date().toISOString(),
    };
    await fs.writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error(chalk.red("Error storing token:"), error);
    return false;
  }
}

export async function clearStoredToken() {
  try {
    await fs.unlink(TOKEN_FILE);
    console.log(chalk.green("Token cleared successfully."));
    return true;
  } catch (error) {
    console.error(chalk.red("Error clearing token:"), error);
    return false;
  }
}
export async function isTokenExpired() {
  const token = await getStoredToken();
  if (!token || !token.expires_at) {
    return true;
  }

  const expiresAt = new Date(token.expires_at);
  const now = new Date();
  // 5 minutes buffer
  return expiresAt.getDate() - now.getTime() < 5 * 60 * 1000;
}

export async function requireAuth() {
  const token = await getStoredToken();

  if (!token) {
    console.log(chalk.red("No stored token found. Please login first."));
    process.exit(1);
  }

  if (await isTokenExpired()) {
    console.log(chalk.yellow("Stored token is expired. Please login again."));
    console.log(chalk.gray("Run: your-cli login \n"));
    process.exit(1);
  }
}
