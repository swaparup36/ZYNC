"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  Search,
} from "lucide-react";
import { NavigationHeader } from "@/components/navigation-header";
import { formatEther, parseEther, formatUnits, parseUnits, keccak256, toHex } from "viem";
import { SEPOLIA_ORACLE_SOURCES } from "@/lib/oracles";
import {
  getStrategiesInVault,
  getVaultETHBalance,
  getVaultExecutionBalance,
  depositETHOnVault,
  depositTokenOnVault,
  withdrawETHFromVault,
  rechargeVaultExecutionBalance,
  executeStrategyOnVault,
  pauseStrategyOnVault,
  waitForTx,
  approveERC20,
  getERC20Allowance,
  getVaultTokenBalance,
  canExecuteStrategy,
  simulateStrategy,
  allowActionOnVault,
  isActionAllowed,
} from "@/lib/transactionHandler";
import { toast } from "sonner";
const { readContract } = await import('wagmi/actions');
const { config } = await import('@/lib/wagmi');

interface Allowance {
  token: `0x${string}`;
  spender: `0x${string}`;
  amount: bigint;
}

interface Transfer {
  token: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
}

interface Strategy {
  id: bigint;
  conditions: Array<{
    oracle: `0x${string}`;
    operator: number;
    value: bigint;
  }>;
  action: {
    target: `0x${string}`;
    selector: `0x${string}`;
    amountIndex: number;
    isPayable: boolean;
    amountSource: number;
    value: bigint;
    data: `0x${string}`;
    allowances: Allowance[];
    transfers: Transfer[];
  };
  maxAmount: bigint;
  cooldown: bigint;
  expiry: bigint;
  lastExecution: bigint;
  paused: boolean;
  faliureCount: bigint;
  abi?: any[];
}

interface InsufficientToken {
  address: `0x${string}`;
  symbol: string;
  required: bigint;
  balance: bigint;
  decimals: number;
}

type DepositType = "ETH" | "ERC20";

function ManageVaultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vaultAddress = searchParams.get("vault") as `0x${string}` | null;
  const { address, isConnected } = useAccount();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [strategyABIs, setStrategyABIs] = useState<Record<string, any[]>>({});
  const [ethBalance, setEthBalance] = useState<bigint>(0n);
  const [executionBalance, setExecutionBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(
    null,
  );
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [depositType, setDepositType] = useState<DepositType>("ETH");
  const [depositAmount, setDepositAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [tokenDecimals, setTokenDecimals] = useState<number>(18);
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [loadingTokenInfo, setLoadingTokenInfo] = useState(false);
  const [checkTokenAddress, setCheckTokenAddress] = useState("");
  const [checkedTokenBalance, setCheckedTokenBalance] = useState<bigint | null>(null);
  const [checkedTokenDecimals, setCheckedTokenDecimals] = useState<number>(18);
  const [checkedTokenSymbol, setCheckedTokenSymbol] = useState<string>("");
  const [checkingBalance, setCheckingBalance] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [canExecute, setCanExecute] = useState<boolean>(false);
  const [hasCheckedExecution, setHasCheckedExecution] = useState(false);
  const [actionAllowed, setActionAllowed] = useState<boolean>(false);
  const [checkingActionAllowed, setCheckingActionAllowed] = useState(false);
  const [insufficientTokens, setInsufficientTokens] = useState<InsufficientToken[]>([]);
  const [checkingAllowances, setCheckingAllowances] = useState(false);

  useEffect(() => {
    if (vaultAddress && isConnected) {
      loadVaultData();
    }
  }, [vaultAddress, isConnected]);

  const loadVaultData = async () => {
    if (!vaultAddress) return;

    try {
      setLoading(true);
      const [strategiesData, ethBal, execBal] = await Promise.all([
        getStrategiesInVault(vaultAddress),
        getVaultETHBalance(vaultAddress),
        getVaultExecutionBalance(vaultAddress),
      ]);
      console.log("Loaded strategies:", strategiesData);

      setStrategies(strategiesData as Strategy[]);
      setEthBalance(ethBal);
      setExecutionBalance(execBal);

      // Fetch ABIs for all strategies
      const abiMap: Record<string, any[]> = {};
      for (const strategy of strategiesData as Strategy[]) {
        const strategyId = (strategiesData as Strategy[]).indexOf(strategy);
        try {
          const response = await fetch(
            `/api/strategy-abi?vaultAddress=${vaultAddress}&strategyId=${strategyId.toString()}`,
          );
          if (response.ok) {
            const data = await response.json();
            // console.log("data: ", data)
            abiMap[strategyId.toString()] = data.data.targetContractABI;
          }
        } catch (error) {
          console.error(`Failed to fetch ABI for strategy ${strategyId}:`, error);
        }
      }
      setStrategyABIs(abiMap);
    } catch (error: any) {
      console.error("Error loading vault data:", error);
      toast.error("Failed to load vault data");
    } finally {
      setLoading(false);
    }
  };

  const checkActionAllowed = async (strategy: Strategy) => {
    if (!strategy || !vaultAddress) return;

    try {
      setCheckingActionAllowed(true);
      const allowed = await isActionAllowed(
        vaultAddress,
        strategy.action.target,
        strategy.action.selector
      );
      setActionAllowed(allowed);
    } catch (error) {
      console.error("Error checking action allowed:", error);
      setActionAllowed(false);
    } finally {
      setCheckingActionAllowed(false);
    }
  };

  const checkAllowanceBalances = async (strategy: Strategy) => {
    if (!strategy || !vaultAddress) return;

    const allowances = strategy.action.allowances;
    if (!allowances || allowances.length === 0) {
      setInsufficientTokens([]);
      return;
    }

    try {
      setCheckingAllowances(true);
      const insufficient: InsufficientToken[] = [];

      for (const allowance of allowances) {
        try {
          // Get token balance, decimals, and symbol in parallel
          const [balance, decimals, symbol] = await Promise.all([
            getVaultTokenBalance(vaultAddress, allowance.token),
            (async () => {
              try {
                const result = await readContract(config, {
                  address: allowance.token,
                  abi: [{
                    name: 'decimals',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [],
                    outputs: [{ type: 'uint8' }],
                  }],
                  functionName: 'decimals',
                });
                return Number(result);
              } catch {
                return 18;
              }
            })(),
            (async () => {
              try {
                const result = await readContract(config, {
                  address: allowance.token,
                  abi: [{
                    name: 'symbol',
                    type: 'function',
                    stateMutability: 'view',
                    inputs: [],
                    outputs: [{ type: 'string' }],
                  }],
                  functionName: 'symbol',
                });
                return result as string;
              } catch {
                return allowance.token.slice(0, 6) + '...' + allowance.token.slice(-4);
              }
            })()
          ]);

          if (balance < allowance.amount) {
            insufficient.push({
              address: allowance.token,
              symbol,
              required: allowance.amount,
              balance,
              decimals,
            });
          }
        } catch (error) {
          console.error(`Error checking balance for token ${allowance.token}:`, error);
        }
      }

      setInsufficientTokens(insufficient);
    } catch (error) {
      console.error("Error checking allowance balances:", error);
    } finally {
      setCheckingAllowances(false);
    }
  };

  const handleAllowAction = async () => {
    if (!selectedStrategy || !vaultAddress) return;

    try {
      setProcessing(true);
      toast.info("Allowing action on vault...");
      const allowHash = await allowActionOnVault(
        selectedStrategy.action.target,
        selectedStrategy.action.selector,
        vaultAddress
      );
      await waitForTx(allowHash);
      toast.success("Action allowed!");
      setActionAllowed(true);
    } catch (error: any) {
      console.error("Error allowing action:", error);
      toast.error(error.message || "Failed to allow action");
    } finally {
      setProcessing(false);
    }
  };

  const checkCanExecute = async () => {
    if (!selectedStrategy || !vaultAddress) return;

    const strategyIndex = strategies.indexOf(selectedStrategy);
    if (strategyIndex === -1) {
      toast.error("Strategy not found in list");
      return;
    }
    
    const strategyId = BigInt(strategyIndex);
    console.log("Checking strategy execution for ID:", strategyId);

    try {
      setProcessing(true);
      const canExec = await canExecuteStrategy(
        vaultAddress,
        strategyId,
      );
      setCanExecute(canExec);
      setHasCheckedExecution(true);
      
      if (canExec) {
        toast.success("Strategy can be executed!");
      } else {
        toast.warning("Strategy cannot be executed yet (conditions not met or on cooldown)");
      }
    } catch (error) {
      console.error("Error checking strategy execution:", error);
      toast.error("Failed to check execution status");
      setCanExecute(false);
      setHasCheckedExecution(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleDepositETH = async () => {
    if (!vaultAddress || !depositAmount) return;

    try {
      setProcessing(true);
      const amount = parseEther(depositAmount);
      const hash = await depositETHOnVault(vaultAddress, amount);
      await waitForTx(hash);
      toast.success("ETH deposited successfully!");
      setDepositModalOpen(false);
      setDepositAmount("");
      await loadVaultData();
    } catch (error: any) {
      console.error("Error depositing ETH:", error);
      toast.error(error.message || "Failed to deposit ETH");
    } finally {
      setProcessing(false);
    }
  };

  const handleDepositERC20 = async () => {
    if (!vaultAddress || !depositAmount || !tokenAddress) return;

    try {
      setProcessing(true);
      
      const amount = parseUnits(depositAmount, tokenDecimals);

      // Check allownce and approve if needed
      const allowance = await getERC20Allowance(
        tokenAddress as `0x${string}`,
        address!,
        vaultAddress,
      );

      if (allowance < amount) {
        toast.info("Approving token...");
        const approveHash = await approveERC20(
          tokenAddress as `0x${string}`,
          vaultAddress,
          amount,
        );
        await waitForTx(approveHash);
        toast.success("Token approved!");
      }

      toast.info(`Depositing ${depositAmount} ${tokenSymbol || 'tokens'}...`);
      const hash = await depositTokenOnVault(
        vaultAddress,
        tokenAddress as `0x${string}`,
        amount,
      );
      await waitForTx(hash);
      toast.success("ERC20 token deposited successfully!");
      setDepositModalOpen(false);
      setDepositAmount("");
      setTokenAddress("");
      setTokenBalance(0n);
      setTokenDecimals(18);
      setTokenSymbol("");
      await loadVaultData();
    } catch (error: any) {
      console.error("Error depositing ERC20:", error);
      toast.error(error.message || "Failed to deposit ERC20 token");
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdrawETH = async () => {
    if (!vaultAddress || !withdrawAmount) return;

    try {
      setProcessing(true);
      const amount = parseEther(withdrawAmount);
      const hash = await withdrawETHFromVault(vaultAddress, amount);
      await waitForTx(hash);
      toast.success("ETH withdrawn successfully!");
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
      await loadVaultData();
    } catch (error: any) {
      console.error("Error withdrawing ETH:", error);
      toast.error(error.message || "Failed to withdraw ETH");
    } finally {
      setProcessing(false);
    }
  };

  const handleRecharge = async () => {
    if (!vaultAddress || !rechargeAmount) return;

    try {
      setProcessing(true);
      const amount = parseEther(rechargeAmount);
      const hash = await rechargeVaultExecutionBalance(vaultAddress, amount);
      await waitForTx(hash);
      toast.success("Execution fee recharged successfully!");
      setRechargeModalOpen(false);
      setRechargeAmount("");
      await loadVaultData();
    } catch (error: any) {
      console.error("Error recharging:", error);
      toast.error(error.message || "Failed to recharge execution fee");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckVaultTokenBalance = async () => {
    if (!vaultAddress || !checkTokenAddress) return;
    
    try {
      setCheckingBalance(true);
      
      // Fetch token decimals, symbol, and balance in parallel
      const [balance, decimals, symbol] = await Promise.all([
        getVaultTokenBalance(vaultAddress, checkTokenAddress as `0x${string}`),
        (async () => {
          try {
            const result = await readContract(config, {
              address: checkTokenAddress as `0x${string}`,
              abi: [{
                name: 'decimals',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'uint8' }],
              }],
              functionName: 'decimals',
            });
            return Number(result);
          } catch (error) {
            console.warn("Could not fetch token decimals, defaulting to 18:", error);
            return 18; // Default to 18 on failure
          }
        })(),
        (async () => {
          try {
            const { readContract } = await import('wagmi/actions');
            const { config } = await import('@/lib/wagmi');
            const result = await readContract(config, {
              address: checkTokenAddress as `0x${string}`,
              abi: [{
                name: 'symbol',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'string' }],
              }],
              functionName: 'symbol',
            });
            return result as string;
          } catch (error) {
            console.warn("Could not fetch token symbol:", error);
            return ""; // Empty string on failure
          }
        })()
      ]);
      
      setCheckedTokenBalance(balance);
      setCheckedTokenDecimals(decimals);
      setCheckedTokenSymbol(symbol);
      toast.success(`Token balance retrieved successfully`);
    } catch (error: any) {
      console.error("Error getting token balance:", error);
      toast.error("Failed to get token balance");
      setCheckedTokenBalance(null);
      setCheckedTokenDecimals(18);
      setCheckedTokenSymbol("");
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleExecuteStrategy = async () => {
    if (!selectedStrategy || !vaultAddress) return;

    const strategyIndex = strategies.indexOf(selectedStrategy);
    if (strategyIndex === -1) {
      toast.error("Strategy not found in list");
      return;
    }
    
    const strategyId = BigInt(strategyIndex);

    try {
      setProcessing(true);
      
      // Execute the strategy
      toast.info("Executing strategy...");
      const hash = await executeStrategyOnVault(
        vaultAddress,
        strategyId,
        selectedStrategy.action.isPayable
          ? selectedStrategy.action.value
          : undefined,
      );
      console.log("Hash of execution: ", hash);
      // await waitForTx(hash);
      toast.success("Strategy executed successfully!");
      setStrategyModalOpen(false);
      await loadVaultData();
    } catch (error: any) {
      console.error("Error executing strategy:", error);
      toast.error(error.message || "Failed to execute strategy");
    } finally {
      setProcessing(false);
    }
  };

  const handlePauseStrategy = async () => {
    if (!selectedStrategy || !vaultAddress) return;

    const strategyIndex = strategies.indexOf(selectedStrategy);
    if (strategyIndex === -1) {
      toast.error("Strategy not found in list");
      return;
    }
    
    const strategyId = BigInt(strategyIndex);

    try {
      setProcessing(true);
      const hash = await pauseStrategyOnVault(
        strategyId,
        vaultAddress,
      );
      await waitForTx(hash);
      toast.success("Strategy paused successfully!");
      setStrategyModalOpen(false);
      await loadVaultData();
    } catch (error: any) {
      console.error("Error pausing strategy:", error);
      toast.error(error.message || "Failed to pause strategy");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckTokenBalance = async () => {
    if (!vaultAddress || !tokenAddress) return;

    try {
      setLoadingTokenInfo(true);
      
      // Fetch token decimals, symbol, and balance in parallel
      const [balance, decimals, symbol] = await Promise.all([
        getVaultTokenBalance(vaultAddress, tokenAddress as `0x${string}`),
        (async () => {
          try {
            const { readContract } = await import('wagmi/actions');
            const { config } = await import('@/lib/wagmi');
            const result = await readContract(config, {
              address: tokenAddress as `0x${string}`,
              abi: [{
                name: 'decimals',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'uint8' }],
              }],
              functionName: 'decimals',
            });
            return Number(result);
          } catch (error) {
            console.warn("Could not fetch token decimals, defaulting to 18:", error);
            return 18;
          }
        })(),
        (async () => {
          try {
            const { readContract } = await import('wagmi/actions');
            const { config } = await import('@/lib/wagmi');
            const result = await readContract(config, {
              address: tokenAddress as `0x${string}`,
              abi: [{
                name: 'symbol',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'string' }],
              }],
              functionName: 'symbol',
            });
            return result as string;
          } catch (error) {
            console.warn("Could not fetch token symbol:", error);
            return "";
          }
        })()
      ]);
      
      setTokenBalance(balance);
      setTokenDecimals(decimals);
      setTokenSymbol(symbol);
      toast.success(`Token info loaded: ${symbol || 'Unknown'} (${decimals} decimals)`);
    } catch (error: any) {
      console.error("Error getting token info:", error);
      toast.error("Failed to get token info");
      setTokenDecimals(18);
      setTokenSymbol("");
    } finally {
      setLoadingTokenInfo(false);
    }
  };

  const getOperatorSymbol = (operator: number) => {
    switch (operator) {
      case 0:
        return "<";
      case 1:
        return ">";
      case 2:
        return "=";
      default:
        return "?";
    }
  };

  const formatOracleValue = (oracleAddress: string, value: bigint) => {
    const oracle = SEPOLIA_ORACLE_SOURCES.find(
      (o) => o.value.toLowerCase() === oracleAddress.toLowerCase(),
    );
    const decimals = oracle?.decimals || 18;
    return formatUnits(value, decimals);
  };

  const decodeParameterValue = (hexValue: string, paramType: string, paramName: string, fullCalldata?: string, offsetInCalldata?: number): string => {
    try {
      // Handle address type
      if (paramType === 'address') {
        const address = `0x${hexValue.slice(24)}`;
        return `${paramName}: ${address}`;
      }
      
      // Handle bool type
      if (paramType === 'bool') {
        const value = BigInt(`0x${hexValue}`) === 1n;
        return `${paramName}: ${value}`;
      }
      
      // Handle dynamic array types
      if (paramType.endsWith('[]') && fullCalldata) {
        const baseType = paramType.slice(0, -2); // Remove '[]'
        const offset = Number(BigInt(`0x${hexValue}`));
        
        const dataStart = offset * 2;
        
        if (dataStart < fullCalldata.length) {
          const lengthHex = fullCalldata.slice(dataStart, dataStart + 64);
          const arrayLength = Number(BigInt(`0x${lengthHex}`));
          
          if (arrayLength > 0 && arrayLength < 100) {
            const elements: string[] = [];
            for (let i = 0; i < arrayLength; i++) {
              const elementStart = dataStart + 64 + (i * 64);
              const elementHex = fullCalldata.slice(elementStart, elementStart + 64);
              
              if (baseType === 'address') {
                elements.push(`0x${elementHex.slice(24)}`);
              } else if (baseType.startsWith('uint') || baseType.startsWith('int')) {
                const num = BigInt(`0x${elementHex}`);
                elements.push(num.toLocaleString());
              } else {
                elements.push(`0x${elementHex}`);
              }
            }
            return `${paramName}: [${elements.join(', ')}]`;
          }
        }
        return `${paramName}: <${paramType} at offset ${offset}>`;
      }
      
      // Handle bytes types
      if (paramType.startsWith('bytes')) {
        if (paramType === 'bytes' && fullCalldata) {
          const offset = Number(BigInt(`0x${hexValue}`));
          const dataStart = offset * 2;
          
          if (dataStart < fullCalldata.length) {
            const lengthHex = fullCalldata.slice(dataStart, dataStart + 64);
            const bytesLength = Number(BigInt(`0x${lengthHex}`));
            
            if (bytesLength > 0 && bytesLength < 1000) {
              const bytesData = fullCalldata.slice(dataStart + 64, dataStart + 64 + bytesLength * 2);
              return `${paramName}: 0x${bytesData} (${bytesLength} bytes)`;
            }
          }
          return `${paramName}: <bytes at offset ${offset}>`;
        }
        
        const hex = `0x${hexValue}`;
  
        if (paramType.startsWith('bytes') && !paramType.includes('[')) {
          try {
            const decoded = new TextDecoder().decode(
              new Uint8Array(hexValue.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
            );
            if (/^[\x20-\x7E]*$/.test(decoded.replace(/\0/g, ''))) {
              return `${paramName}: "${decoded.replace(/\0/g, '')}" (${paramType})`;
            }
          } catch {}
        }
        return `${paramName}: ${hex} (${paramType})`;
      }
      
      if (paramType === 'string' && fullCalldata) {
        const offset = Number(BigInt(`0x${hexValue}`));
        const dataStart = offset * 2;
        
        if (dataStart < fullCalldata.length) {
          const lengthHex = fullCalldata.slice(dataStart, dataStart + 64);
          const stringLength = Number(BigInt(`0x${lengthHex}`));
          
          if (stringLength > 0 && stringLength < 1000) {
            const stringData = fullCalldata.slice(dataStart + 64, dataStart + 64 + stringLength * 2);
            try {
              const decoded = new TextDecoder().decode(
                new Uint8Array(stringData.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [])
              );
              return `${paramName}: "${decoded}"`;
            } catch {}
          }
        }
        return `${paramName}: <string at offset ${offset}>`;
      }
      
      // Handle uint/int types
      if (paramType.startsWith('uint') || paramType.startsWith('int')) {
        const num = BigInt(`0x${hexValue}`);
        
        if (num === 0n) {
          return `${paramName}: 0`;
        }
        
        // Format based on size
        if (num < 1000n) {
          return `${paramName}: ${num.toString()}`;
        } else if (num < 1000000n) {
          return `${paramName}: ${num.toLocaleString()}`;
        } else if (num < BigInt(1e15)) {
          // Likely a regular number, not wei
          return `${paramName}: ${num.toLocaleString()}`;
        } else {
          // Large number, show both raw and ETH equivalent
          const ethValue = formatEther(num);
          return `${paramName}: ${num.toString()} (${ethValue} ETH)`;
        }
      }
      
      // Handle fixed-size array types
      if (paramType.includes('[') && !paramType.includes('[]')) {
        return `${paramName}: 0x${hexValue} (${paramType})`;
      }
      
      // Default show as hex
      return `${paramName}: 0x${hexValue} (${paramType})`;
    } catch (error) {
      return `${paramName}: 0x${hexValue} (${paramType})`;
    }
  };

  const formatActionData = (data: `0x${string}`, abi?: any[], selector?: `0x${string}`) => {
    if (data === "0x" || data.length <= 10) return "No additional data";
    
    const functionSelector = selector || (data.slice(0, 10) as `0x${string}`);
    
    let functionName = functionSelector;
    let functionInputs: any[] = [];
    
    if (abi && abi.length > 0) {
      const funcDef = abi.find((item: any) => {
        if (item.type !== 'function') return false;
        
        const sig = `${item.name}(${item.inputs?.map((i: any) => i.type).join(',') || ''})`;
        const hash = keccak256(toHex(sig));
        const calculatedSelector = hash.slice(0, 10); // First 4 bytes
        return calculatedSelector.toLowerCase() === functionSelector.toLowerCase();
      });
      
      if (funcDef) {
        functionName = funcDef.name;
        functionInputs = funcDef.inputs || [];
      }
    }
    
    // Remove function selector
    const params = data.slice(10);
    if (params.length === 0) return `${functionName}()\nNo parameters`;

    // Format in chunks of 64 characters
    const chunks = [];
    for (let i = 0; i < params.length; i += 64) {
      chunks.push(params.slice(i, i + 64));
    }

    const numStaticParams = functionInputs.length || chunks.length;
    
    const formattedParams = [];
    for (let idx = 0; idx < numStaticParams && idx < chunks.length; idx++) {
      const chunk = chunks[idx];
      const input = functionInputs[idx];
      const paramName = input?.name || `param${idx}`;
      const paramType = input?.type || 'unknown';
      
      formattedParams.push(`  ${decodeParameterValue(chunk, paramType, paramName, params, idx * 32)}`);
    }

    return `${functionName}(\n${formattedParams.join(',\n')}\n)`;
  };

  const getOracleAnswerCurrency = (oracleAddress: string, value: bigint) => {
    const oracle = SEPOLIA_ORACLE_SOURCES.find(
      (o) => o.value.toLowerCase() === oracleAddress.toLowerCase(),
    );
    const answerCurrency = oracle?.answerCurrency;
    return answerCurrency ? ` ${answerCurrency}` : "";
  };

  const getOracleLabel = (oracleAddress: string, value: bigint) => {
    const oracle = SEPOLIA_ORACLE_SOURCES.find(
      (o) => o.value.toLowerCase() === oracleAddress.toLowerCase(),
    );
    const label = oracle?.label;
    return label ? ` ${label}` : "";
  };

  const getOracleCurrencyToBuy = (oracleAddress: string, value: bigint) => {
    const oracle = SEPOLIA_ORACLE_SOURCES.find(
      (o) => o.value.toLowerCase() === oracleAddress.toLowerCase(),
    );
    const currencyToBuy = oracle?.currencyToBuy;
    return currencyToBuy ? ` ${currencyToBuy}` : "";
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold mb-2">Connect Your Wallet</p>
            <p className="text-muted-foreground">
              Please connect your wallet to manage your vault
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vaultAddress) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <p className="text-xl font-semibold mb-2">No Vault Selected</p>
            <p className="text-muted-foreground">
              Please select a vault from the dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <NavigationHeader title="Manage Vault" backHref="/vault" />
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Manage Vault</h1>
          <p className="text-muted-foreground">
            Vault Address:{" "}
            <span className="font-mono text-sm">{vaultAddress}</span>
          </p>
        </div>
        <Button
          onClick={() => router.push(`/create-strategy?vault=${vaultAddress}`)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Strategy
        </Button>
      </div>

      {/* Vault Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ETH Balance
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              {formatEther(ethBalance)} ETH
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Execution Balance
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              {formatEther(executionBalance)} ETH
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Strategies
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">
              {strategies.filter((s) => !s.paused && BigInt(Math.floor(Date.now() / 1000)) < s.expiry).length}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Vault Actions</CardTitle>
          <CardDescription>
            Manage your vault funds and execution fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setDepositModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ArrowDownRight className="mr-2 h-4 w-4" />
              Deposit
            </Button>
            <Button
              onClick={() => setWithdrawModalOpen(true)}
              variant="outline"
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Withdraw ETH
            </Button>
            <Button
              onClick={() => setRechargeModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Zap className="mr-2 h-4 w-4" />
              Recharge Execution Fee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Token Balance Checker */}
      <Card>
        <CardHeader>
          <CardTitle>Check Token Balance</CardTitle>
          <CardDescription>
            Enter any ERC20 token address to check its balance in your vault
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="0x... (Token Contract Address)"
              value={checkTokenAddress}
              onChange={(e) => setCheckTokenAddress(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCheckVaultTokenBalance}
              disabled={!checkTokenAddress || checkingBalance}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {checkingBalance ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Check Balance
                </>
              )}
            </Button>
          </div>
          
          {checkedTokenBalance !== null && (
            <div className="border border-border rounded-lg p-4 bg-accent/5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token Address:</span>
                  <span className="text-sm font-mono">{checkTokenAddress.slice(0, 6)}...{checkTokenAddress.slice(-4)}</span>
                </div>
                {checkedTokenSymbol && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Symbol:</span>
                    <span className="text-sm font-semibold">{checkedTokenSymbol}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Decimals:</span>
                  <span className="text-sm font-mono">{checkedTokenDecimals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatUnits(checkedTokenBalance, checkedTokenDecimals)} {checkedTokenSymbol || 'tokens'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategies List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Strategies</CardTitle>
          <CardDescription>
            Click on any strategy to view details and manage execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : strategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-lg font-semibold mb-1">No Strategies Yet</p>
              <p className="text-muted-foreground text-sm">
                Create your first automated strategy to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {strategies.map((strategy, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedStrategy(strategy);
                    setHasCheckedExecution(false);
                    setCanExecute(false);
                    setActionAllowed(false);
                    setInsufficientTokens([]);
                    setStrategyModalOpen(true);
                    checkActionAllowed(strategy);
                    checkAllowanceBalances(strategy);
                  }}
                  className="border border-border rounded-lg p-4 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">
                          STRATEGY #{index}
                        </span>
                        {strategy.paused ? (
                          <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                            PAUSED
                          </span>
                        ) : BigInt(Math.floor(Date.now() / 1000)) < strategy.expiry ? (
                          <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded">
                            EXPIRED
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Conditions: {strategy.conditions.length} condition(s)
                        </p>
                        {strategy.conditions.map((cond, idx) => (
                          <p
                            key={idx}
                            className="text-xs text-muted-foreground font-mono"
                          >
                            Oracle - {getOracleLabel(cond.oracle, cond.value)} -{" "}
                            1 {getOracleCurrencyToBuy(cond.oracle, cond.value)}{" "}
                            {getOperatorSymbol(cond.operator)}{" "}
                            {formatOracleValue(cond.oracle, cond.value)}{" "}
                            {getOracleAnswerCurrency(cond.oracle, cond.value)}
                          </p>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          Target: {strategy.action.target.slice(0, 10)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Selector: {strategy.action.selector}
                        </p>
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground font-semibold">
                            Calldata:
                          </p>
                          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-all bg-muted/30 rounded p-2 mt-1">
                            {formatActionData(strategy.action.data, strategyABIs[index.toString()], strategy.action.selector)}
                          </pre>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Max Amount: {strategy.maxAmount} Wei
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStrategy(strategy);
                          setHasCheckedExecution(false);
                          setCanExecute(false);
                          setActionAllowed(false);
                          setInsufficientTokens([]);
                          setStrategyModalOpen(true);
                          checkActionAllowed(strategy);
                          checkAllowanceBalances(strategy);
                        }}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deposit Modal */}
      <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
            <DialogDescription>
              Deposit ETH or ERC20 tokens to your vault
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={depositType === "ETH" ? "default" : "outline"}
                onClick={() => setDepositType("ETH")}
                className="flex-1"
              >
                ETH
              </Button>
              <Button
                variant={depositType === "ERC20" ? "default" : "outline"}
                onClick={() => setDepositType("ERC20")}
                className="flex-1"
              >
                ERC20
              </Button>
            </div>

            {depositType === "ERC20" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Token Address</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0x..."
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCheckTokenBalance}
                    disabled={!tokenAddress || loadingTokenInfo}
                  >
                    {loadingTokenInfo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load Token"
                    )}
                  </Button>
                </div>
                {tokenSymbol && (
                  <div className="border border-border rounded-lg p-3 bg-accent/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Symbol:</span>
                      <span className="text-xs font-semibold">{tokenSymbol}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Decimals:</span>
                      <span className="text-xs font-mono">{tokenDecimals}</span>
                    </div>
                    {tokenBalance > 0n && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Vault Balance:</span>
                        <span className="text-xs font-semibold text-green-600">
                          {formatUnits(tokenBalance, tokenDecimals)} {tokenSymbol}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(depositType === "ETH" || tokenSymbol) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Amount ({depositType === "ETH" ? "ETH" : (tokenSymbol || "Tokens")})
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                {depositType === "ERC20" && depositAmount && tokenSymbol && (
                  <p className="text-xs text-muted-foreground">
                    Raw amount: {parseUnits(depositAmount || "0", tokenDecimals).toString()} (smallest unit)
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDepositModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  depositType === "ETH" ? handleDepositETH : handleDepositERC20
                }
                disabled={
                  processing ||
                  !depositAmount ||
                  (depositType === "ERC20" && (!tokenAddress || !tokenSymbol))
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Deposit"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw ETH</DialogTitle>
            <DialogDescription>
              Withdraw ETH from your vault to your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (ETH)</label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {formatEther(ethBalance)} ETH
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setWithdrawModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleWithdrawETH}
                disabled={processing || !withdrawAmount}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Withdraw"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recharge Modal */}
      <Dialog open={rechargeModalOpen} onOpenChange={setRechargeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recharge Execution Fee</DialogTitle>
            <DialogDescription>
              Add ETH to your vault's execution balance for strategy executions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (ETH)</label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.0"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Current execution balance: {formatEther(executionBalance)} ETH
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setRechargeModalOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecharge}
                disabled={processing || !rechargeAmount}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Recharge"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Strategy Details Modal */}
      <Dialog open={strategyModalOpen} onOpenChange={setStrategyModalOpen}>
        <DialogContent className="w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Strategy Details</DialogTitle>
            <DialogDescription>
              Execute or pause this strategy
            </DialogDescription>
          </DialogHeader>

          {selectedStrategy && (
            <div className="space-y-4">
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded">
                    STRATEGY #{strategies.indexOf(selectedStrategy)}
                  </span>
                  {selectedStrategy.paused ? (
                    <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                      PAUSED
                    </span>
                  ) : BigInt(Math.floor(Date.now() / 1000)) < selectedStrategy.expiry ? (
                    <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded">
                      EXPIRED
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-semibold text-accent">Conditions:</p>
                    {selectedStrategy.conditions.map((cond, idx) => (
                      <p
                        key={idx}
                        className="text-muted-foreground font-mono text-xs"
                      >
                        • Oracle {getOperatorSymbol(cond.operator)}{" "}
                        {formatOracleValue(cond.oracle, cond.value)}
                      </p>
                    ))}
                  </div>

                  <div>
                    <p className="font-semibold text-accent">Action:</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      Target: {selectedStrategy.action.target}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      Selector: {selectedStrategy.action.selector}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Payable:{" "}
                      {selectedStrategy.action.isPayable ? "Yes" : "No"}
                    </p>
                    <div className="mt-2">
                      <p className="font-semibold text-accent text-xs mb-1">
                        Calldata:
                      </p>
                      <div className="bg-muted/50 rounded p-2 max-h-32 overflow-y-auto overflow-x-auto">
                        <pre className="text-muted-foreground font-mono text-[10px] whitespace-pre-wrap break-all max-w-full">
                          {formatActionData(selectedStrategy.action.data, strategyABIs[strategies.indexOf(selectedStrategy)], selectedStrategy.action.selector)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-accent">
                      Safety Controls:
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Max Amount: {selectedStrategy.maxAmount} Wei
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Cooldown: {selectedStrategy.cooldown.toString()} seconds
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Expiry:{" "}
                      {new Date(
                        Number(selectedStrategy.expiry) * 1000,
                      ).toLocaleString()}
                    </p>
                  </div>

                  {/* Token Allowances Check */}
                  {checkingAllowances ? (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-600/10 px-3 py-2 rounded">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs font-medium">
                        Checking token balances...
                      </span>
                    </div>
                  ) : insufficientTokens.length > 0 ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-red-500 text-xs">
                        Insufficient Token Balances:
                      </p>
                      {insufficientTokens.map((token, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-red-600 bg-red-600/10 px-3 py-2 rounded"
                        >
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs font-medium">
                            Insufficient {token.symbol}: Need {formatUnits(token.required, token.decimals)}, Have {formatUnits(token.balance, token.decimals)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : selectedStrategy.action.allowances?.length > 0 ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-600/10 px-3 py-2 rounded">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        All required token balances are sufficient
                      </span>
                    </div>
                  ) : null}

                  {hasCheckedExecution && (
                    canExecute ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-600/10 px-3 py-2 rounded">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Ready to execute
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600 bg-orange-600/10 px-3 py-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Cannot execute (conditions not met or on cooldown)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStrategyModalOpen(false)}
                  disabled={processing}
                >
                  Close
                </Button>
                {!selectedStrategy.paused && !actionAllowed && !checkingActionAllowed && (
                  <Button
                    onClick={handleAllowAction}
                    disabled={processing}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Allowing...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Allow Action
                      </>
                    )}
                  </Button>
                )}
                {!selectedStrategy.paused && checkingActionAllowed && (
                  <Button
                    disabled
                    className="bg-blue-600 text-white"
                  >
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </Button>
                )}
                {!selectedStrategy.paused && actionAllowed && !hasCheckedExecution && !checkingActionAllowed && (
                  <Button
                    onClick={checkCanExecute}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Check Can Execute
                      </>
                    )}
                  </Button>
                )}
                {/* {!selectedStrategy.paused && actionAllowed && !checkingActionAllowed && (
                  <Button
                    onClick={async () => {
                      const strategyIndex = strategies.indexOf(selectedStrategy);
                      if (strategyIndex === -1) {
                        toast.error("Strategy not found");
                        return;
                      }
                      try {
                        setProcessing(true);
                        toast.info("Simulating strategy...");
                        await simulateStrategy(vaultAddress!, BigInt(strategyIndex));
                        toast.success("Simulation passed! Strategy can be executed.");
                      } catch (error: any) {
                        console.error("Simulation failed:", error);
                        toast.error(error.message || "Simulation failed - conditions not met");
                      } finally {
                        setProcessing(false);
                      }
                    }}
                    disabled={processing}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Simulating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Simulate
                      </>
                    )}
                  </Button>
                )} */}
                {!selectedStrategy.paused && hasCheckedExecution && canExecute && (
                  <Button
                    onClick={handleExecuteStrategy}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Execute Strategy
                      </>
                    )}
                  </Button>
                )}
                {BigInt(Math.floor(Date.now() / 1000)) < selectedStrategy.expiry && !selectedStrategy.paused && (
                  <Button
                    onClick={handlePauseStrategy}
                    disabled={processing}
                    variant="destructive"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Pausing...
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Strategy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}

export default function ManageVaultPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ManageVaultContent />
    </Suspense>
  );
}
