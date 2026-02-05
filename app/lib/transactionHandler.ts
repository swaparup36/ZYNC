import { writeContract, waitForTransactionReceipt, readContract, getBalance, sendTransaction } from 'wagmi/actions'
import { config } from './wagmi'
import { ERC20_ABI, OracleInterfaceABI, strategyVaultABI, strategyVaultFactoryABI } from '@/abi/abi'
import { decodeEventLog, encodeFunctionData } from 'viem/utils';
import { Log } from 'viem';
import { StrategyAction, StrategyCondition } from '@/types/types'

export const STRATEGY_VAULT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_STRATEGY_VAULT_FACTORY_ADDRESS as `0x${string}`;

if (!STRATEGY_VAULT_FACTORY_ADDRESS) {
  throw new Error('NEXT_PUBLIC_STRATEGY_VAULT_FACTORY_ADDRESS environment variable is not set');
}

export async function waitForTx(hash: `0x${string}`) {
  return waitForTransactionReceipt(config, { hash })
}

export async function decodeEventLogAndReturn(event: Log<bigint, number, false>) {
  // Try decoding with vault ABI first (for StrategyCreated event)
  try {
    const decoded = decodeEventLog({
      abi: strategyVaultABI,
      data: event.data,
      topics: event.topics,
    });
    return decoded;
  } catch (error) {
    // If that fails, try with factory ABI (for VaultCreated event)
    const decoded = decodeEventLog({
      abi: strategyVaultFactoryABI,
      data: event.data,
      topics: event.topics,
    });
    return decoded;
  }
}

export async function createVault() {
  return writeContract(config, {
    address: STRATEGY_VAULT_FACTORY_ADDRESS,
    abi: strategyVaultFactoryABI,
    functionName: 'createVault',
    args: [],
  })
}

export async function getUserVaults(userAddress: `0x${string}`) {
    return readContract(config, {
      address: STRATEGY_VAULT_FACTORY_ADDRESS,
      abi: strategyVaultFactoryABI,
      functionName: 'getUserVaults',
      args: [userAddress],
    }) as Promise<`0x${string}`[]>
}

export async function getERC20Allowance(tokenAddress: `0x${string}`, owner: `0x${string}`, spender: `0x${string}`) {
    try {
      const allowance = await readContract(config, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [owner, spender],
      });

      return BigInt(allowance as bigint);
    } catch (error: any) {
      console.error('Error checking ERC20 allowance:', error);
      // If the contract doesn't support allowance, treat as 0
      if (error.message?.includes('returned no data') || error.message?.includes('does not have the function')) {
        throw new Error(
          `The address ${tokenAddress} is not a valid ERC20 token contract. ` +
          'Please verify the token address and ensure you are connected to the correct network.'
        );
      }
      throw error;
    }
}

export async function approveERC20(tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) {
    try {
      const hash = await writeContract(config, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender, amount],
      });

      return hash;
    } catch (error: any) {
      console.error('Error approving ERC20:', error);
      if (error.message?.includes('returned no data') || error.message?.includes('does not have the function')) {
        throw new Error(
          `The address ${tokenAddress} is not a valid ERC20 token contract. ` +
          'Please verify the token address and ensure you are connected to the correct network.'
        );
      }
      throw error;
    }
}

export async function createStrategy(
  vaultAddress: `0x${string}`, 
  conditions: StrategyCondition[], 
  action: StrategyAction, 
  maxAmount: bigint, 
  cooldown: bigint, 
  expiry: bigint
) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'createStrategy',
      args: [conditions, action, maxAmount, cooldown, expiry],
      gas: 5000000n, // Set reasonable gas limit (5M gas)
    });

    return hash;
}

export async function canExecuteStrategy(vaultAddress: `0x${string}`, strategyId: bigint): Promise<boolean> {
    const canExecute = await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'canExecute',
      args: [strategyId],
    });

    return canExecute as boolean;
}

export async function simulateStrategy(vaultAddress: `0x${string}`, strategyId: bigint): Promise<void> {
    await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'simulateStrategy',
      args: [strategyId],
    });
}

export async function isActionAllowed(vaultAddress: `0x${string}`, target: `0x${string}`, selector: `0x${string}`) {
    const isAllowed = await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'isActionAllowed',
      args: [target, selector],
    });

    return isAllowed as boolean;
}

export async function allowActionOnVault(target: `0x${string}`, selector: `0x${string}`, vaultAddress: `0x${string}`) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'allowAction',
      args: [target, selector],
    });

    return hash;
}

export async function disallowActionOnVault(target: `0x${string}`, selector: `0x${string}`, vaultAddress: `0x${string}`) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'disallowAction',
      args: [target, selector],
    });

    return hash;
}

export async function pauseStrategyOnVault(strategyId: bigint, vaultAddress: `0x${string}`) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'pauseStrategy',
      args: [strategyId],
    });

    return hash;
}

export async function executeStrategyOnVault(
  vaultAddress: `0x${string}`,
  strategyId: bigint,
  value?: bigint
) {
  const data = encodeFunctionData({
    abi: strategyVaultABI,
    functionName: 'executeStrategy',
    args: [strategyId],
  })

  const hash = await sendTransaction(config, {
    to: vaultAddress,
    data,
    gas: 15_000_000n,
    ...(value !== undefined ? { value } : {}),
  })

  return hash
}

export async function waitForExecuteStrategyTx(hash: `0x${string}`, vault: `0x${string}`, strategyId: bigint) {
  setTimeout(async () => {
    const strategy = await readContract(config,{
      address: vault,
      abi: strategyVaultABI,
      functionName: 'getStrategy',
      args: [strategyId],
    })
    console.log(strategy)
  }, 10_000)
}

export async function depositETHOnVault(vaultAddress: `0x${string}`, amount: bigint) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'depositETH',
      args: [],
      value: amount,
    });

    return hash;
}

export async function depositTokenOnVault(vaultAddress: `0x${string}`, tokenAddress: `0x${string}`, amount: bigint) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'depositToken',
      args: [tokenAddress, amount],
      gas: 500000n, // Set reasonable gas limit for token deposit
    });

    return hash;
}

export async function withdrawETHFromVault(vaultAddress: `0x${string}`, amount: bigint) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'withdrawETH',
      args: [amount],
    });

    return hash;
}

export async function rechargeVaultExecutionBalance(vaultAddress: `0x${string}`, amount: bigint) {
    const hash = await writeContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'recharge',
      args: [],
      value: amount,
    });

    return hash;
}

export async function getVaultExecutionBalance(vaultAddress: `0x${string}`) {
    const balance = await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'executionBalance',
      args: [],
    });

    return BigInt(balance as bigint);
}

export async function getStrategiesInVault(vaultAddress: `0x${string}`) {
    const strategies = await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'getStrategies',
      args: [],
    });

    return strategies;
}

export async function getVaultOwner(vaultAddress: `0x${string}`) {
    const owner = await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'owner',
      args: [],
    });

    return owner as `0x${string}`;
}

export async function getVaultTokenBalance(vaultAddress: `0x${string}`, tokenAddress: `0x${string}`) {
    const balance = await readContract(config, {
      address: vaultAddress,
      abi: strategyVaultABI,
      functionName: 'tokenBalance',
      args: [tokenAddress],
    });

    return BigInt(balance as bigint);
}

export async function getVaultETHBalance(vaultAddress: `0x${string}`) {
    const Totalbalance = await getBalance(config, {
      address: vaultAddress,
    });

    const executionBalance = await getVaultExecutionBalance(vaultAddress);

    Totalbalance.value -= executionBalance;

    return Totalbalance.value;
}

/**
 * Verify if an address is a valid ERC20 token contract by trying to call a view function
 * Returns true if the token contract exists and responds, false otherwise
 */
export async function isValidERC20Token(tokenAddress: `0x${string}`): Promise<boolean> {
  try {
    // Try to call a simple view function like symbol() or decimals()
    // If the contract exists and is an ERC20, this should succeed
    await readContract(config, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
      args: [],
    });
    return true;
  } catch (error: any) {
    console.warn(`Token validation failed for ${tokenAddress}:`, error.message);
    return false;
  }
}

/**
 * Get ERC20 token symbol
 */
export async function getERC20Symbol(tokenAddress: `0x${string}`): Promise<string | null> {
  try {
    const symbol = await readContract(config, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'symbol',
      args: [],
    });
    return symbol as string;
  } catch {
    return null;
  }
}
