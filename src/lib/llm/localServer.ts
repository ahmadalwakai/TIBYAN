/**
 * Local LLM Server Manager
 * ========================
 * Optional auto-start for llama-server in development mode.
 * 
 * DEVELOPMENT ONLY - Do not use in production.
 */

import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import { getLLMConfig } from "./config";
import { waitForLLMHealth } from "./health";

// ============================================
// Types
// ============================================

export interface ServerStartResult {
  success: boolean;
  pid?: number;
  error?: string;
  logs: string[];
}

// ============================================
// Server Process Management
// ============================================

let serverProcess: ChildProcess | null = null;
const serverLogs: string[] = [];
const MAX_LOGS = 100;

function addLog(message: string): void {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  serverLogs.push(logEntry);
  
  // Keep only last MAX_LOGS entries
  if (serverLogs.length > MAX_LOGS) {
    serverLogs.shift();
  }
  
  console.log(`[LLM Server] ${message}`);
}

/**
 * Get accumulated server logs
 */
export function getServerLogs(): string[] {
  return [...serverLogs];
}

/**
 * Check if server process is running
 */
export function isServerRunning(): boolean {
  return serverProcess !== null && !serverProcess.killed;
}

/**
 * Stop the server process
 */
export function stopServer(): void {
  if (serverProcess && !serverProcess.killed) {
    addLog("Stopping server process...");
    serverProcess.kill("SIGTERM");
    serverProcess = null;
  }
}

// ============================================
// Auto-Start Logic
// ============================================

/**
 * Attempt to start llama-server automatically.
 * Only works in development mode with AUTO_START_LLM=true.
 */
export async function startLocalServer(): Promise<ServerStartResult> {
  // Safety checks
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "Auto-start disabled in production",
      logs: [],
    };
  }

  const config = getLLMConfig();
  
  if (!config.autoStart) {
    return {
      success: false,
      error: "AUTO_START_LLM is not enabled",
      logs: [],
    };
  }

  if (isServerRunning()) {
    return {
      success: true,
      pid: serverProcess?.pid,
      logs: getServerLogs(),
    };
  }

  // Find llama-server executable
  const serverPaths = [
    process.env.LLAMA_SERVER_PATH,
    "c:\\tibyan\\AI Agent\\llama.cpp\\build\\bin\\llama-server.exe",
    "./llama-server",
    "llama-server",
  ].filter(Boolean) as string[];

  let serverPath: string | null = null;
  for (const path of serverPaths) {
    if (existsSync(path)) {
      serverPath = path;
      break;
    }
  }

  if (!serverPath) {
    return {
      success: false,
      error: "llama-server executable not found. Set LLAMA_SERVER_PATH env variable.",
      logs: [],
    };
  }

  // Find model
  if (!config.modelPath || !existsSync(config.modelPath)) {
    return {
      success: false,
      error: `Model not found: ${config.modelPath}. Set LLM_MODEL_PATH env variable.`,
      logs: [],
    };
  }

  addLog(`Starting server: ${serverPath}`);
  addLog(`Model: ${config.modelPath}`);

  // Build arguments (conservative defaults)
  const args = [
    "-m", config.modelPath,
    "--host", "127.0.0.1",
    "--port", "8080",
    "-c", String(config.contextSize),
  ];

  // Add GPU layers only if explicitly set
  if (config.nGpuLayers > 0) {
    args.push("-ngl", String(config.nGpuLayers));
  }

  addLog(`Arguments: ${args.join(" ")}`);

  try {
    serverProcess = spawn(serverPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    // Capture stdout
    serverProcess.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach(line => addLog(`[stdout] ${line}`));
    });

    // Capture stderr
    serverProcess.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach(line => addLog(`[stderr] ${line}`));
    });

    // Handle process exit
    serverProcess.on("exit", (code, signal) => {
      addLog(`Process exited with code ${code}, signal ${signal}`);
      serverProcess = null;
    });

    serverProcess.on("error", (err) => {
      addLog(`Process error: ${err.message}`);
      serverProcess = null;
    });

    // Wait for health check
    addLog("Waiting for server to become healthy...");
    const health = await waitForLLMHealth(10); // 10 retries

    if (health.available) {
      addLog(`✓ Server started successfully (PID: ${serverProcess?.pid})`);
      return {
        success: true,
        pid: serverProcess?.pid,
        logs: getServerLogs(),
      };
    } else {
      addLog(`✗ Server failed health check: ${health.error}`);
      stopServer();
      return {
        success: false,
        error: `Server started but health check failed: ${health.error}`,
        logs: getServerLogs(),
      };
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    addLog(`✗ Failed to start server: ${errorMessage}`);
    
    return {
      success: false,
      error: errorMessage,
      logs: getServerLogs(),
    };
  }
}

// ============================================
// Cleanup on Process Exit
// ============================================

if (typeof process !== "undefined") {
  process.on("exit", stopServer);
  process.on("SIGINT", () => {
    stopServer();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    stopServer();
    process.exit(0);
  });
}
