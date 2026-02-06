import { saveConfig } from "../storage/configStore.js";
import { logger } from "../utils/logger.js";

export async function configRpcCmd(options: { url: string }) {
  saveConfig({ rpcUrl: options.url });
  logger.success("RPC URL saved successfully.");
}
