export enum StrategyOperator {
  LT,
  GT,
  EQ
}

export enum StrategyAmountSource {
  CALLDATA,
  MSG_VALUE,
  NONE
}

export interface StrategyCondition {
  oracle: `0x${string}`;       // address
  operator: StrategyOperator;  // uint8 (enum StrategyVault.Operator)
  value: bigint;               // uint256
}

export interface Allowance {
  token: `0x${string}`;                  // address - ERC20 token to approve
  spender: `0x${string}`;                // address - spender to approve
  amount: bigint;                        // uint256 - amount to approve
}

export interface Transfer {
  token: `0x${string}`;                  // address - ERC20 token to transfer
  to: `0x${string}`;                     // address - recipient of transfer
  amount: bigint;                        // uint256 - amount to transfer
}

export interface StrategyAction {
  target: `0x${string}`;                 // address
  selector: `0x${string}`;               // bytes4
  amountIndex: number;                   // uint8
  isPayable: boolean;                    // bool
  amountSource: StrategyAmountSource;    // uint8 (enum StrategyVault.AmountSource)
  value: bigint;                         // uint256 - ETH to send when vault funds payable actions
  data: `0x${string}`;                   // bytes - calldata for the action
  allowances: Allowance[];               // array of token allowances for the action
  transfers: Transfer[];                 // array of token transfers for the action
  // Frontend-only fields (not sent to smart contract, used for parsing and MongoDB storage)
  abi?: any[];                           // ABI of the target contract for decoding
  selectedFunction?: string;             // Name of the selected function
  functionArgs?: Record<string, string>; // Arguments for the selected function
}
