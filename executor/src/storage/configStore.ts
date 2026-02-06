import fs from "fs";
import os from "os";
import path from "path";

export interface ZyncConfig {
  rpcUrl: string;
}

const DIR = path.join(os.homedir(), ".zync");
const FILE = path.join(DIR, "config.json");

function ensureDir() {
  if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
  }
}

export function saveConfig(config: ZyncConfig) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(config, null, 2));
}

export function loadConfig(): ZyncConfig {
  if (!fs.existsSync(FILE)) {
    throw new Error(
      "RPC not configured. Run: zync-cli config-rpc --url <RPC_URL>"
    );
  }

  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
