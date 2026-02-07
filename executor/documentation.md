# Zync Executor

A CLI tool for executing automated strategies on Zync vaults. The executor monitors deployed vaults and executes eligible strategies based on their configured triggers.

## Overview

The Zync Executor is a keeper service that:

1. **Scans** the StrategyVaultFactory for all deployed vaults
2. **Checks** each vault's strategies to determine if they can be executed
3. **Executes** eligible strategies automatically
4. **Caches** execution state to prevent duplicate transactions

## Installation

```bash
npm install -g zync-executor
```

## Configuration

Before running the executor, you must configure:

### 1. RPC URL

Set the RPC endpoint for blockchain connectivity:

```bash
zync-executor config-rpc --url <RPC_URL>
```

The RPC URL is stored in `~/.zync/config.json`.

### 2. Wallet

Configure the executor wallet with a private key:

```bash
zync-executor config-wallet --private-key <PRIVATE_KEY>
```

The wallet is encrypted with a password and stored securely in `~/.zync-executor/wallet.json`.

> **Security**: The private key is encrypted using AES-256-CBC with a password-derived key (scrypt). You will be prompted to enter a password when saving and loading the wallet.

## Commands

| Command | Description |
|---------|-------------|
| `config-rpc --url <URL>` | Configure the RPC endpoint URL |
| `config-wallet --private-key <PK>` | Configure and encrypt the executor wallet |
| `rpc-url` | Display the configured RPC URL |
| `wallet` | Display the executor wallet address |
| `run` | Start the executor keeper loop |

### Global Options

| Option | Description |
|--------|-------------|
| `--debug` | Enable debug logging |
| `--version` | Show version number |
| `--help` | Show help |

## Usage

### Starting the Executor

```bash
# With default logging
zync-executor run

# With debug output
zync-executor --debug run
```

### Viewing Configuration

```bash
# Show configured RPC URL
zync-executor rpc-url

# Show wallet address
zync-executor wallet
```

## Storage Locations

| File | Location | Purpose |
|------|----------|---------|
| RPC Config | `~/.zync/config.json` | RPC URL storage |
| Wallet | `~/.zync-executor/wallet.json` | Encrypted private key |

## Error Handling

The executor handles errors gracefully:
- **Network errors**: Logged and retried on next cycle
- **Contract errors**: Individual strategy failures don't stop other strategies
- **Wallet errors**: Clear error messages with recovery instructions
- **Shutdown signals**: Clean shutdown on SIGINT/SIGTERM

## Development

### Building

```bash
npm build    # Compile TypeScript to dist/
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `commander` | CLI framework |
| `viem` | Ethereum client library |
| `chalk` | Colored terminal output |
| `ora` | Terminal spinners |
| `dotenv` | Environment variable loading |

## Network

Currently configured for **Sepolia testnet**. To change networks, modify the chain configuration in `src/evm/client.ts`.
