#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, "../src/cli/main.ts");
const tsxLoader = pathToFileURL(
  join(__dirname, "../node_modules/tsx/dist/loader.mjs"),
).href;

const args = ["--import", tsxLoader, cliPath, ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  stdio: "inherit",
  cwd: join(__dirname, ".."),
});

child.on("exit", (code) => {
  process.exit(code || 0);
});
