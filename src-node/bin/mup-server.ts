#!/usr/bin/env node
/**
 * Mup Server Sidecar Entry Point
 *
 * This is the entry point for the compiled sidecar binary that runs
 * alongside the Tauri desktop app. It:
 * 1. Initializes all backend services
 * 2. Starts the oRPC HTTP/WebSocket server
 * 3. Announces the port to stdout for Tauri to read
 * 4. Handles graceful shutdown
 */

import * as os from "os";
import * as path from "path";
import { parseArgs } from "util";
import { Config } from "@/node/config";
import { ServiceContainer } from "@/node/services/serviceContainer";
import { createOrpcServer } from "@/node/orpc/server";
import { log } from "@/node/services/log";
import { VERSION } from "@/version";

// Sentinel for port announcement (parsed by sidecar.rs)
const PORT_ANNOUNCE_PREFIX = "MUX_SERVER_PORT:";

interface ServerOptions {
  host: string;
  port: number;
  muxHome?: string;
}

function parseCommandLineArgs(): ServerOptions {
  const { values } = parseArgs({
    options: {
      host: {
        type: "string",
        short: "h",
        default: "127.0.0.1",
      },
      port: {
        type: "string",
        short: "p",
        default: "0", // 0 = random available port
      },
      "mux-home": {
        type: "string",
        short: "m",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  return {
    host: values.host ?? "127.0.0.1",
    port: parseInt(values.port ?? "0", 10) || 0,
    muxHome: values["mux-home"],
  };
}

function getMuxHome(customPath?: string): string {
  if (customPath) {
    return customPath;
  }

  // Check environment variable
  const envHome = process.env.MUX_HOME;
  if (envHome) {
    return envHome;
  }

  // Default to ~/.mux
  return path.join(os.homedir(), ".mux");
}

async function main(): Promise<void> {
  const options = parseCommandLineArgs();
  const muxHome = getMuxHome(options.muxHome);

  log.info(`Mux Server v${VERSION.version}`);
  log.info(`MUX_HOME: ${muxHome}`);

  // Initialize config
  const config = new Config(muxHome);

  // Create service container with all backend services
  log.info("Initializing services...");
  const container = new ServiceContainer(config);
  await container.initialize();

  // Create oRPC server
  log.info(`Starting oRPC server on ${options.host}:${options.port}...`);
  const server = await createOrpcServer({
    host: options.host,
    port: options.port,
    context: container.toORPCContext() as any,
    serveStatic: false, // Tauri serves frontend
  });

  // Announce port to stdout (parsed by sidecar.rs)
  // Must be the first non-log output on its own line
  console.log(`${PORT_ANNOUNCE_PREFIX}${server.port}`);

  log.info(`Server listening at ${server.baseUrl}`);
  log.info(`WebSocket at ${server.wsUrl}`);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    log.info(`Received ${signal}, shutting down...`);
    try {
      await server.close();
      await container.dispose();
      log.info("Server stopped");
      process.exit(0);
    } catch (error) {
      log.error("Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  // Windows doesn't send SIGINT/SIGTERM properly, handle close
  if (process.platform === "win32") {
    process.stdin.on("end", () => void shutdown("stdin end"));
  }

  log.info("Mup server ready");
}

// Run main
main().catch((error) => {
  log.error("Fatal error:", error);
  process.exit(1);
});
