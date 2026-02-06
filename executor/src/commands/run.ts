import { startExecutor } from "../executor/loop";
import { loadWallet } from "../storage/walletStore";

export async function runCmd() {
  const pk = await loadWallet();
  await startExecutor(pk);
}
