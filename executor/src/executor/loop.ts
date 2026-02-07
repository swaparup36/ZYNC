import { getAllVaults } from "./vaultScanner";
import { processVault } from "./strategyExecutor";
import { privateKeyToAccount } from "viem/accounts";
import { logger } from "../utils/logger";
import { sleepWithJitter } from "../utils/sleep";

const FACTORY = "0xA22d214517f244FD93F36834eB85a8a15F1f8F92" as `0x${string}`;
const INTERVAL = 15_000;

export async function startExecutor(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey);

  logger.info(`Starting Zync executor`);
  logger.info(`Executor wallet: ${account.address}`);
  logger.info(`Polling interval: ${INTERVAL / 1000}s`);

  const abortController = new AbortController();

  process.on("SIGINT", () => {
    logger.warn("Received SIGINT. Stopping executor...");
    abortController.abort();
  });

  process.on("SIGTERM", () => {
    logger.warn("Received SIGTERM. Stopping executor...");
    abortController.abort();
  });

  while (!abortController.signal.aborted) {
    try {
      logger.debug(`Fetching all vaults from factory ${FACTORY}...`);
      const vaults = await getAllVaults(FACTORY);
      logger.debug(`Fetched ${vaults.length} vault(s)`);

      if (vaults.length === 0) {
        logger.debug("No vaults found.");
      } else {
        logger.info(`Found ${vaults.length} vault(s)`);

        await Promise.allSettled(
          vaults.map((vault) => processVault(vault, privateKey))
        );
      }
    } catch (err) {
      logger.error(`Executor loop error: ${String(err)}`);
    }

    try {
      await sleepWithJitter(INTERVAL, 0.2, abortController.signal);
    } catch {
      break;
    }
  }

  logger.info("Executor stopped cleanly.");
}
