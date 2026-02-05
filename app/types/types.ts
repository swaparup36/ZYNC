// export interface OracleSource {
//   id: string
//   label: string
//   value: string
// }

// export interface Operator {
//   id: string
//   label: string
//   value: string
// }

// export interface Condition {
//   oracle: string
//   operator: string
//   value: string
// }

// export interface ABIFunction {
//   name: string
//   type: string
//   stateMutability: string
//   inputs?: ABIInput[]
//   outputs?: ABIOutput[]
// }

// export interface ABIInput {
//   name: string
//   type: string
//   internalType?: string
// }

// export interface ABIOutput {
//   name: string
//   type: string
//   internalType?: string
// }

// export interface Action {
//   contractAddress: string
//   abi: ABIFunction[]
//   selectedFunction: string
//   functionArgs: Record<string, string>
//   amountIndex?: number
//   ethValue?: string
// }

// export interface Safety {
//   maxAmount: string
//   cooldown: string
//   expiry: string
// }

// export interface AutomationStrategy {
//   id: string
//   condition: Condition
//   action: Action
//   safety: Safety
//   status: 'active' | 'paused' | 'expired'
//   createdAt: Date
//   lastExecution?: Date
//   failureCount: number
// }

// export interface ExecutionResult {
//   strategyId: string
//   success: boolean
//   transactionHash: string
//   error?: string
//   executedAt: Date
// }

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

export interface StrategyAction {
  target: `0x${string}`;                 // address
  selector: `0x${string}`;               // bytes4
  amountIndex: number;                   // uint8
  isPayable: boolean;                    // bool
  amountSource: StrategyAmountSource;    // uint8 (enum StrategyVault.AmountSource)
  value: bigint;                         // uint256 - ETH to send when vault funds payable actions
  data: `0x${string}`;                   // bytes - calldata for the action
  allowances: Allowance[];               // array of token allowances for the action
  // Frontend-only fields (not sent to smart contract, used for parsing and MongoDB storage)
  abi?: any[];                           // ABI of the target contract for decoding
  selectedFunction?: string;             // Name of the selected function
  functionArgs?: Record<string, string>; // Arguments for the selected function
}
