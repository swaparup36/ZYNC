import { getPublicClient, getWalletClient } from "../evm/client";
import { strategyVaultABI } from "../evm/abi";
import { logger } from "../utils/logger";
import { strategyCanExecCache, strategyCountCache, strategyIdCache } from "../cache/cache";

export async function processVault(
  vault: `0x${string}`,
  privateKey: `0x${string}`
) {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient(privateKey);

  // Check cache for strategy count
  let count = strategyCountCache.get(vault);
  
  if (count === undefined) {
    const fetchedCount = await publicClient.readContract({
      address: vault,
      abi: strategyVaultABI,
      functionName: "getStrategieCount",
    }) as bigint;
    
    count = Number(fetchedCount);
    strategyCountCache.set(vault, count);
  }

  for (let i = 0; i < count; i++) {
    const strategyKey = `${vault}-${i}`;
    
    // Skip recently executed strategies
    if (strategyIdCache.has(strategyKey)) {
      logger.info(`Strategy ${i} on ${vault} was recently executed, skipping`);
      continue;
    }

    let canExec = strategyCanExecCache.get(strategyKey);
    if (canExec === undefined) {
      const result = await publicClient.readContract({
        address: vault,
        abi: strategyVaultABI,
        functionName: "canExecute",
        args: [BigInt(i)],
      }) as boolean;
      canExec = result ? "true" : "false";
      strategyCanExecCache.set(strategyKey, canExec);
    }

    logger.debug(`Strategy ${i} on ${vault} canExecute: ${canExec}`);
    if (canExec !== "true") {
      logger.info(`Strategy ${i} on ${vault} not ready`);
      continue;
    }

    logger.info(`Executing strategy ${i} on ${vault}`);

    // Mark as pending BEFORE sending tx to prevent duplicate executions
    strategyIdCache.set(strategyKey, "pending");
    strategyCanExecCache.delete(strategyKey);

    try {
      const hash = await walletClient.writeContract({
        address: vault,
        abi: strategyVaultABI,
        functionName: "executeStrategy",
        args: [BigInt(i)],
      });

      strategyIdCache.set(strategyKey, hash);
      logger.info(`Tx sent: ${hash}`);
    } catch (err) {
      // Remove from cache on failure so it can be retried
      strategyIdCache.delete(strategyKey);
      logger.error(`Failed to execute strategy ${i} on ${vault}: ${String(err)}`);
    }
  }
}
