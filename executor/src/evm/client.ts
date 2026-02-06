import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { loadConfig } from "../storage/configStore.js";

export function getPublicClient() {
  const { rpcUrl } = loadConfig();

  return createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl, { timeout: 30_000 }),
  });
}

export function getWalletClient(privateKey: `0x${string}`) {
  const { rpcUrl } = loadConfig();
  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(rpcUrl, { timeout: 30_000 }),
  });
}
