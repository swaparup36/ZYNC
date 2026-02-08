"use client";

import {
  encodeFunctionData,
  keccak256,
  toBytes,
  type Hex,
} from "viem";
import { StrategyAction, StrategyAmountSource, Allowance, Transfer } from "@/types/types";
import { UNISWAP_V2_ROUTER_ABI } from "@/abi/abi";

export const UNISWAP_V2_ROUTER_ADDRESS = "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3" as const;

export const SEPOLIA_TOKENS = {
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as `0x${string}`,
  USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06" as `0x${string}`,
} as const;

export const TOKEN_LIST: TokenInfo[] = [
  {
    address: SEPOLIA_TOKENS.WETH,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
  },
  {
    address: SEPOLIA_TOKENS.USDT,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  }
];

export interface TokenInfo {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}

export interface UniswapSwapParams {
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  amountIn: bigint;
  amountOutMin: bigint;
  recipient: `0x${string}`;
  deadline?: bigint;
}

export type PrebuiltActionType = "uniswap-swap";

const SWAP_EXACT_TOKENS_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "amountOutMin", type: "uint256" },
      { internalType: "address[]", name: "path", type: "address[]" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [
      { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function getSwapSelector(): `0x${string}` {
  const signature = "swapExactTokensForTokens(uint256,uint256,address[],address,uint256)";
  const hash = keccak256(toBytes(signature));
  return `0x${hash.slice(2, 10)}` as `0x${string}`;
}

export function buildV2RouterSwapAction(
  params: UniswapSwapParams,
): StrategyAction {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    amountOutMin,
    recipient,
    deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 24 * 60 * 60),
  } = params;

  const path: `0x${string}`[] = [tokenIn, tokenOut];

  const data = encodeFunctionData({
    abi: SWAP_EXACT_TOKENS_ABI,
    functionName: "swapExactTokensForTokens",
    args: [amountIn, amountOutMin, path, recipient, deadline],
  });

  console.log('[Uniswap V2 Swap Debug]', {
    amountIn: amountIn.toString(),
    amountOutMin: amountOutMin.toString(),
    path,
    recipient,
    deadline: deadline.toString(),
  });

  const selector = `0x${data.slice(2, 10)}` as `0x${string}`;

  console.log('[Uniswap V2 Action Debug]', {
    extractedSelector: selector,
    fullDataLength: data.length,
  });

  const allowances: Allowance[] = [
    {
      token: tokenIn,
      spender: UNISWAP_V2_ROUTER_ADDRESS,
      amount: amountIn,
    },
  ];

  const transfers: Transfer[] = [];

  return {
    target: UNISWAP_V2_ROUTER_ADDRESS,
    selector,
    amountIndex: 0,
    isPayable: false,
    amountSource: StrategyAmountSource.NONE,
    value: BigInt(0),
    data,
    allowances,
    transfers,
    abi: [...UNISWAP_V2_ROUTER_ABI],
    selectedFunction: "swapExactTokensForTokens",
    functionArgs: {
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountOutMin: amountOutMin.toString(),
      deadline: deadline.toString(),
    },
  };
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount || amount === "") return BigInt(0);

  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const combined = whole + paddedFraction;

  return BigInt(combined);
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const str = amount.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, -decimals) || "0";
  const fraction = str.slice(-decimals);

  const trimmedFraction = fraction.replace(/0+$/, "");

  return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
}

export function getTokenByAddress(
  address: `0x${string}`,
): TokenInfo | undefined {
  return TOKEN_LIST.find(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );
}

export function isKnownToken(address: `0x${string}`): boolean {
  return TOKEN_LIST.some(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  );
}
