import { getPublicClient } from "../evm/client";
import { strategyVaultFactoryABI } from "../evm/abi";

export async function getAllVaults(
  factoryAddress: `0x${string}`
): Promise<`0x${string}`[]> {
  const client = getPublicClient();

  const vaults = await client.readContract({
    address: factoryAddress,
    abi: strategyVaultFactoryABI,
    functionName: "getAllVaults",
  });

  return vaults as `0x${string}`[];
}
