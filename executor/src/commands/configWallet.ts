import { saveWallet } from "../storage/walletStore";

export async function configWalletCmd(options: { privateKey: `0x${string}` }) {
  await saveWallet(options.privateKey);
}
