#!/usr/bin/env bun
/**
 * Stub sidecar binary for testing
 * This is a placeholder that simulates the real mup-server
 */

const PORT_ANNOUNCE_PREFIX = "MUX_SERVER_PORT:";

console.log(`${PORT_ANNOUNCE_PREFIX}3000`);
console.log("Mup server stub running on port 3000");

// Keep running
setInterval(() => {}, 1000);
