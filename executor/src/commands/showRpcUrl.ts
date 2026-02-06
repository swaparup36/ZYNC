import { loadConfig } from "../storage/configStore";
import { logger } from "../utils/logger";

export function showRpcUrlCmd() {
  try {
    const config = loadConfig();
    logger.info(`RPC URL: ${config.rpcUrl}`);
  } catch {
    logger.error("RPC URL not configured. Run: zync-executor config-rpc --url <RPC_URL>");
  }
}
