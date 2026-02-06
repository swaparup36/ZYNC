import { privateKeyToAccount } from "viem/accounts";
import { loadWallet } from "../storage/walletStore";
import { logger } from "../utils/logger";

export async function showWalletCmd() {
  try {
    const privateKey = await loadWallet();
    const account = privateKeyToAccount(privateKey);
    logger.info(`Wallet Address: ${account.address}`);
  } catch (err) {
    if (err instanceof Error && err.message.includes("Wallet not configured")) {
      logger.error("Wallet not configured. Run: zync-executor config-wallet --private-key <pk>");
    } else {
      logger.error(err instanceof Error ? err.message : "Failed to load wallet");
    }
  }
}
