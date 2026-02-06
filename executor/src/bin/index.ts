#!/usr/bin/env node
import { Command } from "commander";
import { configWalletCmd } from "../commands/configWallet";
import { configRpcCmd } from "../commands/configRpc";
import { runCmd } from "../commands/run";
import { showRpcUrlCmd } from "../commands/showRpcUrl";
import { showWalletCmd } from "../commands/showWallet";
import { setDebug } from "../utils/logger";

const program = new Command();

program
  .name("zync-executor")
  .description("Zync strategy executor CLI")
  .version("1.0.0")
  .option("--debug", "Enable debug logging");

program.hook("preAction", (thisCommand) => {
  const opts = thisCommand.opts();
  if (opts.debug) {
    setDebug(true);
  }
});

program
  .command("config-wallet")
  .description("Configure executor wallet private key")
  .requiredOption("--private-key <pk>", "Private key of executor wallet")
  .action(configWalletCmd);

program
  .command("config-rpc")
  .description("Set custom RPC URL for blockchain connection")
  .requiredOption("--url <rpcUrl>", "RPC endpoint URL")
  .action(configRpcCmd);

program
  .command("run")
  .description("Start the Zync executor keeper loop")
  .action(runCmd);

program
  .command("rpc-url")
  .description("Show configured RPC URL")
  .action(showRpcUrlCmd);

program
  .command("wallet")
  .description("Show wallet public address")
  .action(showWalletCmd);

program.parseAsync(process.argv);
