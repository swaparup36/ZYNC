"use client";

import {
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toBytes,
  concat,
  pad,
  numberToHex,
} from "viem";
import { StrategyAction, StrategyAmountSource, Allowance } from "@/types/types";

// Uniswap Universal Router on Sepolia
export const UNIVERSAL_ROUTER_ADDRESS =
  "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD" as const;

// Common token addresses on Sepolia
export const SEPOLIA_TOKENS = {
  WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" as `0x${string}`,
  USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06" as `0x${string}`,
  DAI: "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6" as `0x${string}`,
  UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" as `0x${string}`,
  LINK: "0x779877A7B0D9E8603169DdbD7836e478b4624789" as `0x${string}`,
} as const;

// Token list with metadata
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
  },
  {
    address: SEPOLIA_TOKENS.DAI,
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
  },
  { address: SEPOLIA_TOKENS.UNI, symbol: "UNI", name: "Uniswap", decimals: 18 },
  {
    address: SEPOLIA_TOKENS.LINK,
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
  },
];

// Universal Router Commands
export const UNIVERSAL_ROUTER_COMMANDS = {
  V3_SWAP_EXACT_IN: 0x00,
  V3_SWAP_EXACT_OUT: 0x01,
  PERMIT2_TRANSFER_FROM: 0x02,
  PERMIT2_PERMIT_BATCH: 0x03,
  SWEEP: 0x04,
  TRANSFER: 0x05,
  PAY_PORTION: 0x06,
  V2_SWAP_EXACT_IN: 0x08,
  V2_SWAP_EXACT_OUT: 0x09,
  PERMIT2_PERMIT: 0x0a,
  WRAP_ETH: 0x0b,
  UNWRAP_WETH: 0x0c,
} as const;

// Universal Router ABI (partial - only execute function)
export const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "permit2", type: "address" },
          { internalType: "address", name: "weth9", type: "address" },
          { internalType: "address", name: "seaportV1_5", type: "address" },
          { internalType: "address", name: "seaportV1_4", type: "address" },
          { internalType: "address", name: "openseaConduit", type: "address" },
          { internalType: "address", name: "nftxZap", type: "address" },
          { internalType: "address", name: "x2y2", type: "address" },
          { internalType: "address", name: "foundation", type: "address" },
          { internalType: "address", name: "sudoswap", type: "address" },
          { internalType: "address", name: "elementMarket", type: "address" },
          { internalType: "address", name: "nft20Zap", type: "address" },
          { internalType: "address", name: "cryptopunks", type: "address" },
          { internalType: "address", name: "looksRareV2", type: "address" },
          {
            internalType: "address",
            name: "routerRewardsDistributor",
            type: "address",
          },
          {
            internalType: "address",
            name: "looksRareRewardsDistributor",
            type: "address",
          },
          { internalType: "address", name: "looksRareToken", type: "address" },
          { internalType: "address", name: "v2Factory", type: "address" },
          { internalType: "address", name: "v3Factory", type: "address" },
          {
            internalType: "bytes32",
            name: "pairInitCodeHash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "poolInitCodeHash",
            type: "bytes32",
          },
        ],
        internalType: "struct RouterParameters",
        name: "params",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "BalanceTooLow", type: "error" },
  { inputs: [], name: "BuyPunkFailed", type: "error" },
  { inputs: [], name: "ContractLocked", type: "error" },
  { inputs: [], name: "ETHNotAccepted", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "commandIndex", type: "uint256" },
      { internalType: "bytes", name: "message", type: "bytes" },
    ],
    name: "ExecutionFailed",
    type: "error",
  },
  { inputs: [], name: "FromAddressIsNotOwner", type: "error" },
  { inputs: [], name: "InsufficientETH", type: "error" },
  { inputs: [], name: "InsufficientToken", type: "error" },
  { inputs: [], name: "InvalidBips", type: "error" },
  {
    inputs: [{ internalType: "uint256", name: "commandType", type: "uint256" }],
    name: "InvalidCommandType",
    type: "error",
  },
  { inputs: [], name: "InvalidOwnerERC1155", type: "error" },
  { inputs: [], name: "InvalidOwnerERC721", type: "error" },
  { inputs: [], name: "InvalidPath", type: "error" },
  { inputs: [], name: "InvalidReserves", type: "error" },
  { inputs: [], name: "InvalidSpender", type: "error" },
  { inputs: [], name: "LengthMismatch", type: "error" },
  { inputs: [], name: "SliceOutOfBounds", type: "error" },
  { inputs: [], name: "TransactionDeadlinePassed", type: "error" },
  { inputs: [], name: "UnableToClaim", type: "error" },
  { inputs: [], name: "UnsafeCast", type: "error" },
  { inputs: [], name: "V2InvalidPath", type: "error" },
  { inputs: [], name: "V2TooLittleReceived", type: "error" },
  { inputs: [], name: "V2TooMuchRequested", type: "error" },
  { inputs: [], name: "V3InvalidAmountOut", type: "error" },
  { inputs: [], name: "V3InvalidCaller", type: "error" },
  { inputs: [], name: "V3InvalidSwap", type: "error" },
  { inputs: [], name: "V3TooLittleReceived", type: "error" },
  { inputs: [], name: "V3TooMuchRequested", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RewardsSent",
    type: "event",
  },
  {
    inputs: [{ internalType: "bytes", name: "looksRareClaim", type: "bytes" }],
    name: "collectRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC1155BatchReceived",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC1155Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "bytes", name: "", type: "bytes" },
    ],
    name: "onERC721Received",
    outputs: [{ internalType: "bytes4", name: "", type: "bytes4" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes4", name: "interfaceId", type: "bytes4" }],
    name: "supportsInterface",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "int256", name: "amount0Delta", type: "int256" },
      { internalType: "int256", name: "amount1Delta", type: "int256" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "uniswapV3SwapCallback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { stateMutability: "payable", type: "receive" },
] as const;

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
  slippageBps: number;
  recipient: `0x${string}`;
  deadline?: bigint;
  fee?: number;
}

export type PrebuiltActionType = "uniswap-swap";


export function calculateAmountOutMin(
  amountIn: bigint,
  slippageBps: number,
): bigint {
  const slippageMultiplier = BigInt(10000 - slippageBps);
  return (amountIn * slippageMultiplier) / BigInt(10000);
}

export function encodePath(
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  fee: number = 3000,
): `0x${string}` {
  const tokenInHex = tokenIn.slice(2).toLowerCase();
  const tokenOutHex = tokenOut.slice(2).toLowerCase();

  const feeHex = fee.toString(16).padStart(6, "0");

  return `0x${tokenInHex}${feeHex}${tokenOutHex}` as `0x${string}`;
}

export function encodeV3SwapExactIn(
  recipient: `0x${string}`,
  amountIn: bigint,
  amountOutMin: bigint,
  path: `0x${string}`,
  payerIsUser: boolean = true,
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters("address, uint256, uint256, bytes, bool"),
    [recipient, amountIn, amountOutMin, path, payerIsUser],
  );
}

export function encodeUniversalRouterExecute(
  commands: `0x${string}`,
  inputs: `0x${string}`[],
  deadline?: bigint,
): `0x${string}` {
  if (deadline !== undefined) {
    return encodeFunctionData({
      abi: UNIVERSAL_ROUTER_ABI,
      functionName: "execute",
      args: [commands, inputs, deadline],
    });
  }

  return encodeFunctionData({
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: "execute",
    args: [commands, inputs],
  });
}

export function getExecuteSelector(): `0x${string}` {
  const signature = "execute(bytes,bytes[],uint256)";
  const hash = keccak256(toBytes(signature));
  return `0x${hash.slice(2, 10)}` as `0x${string}`;
}

export function buildUniversalRouterSwapAction(
  params: UniswapSwapParams,
): StrategyAction {
  const {
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps,
    recipient,
    deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60),
    fee = 3000,
  } = params;

  const amountOutMin = calculateAmountOutMin(amountIn, slippageBps);

  const path = encodePath(tokenIn, tokenOut, fee);

  const swapInput = encodeV3SwapExactIn(
    recipient,
    amountIn,
    amountOutMin,
    path,
    true,
  );

  const commands =
    `0x${UNIVERSAL_ROUTER_COMMANDS.V3_SWAP_EXACT_IN.toString(16).padStart(2, "0")}` as `0x${string}`;

  const data = encodeUniversalRouterExecute(commands, [swapInput], deadline);

  const selector = getExecuteSelector();

  const allowances: Allowance[] = [
    {
      token: tokenIn,
      spender: UNIVERSAL_ROUTER_ADDRESS,
      amount: amountIn,
    },
  ];

  return {
    target: UNIVERSAL_ROUTER_ADDRESS,
    selector,
    amountIndex: 0,
    isPayable: false,
    amountSource: StrategyAmountSource.NONE,
    value: BigInt(0),
    data,
    allowances,
    abi: [...UNIVERSAL_ROUTER_ABI],
    selectedFunction: "execute",
    functionArgs: {
      tokenIn,
      tokenOut,
      amountIn: amountIn.toString(),
      amountOutMin: amountOutMin.toString(),
      slippageBps: slippageBps.toString(),
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
