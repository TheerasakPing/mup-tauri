#!/usr/bin/env bun
/**
 * Build script for mup-server sidecar binary
 * 
 * This script compiles the Node.js backend into a standalone executable
 * using Bun's compile feature. The output is placed in src-tauri/binaries/
 * with the correct naming convention for Tauri sidecar.
 * 
 * Usage:
 *   bun run scripts/build-sidecar.ts              # Build for current platform
 *   bun run scripts/build-sidecar.ts --target windows
 *   bun run scripts/build-sidecar.ts --target macos
 *   bun run scripts/build-sidecar.ts --target linux
 *   bun run scripts/build-sidecar.ts --target all
 */

import * as path from "path";
import * as fs from "fs";
import { parseArgs } from "util";
import { $ } from "bun";

const PROJECT_ROOT = import.meta.dir + "/..";
const BINARIES_DIR = path.join(PROJECT_ROOT, "src-tauri", "binaries");
const ENTRY_POINT = path.join(PROJECT_ROOT, "src-node", "bin", "mup-server.ts");

// Target triple mapping for Tauri sidecar naming
// Tauri automatically appends the target triple to the binary name
const TARGETS = {
  "windows-x64": {
    bunTarget: "bun-windows-x64",
    tauriTarget: "x86_64-pc-windows-msvc",
    outputName: "mup-server-x86_64-pc-windows-msvc.exe",
  },
  "windows-arm64": {
    bunTarget: "bun-windows-arm64",
    tauriTarget: "aarch64-pc-windows-msvc",
    outputName: "mup-server-aarch64-pc-windows-msvc.exe",
  },
  "macos-arm64": {
    bunTarget: "bun-darwin-arm64",
    tauriTarget: "aarch64-apple-darwin",
    outputName: "mup-server-aarch64-apple-darwin",
  },
  "macos-x64": {
    bunTarget: "bun-darwin-x64",
    tauriTarget: "x86_64-apple-darwin",
    outputName: "mup-server-x86_64-apple-darwin",
  },
  "linux-x64": {
    bunTarget: "bun-linux-x64",
    tauriTarget: "x86_64-unknown-linux-gnu",
    outputName: "mup-server-x86_64-unknown-linux-gnu",
  },
  "linux-arm64": {
    bunTarget: "bun-linux-arm64",
    tauriTarget: "aarch64-unknown-linux-gnu",
    outputName: "mup-server-aarch64-unknown-linux-gnu",
  },
};

function parseArgs_() {
  const { values } = parseArgs({
    options: {
      target: {
        type: "string",
        short: "t",
        default: "current",
      },
      "dry-run": {
        type: "boolean",
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  });

  return {
    target: values.target ?? "current",
    dryRun: values["dry-run"] ?? false,
  };
}

function getCurrentPlatform(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    return arch === "arm64" ? "windows-arm64" : "windows-x64";
  } else if (platform === "darwin") {
    return arch === "arm64" ? "macos-arm64" : "macos-x64";
  } else if (platform === "linux") {
    return arch === "arm64" ? "linux-arm64" : "linux-x64";
  }

  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

function getTargetsToBuild(targetArg: string): string[] {
  if (targetArg === "current") {
    return [getCurrentPlatform()];
  }

  if (targetArg === "all") {
    return Object.keys(TARGETS);
  }

  // Map shorthand names
  if (targetArg === "windows") {
    return ["windows-x64"];
  }
  if (targetArg === "macos") {
    return ["macos-arm64", "macos-x64"];
  }
  if (targetArg === "linux") {
    return ["linux-x64"];
  }

  // Validate target
  if (!TARGETS[targetArg as keyof typeof TARGETS]) {
    console.error(`Unknown target: ${targetArg}`);
    console.error(`Valid targets: ${Object.keys(TARGETS).join(", ")}, all, current`);
    process.exit(1);
  }

  return [targetArg];
}

async function buildTarget(target: string, dryRun: boolean): Promise<void> {
  const config = TARGETS[target as keyof typeof TARGETS];
  if (!config) {
    throw new Error(`Unknown target: ${target}`);
  }

  const outputPath = path.join(BINARIES_DIR, config.outputName);

  console.log(`\n📦 Building ${target}...`);
  console.log(`   Entry: ${ENTRY_POINT}`);
  console.log(`   Output: ${outputPath}`);

  if (dryRun) {
    console.log("   [DRY RUN] Skipping build");
    return;
  }

  // Ensure binaries directory exists
  if (!fs.existsSync(BINARIES_DIR)) {
    fs.mkdirSync(BINARIES_DIR, { recursive: true });
  }

  // Build with Bun
  // Note: bun build --compile creates a standalone executable
  const startTime = Date.now();

  try {
    // Use bun's compile feature
    const result = await $`bun build ${ENTRY_POINT} --compile --target=${config.bunTarget} --outfile=${outputPath}`.quiet();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (result.exitCode === 0) {
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ✅ Built in ${duration}s (${sizeMB} MB)`);
    } else {
      console.error(`   ❌ Build failed with exit code ${result.exitCode}`);
      console.error(result.stderr.toString());
      process.exit(1);
    }
  } catch (error) {
    console.error(`   ❌ Build error:`, error);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = parseArgs_();

  console.log("🚀 Mup Server Sidecar Builder");
  console.log("==============================");

  const targets = getTargetsToBuild(args.target);
  console.log(`\nTargets: ${targets.join(", ")}`);

  // Verify entry point exists
  if (!fs.existsSync(ENTRY_POINT)) {
    console.error(`\n❌ Entry point not found: ${ENTRY_POINT}`);
    process.exit(1);
  }

  // Build each target
  for (const target of targets) {
    await buildTarget(target, args.dryRun);
  }

  console.log("\n✨ Build complete!");
  console.log(`\nBinaries located in: ${BINARIES_DIR}`);
  console.log("\nNext steps:");
  console.log("  1. Run 'bun run tauri:build' to build the Tauri app");
  console.log("  2. The sidecar will be bundled automatically");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
