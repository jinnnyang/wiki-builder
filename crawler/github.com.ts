import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import getStoragePath from "../utils/common/getStoragePath";

/**
 * GitHub Documentation Management Tool
 * 
 * Usage:
 * tsx crawler/github.com.ts init <user/repo | url> [path]
 * tsx crawler/github.com.ts add <user/repo> <paths...>
 * tsx crawler/github.com.ts remove <user/repo> <paths...>
 * tsx crawler/github.com.ts update <user/repo>
 */

function runGit(args: string[], cwd?: string) {
  const command = `git ${args.join(" ")}`;
  console.log(`> ${command} (in ${cwd || "."})`);
  try {
    return execSync(command, { cwd, stdio: "inherit" });
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    process.exit(1);
  }
}

function parseRepoInfo(input: string): { user: string; repo: string; path?: string } {
  // Handle URL: https://github.com/user/repo/path/to/docs
  if (input.startsWith("http")) {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      console.error("Invalid GitHub URL");
      process.exit(1);
    }
    return {
      user: parts[0],
      repo: parts[1],
      path: parts.slice(2).join("/") || undefined,
    };
  }

  // Handle user/repo
  const parts = input.split("/");
  if (parts.length < 2) {
    console.error("Invalid repo format. Use user/repo or a full URL.");
    process.exit(1);
  }
  return {
    user: parts[0],
    repo: parts[1],
  };
}

function getRepoDir(user: string, repo: string) {
  return getStoragePath(path.join("github.com", user, repo));
}

async function init(repoInput: string, initialPath?: string) {
  const info = parseRepoInfo(repoInput);
  const targetPath = initialPath || info.path || ".";
  const repoDir = getRepoDir(info.user, info.repo);

  if (fs.existsSync(repoDir)) {
    console.error(`Directory already exists: ${repoDir}`);
    process.exit(1);
  }

  const repoUrl = `https://github.com/${info.user}/${info.repo}.git`;
  
  // 1. Clone with specific flags
  // --depth 1: shallow clone
  // --no-checkout: don't pull files yet
  // --filter=blob:none: blobless clone (saves space)
  console.log(`Initializing ${info.user}/${info.repo}...`);
  fs.mkdirSync(path.dirname(repoDir), { recursive: true });
  runGit(["clone", "--depth", "1", "--no-checkout", "--filter=blob:none", repoUrl, repoDir]);

  // 2. Sparse-checkout init
  runGit(["sparse-checkout", "init", "--cone"], repoDir);

  // 3. Set path
  runGit(["sparse-checkout", "set", targetPath], repoDir);

  // 4. Checkout
  runGit(["checkout"], repoDir);

  console.log(`\nSuccessfully initialized ${info.user}/${info.repo} at ${repoDir}`);
}

async function add(repoName: string, paths: string[]) {
  const info = parseRepoInfo(repoName);
  const repoDir = getRepoDir(info.user, info.repo);

  if (!fs.existsSync(repoDir)) {
    console.error(`Repository not initialized: ${repoName}`);
    process.exit(1);
  }

  runGit(["sparse-checkout", "add", ...paths], repoDir);
  console.log(`\nAdded paths to ${repoName}: ${paths.join(", ")}`);
}

async function remove(repoName: string, pathsToRemove: string[]) {
  const info = parseRepoInfo(repoName);
  const repoDir = getRepoDir(info.user, info.repo);

  if (!fs.existsSync(repoDir)) {
    console.error(`Repository not initialized: ${repoName}`);
    process.exit(1);
  }

  // Git sparse-checkout doesn't have a direct 'remove' command.
  // We need to list, filter, and re-set.
  const currentPathsOutput = execSync("git sparse-checkout list", { cwd: repoDir }).toString();
  const currentPaths = currentPathsOutput.split("\n").map(p => p.trim()).filter(Boolean);
  
  const newPaths = currentPaths.filter(p => !pathsToRemove.includes(p));

  if (newPaths.length === currentPaths.length) {
    console.log("No paths removed (not found in current list).");
    return;
  }

  runGit(["sparse-checkout", "set", ...newPaths], repoDir);
  console.log(`\nRemoved paths from ${repoName}: ${pathsToRemove.join(", ")}`);
}

async function update(repoName: string) {
  const info = parseRepoInfo(repoName);
  const repoDir = getRepoDir(info.user, info.repo);

  if (!fs.existsSync(repoDir)) {
    console.error(`Repository not initialized: ${repoName}`);
    process.exit(1);
  }

  runGit(["pull"], repoDir);
  console.log(`\nUpdated ${repoName}`);
}

const [,, subcommand, ...args] = process.argv;

(async () => {
  switch (subcommand) {
    case "init":
      if (args.length < 1) {
        console.log("Usage: init <user/repo | url> [path]");
        process.exit(1);
      }
      await init(args[0], args[1]);
      break;
    case "add":
      if (args.length < 2) {
        console.log("Usage: add <user/repo> <paths...>");
        process.exit(1);
      }
      await add(args[0], args.slice(1));
      break;
    case "remove":
      if (args.length < 2) {
        console.log("Usage: remove <user/repo> <paths...>");
        process.exit(1);
      }
      await remove(args[0], args.slice(1));
      break;
    case "update":
      if (args.length < 1) {
        console.log("Usage: update <user/repo>");
        process.exit(1);
      }
      await update(args[0]);
      break;
    default:
      console.log("GitHub Documentation Management Tool");
      console.log("\nCommands:");
      console.log("  init <user/repo | url> [path]   Initialize a repo with sparse-checkout");
      console.log("  add <user/repo> <paths...>      Add directories to sparse-checkout");
      console.log("  remove <user/repo> <paths...>   Remove directories from sparse-checkout");
      console.log("  update <user/repo>              Update repository content");
      break;
  }
})();
