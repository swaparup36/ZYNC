'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { TriggerBuilder, TriggerBuilderValue } from '@/components/trigger-builder'
import { ActionBuilder } from '@/components/action-builder-zapier'
import { SafetyControls } from '@/components/safety-controls'
import { DepositModal } from '@/components/deposit-modal'
import { useSearchParams, useRouter } from 'next/navigation'
import { StrategyAction, StrategyCondition, StrategyOperator, StrategyAmountSource, Allowance } from '@/types/types'
import { 
  createStrategy, 
  decodeEventLogAndReturn, 
  waitForTx, 
  depositTokenOnVault, 
  depositETHOnVault,
  approveERC20,
  getERC20Allowance,
  getVaultTokenBalance,
  getVaultETHBalance,
  isValidERC20Token,
  getERC20Symbol
} from '@/lib/transactionHandler'
import { SEPOLIA_ORACLE_SOURCES } from '@/lib/oracles'
import { useAccount } from 'wagmi'
import { encodeFunctionData } from 'viem'

type TriggerSection = {
  id: string
  data?: TriggerBuilderValue
}

const OPERATOR_LABELS: Record<string, string> = {
  lt: 'is less than',
  gt: 'is greater than',
  eq: 'equals',
}

const formatOperatorLabel = (value?: string) => {
  if (!value) return 'operator'
  return OPERATOR_LABELS[value] ?? value
}

const formatOracleLabel = (value?: string) => {
  if (!value) return 'Oracle not configured'
  return SEPOLIA_ORACLE_SOURCES.find((source) => source.value === value)?.label ?? value
}

const generateTriggerId = () => `trigger-${Math.random().toString(36).slice(2, 11)}`

const convertOperator = (operatorStr: string): StrategyOperator => {
  switch (operatorStr) {
    case 'lt':
      return StrategyOperator.LT
    case 'gt':
      return StrategyOperator.GT
    case 'eq':
      return StrategyOperator.EQ
    default:
      throw new Error(`Unknown operator: ${operatorStr}`)
  }
}

const convertValueToBigInt = (value: string): bigint => {
  const trimmedValue = value.trim()
  
  if (trimmedValue.includes('.')) {
    const floatValue = parseFloat(trimmedValue)
    if (isNaN(floatValue)) {
      throw new Error(`Invalid numeric value: ${value}`)
    }
  
    return BigInt(Math.floor(floatValue))
  }
  
  return BigInt(trimmedValue)
}

async function encodeFunctionDataFromAction(action: any): Promise<`0x${string}`> {
  try {
    const selectedFunc = action.abi?.find((f: any) => f.name === action.selectedFunction)
    if (!selectedFunc) {
      console.warn('Function not found in ABI, using selector only')
      return action.selector as `0x${string}`
    }

    const args: any[] = []
    if (selectedFunc.inputs && selectedFunc.inputs.length > 0) {
      for (let idx = 0; idx < selectedFunc.inputs.length; idx++) {
        const input = selectedFunc.inputs[idx]
        let argValue = action.functionArgs?.[`arg_${idx}`] || ''
        
        if (input.type.endsWith('[]')) {
          const baseType = input.type.slice(0, -2)
        
          let arrayValues: string[] = []
          if (typeof argValue === 'string') {
            const cleanValue = argValue.trim().replace(/^\[|\]$/g, '').trim()
            if (cleanValue) {
              arrayValues = cleanValue.split(',').map(v => v.trim())
            }
          } else if (Array.isArray(argValue)) {
            arrayValues = argValue
          }
          
          const convertedArray = arrayValues.map(val => {
            if (baseType.includes('uint') || baseType.includes('int')) {
              return BigInt(val || '0')
            } else if (baseType === 'address') {
              return val as `0x${string}`
            } else if (baseType === 'bool') {
              return val === 'true'
            } else if (baseType === 'bytes' || baseType.startsWith('bytes')) {
              return val as `0x${string}`
            } else {
              return val
            }
          })
          
          args.push(convertedArray)
        } else if (input.type.includes('uint') || input.type.includes('int')) {
          args.push(BigInt(argValue || '0'))
        } else if (input.type === 'address') {
          args.push(argValue as `0x${string}`)
        } else if (input.type === 'bool') {
          args.push(argValue === 'true' || argValue === true)
        } else if (input.type === 'bytes' || input.type.startsWith('bytes')) {
          args.push(argValue as `0x${string}`)
        } else {
          args.push(argValue)
        }
      }
    }

    const encoded = encodeFunctionData({
      abi: [selectedFunc],
      functionName: selectedFunc.name,
      args: args
    })

    console.log('Encoded function data:', {
      function: selectedFunc.name,
      selector: action.selector,
      encodedData: encoded,
      args: args
    })

    return encoded
  } catch (error) {
    console.error('Error encoding function data:', error)
    return action.selector as `0x${string}`
  }
}

function CreateAutomationPage() {
  const [triggerSections, setTriggerSections] = useState<TriggerSection[]>(() => [
    { id: generateTriggerId() },
  ])
  const [action, setAction] = useState<StrategyAction | null>(null)
  const [safety, setSafety] = useState<any>(null)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const vaultAddress = useSearchParams().get('vault')
  const router = useRouter()
  const { address: userAddress } = useAccount()

  const configuredTriggers = triggerSections
    .map((section) => section.data)
    .filter((data): data is TriggerBuilderValue => Boolean(data && data.oracle && data.operator && data.value))

  const allTriggersConfigured = configuredTriggers.length === triggerSections.length

  const isComplete = allTriggersConfigured && !!action && !!safety

  const handleTriggerChange = (sectionId: string, value: TriggerBuilderValue) => {
    setTriggerSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              data: value,
            }
          : section
      )
    )
  }

  const handleAddTrigger = () => {
    setTriggerSections((prev) => [...prev, { id: generateTriggerId() }])
  }

  async function handleCreateAutomationStrategy() {
    if (!vaultAddress) {
      alert('Vault address is missing')
      return
    }

    if (!allTriggersConfigured || !action || !safety) {
      alert('Please complete all sections before creating the automation.')
      return
    }

    if (!userAddress) {
      alert('Please connect your wallet')
      return
    }

    setIsCreating(true)

    try {
      const depositType = (action as any).requiresDeposit
      const depositAmount = BigInt((action as any).depositAmount || '0')

      if (depositType === 'ERC20') {
        const tokenAddress = (action as any).depositTokenAddress as `0x${string}`
        
        try {
          const currentBalance = await getVaultTokenBalance(
            vaultAddress as `0x${string}`,
            tokenAddress
          )
          
          if (currentBalance < depositAmount) {
            setShowDepositModal(true)
            return
          }
        } catch (error: any) {
          console.error('Error checking token balance:', error)
          alert(error.message || 'Failed to check vault token balance')
          setIsCreating(false)
          return
        }
      } else if (depositType === 'ETH') {
        try {
          const currentBalance = await getVaultETHBalance(vaultAddress as `0x${string}`)
          
          if (currentBalance < depositAmount) {
            setShowDepositModal(true)
            return
          }
        } catch (error: any) {
          console.error('Error checking ETH balance:', error)
          alert(error.message || 'Failed to check vault ETH balance')
          setIsCreating(false)
          return
        }
      }

      await createStrategyTransaction()
    } catch (error: any) {
      console.error('Error creating strategy:', error)
      alert(error.message || 'Failed to create strategy')
      setIsCreating(false)
    }
  }

  async function handleDeposit() {
    if (!vaultAddress || !action) return

    const depositType = (action as any).requiresDeposit
    const depositAmount = BigInt((action as any).depositAmount || '0')

    if (depositType === 'ERC20') {
      const tokenAddress = (action as any).depositTokenAddress as `0x${string}`
      
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
        throw new Error('Invalid ERC20 token address. Please provide a valid token address.');
      }
      
      const allowance = await getERC20Allowance(
        tokenAddress,
        userAddress as `0x${string}`,
        vaultAddress as `0x${string}`
      )

      if (allowance < depositAmount) {
        const approveHash = await approveERC20(
          tokenAddress,
          vaultAddress as `0x${string}`,
          depositAmount
        )
        await waitForTx(approveHash)
      }

      const depositHash = await depositTokenOnVault(
        vaultAddress as `0x${string}`,
        tokenAddress,
        depositAmount
      )
      await waitForTx(depositHash)
    } else if (depositType === 'ETH') {
      const depositHash = await depositETHOnVault(
        vaultAddress as `0x${string}`,
        depositAmount
      )
      await waitForTx(depositHash)
    }

    setShowDepositModal(false)
    await createStrategyTransaction()
  }

  async function createStrategyTransaction() {
    try {
      if (!vaultAddress || !action || !safety) {
        alert('Missing required information for strategy creation.');
        return;
      }


      if (!safety.maxAmount || !safety.cooldown || !safety.expiry) {
        console.log("safety: ", safety);
        alert('Safety controls must have all values configured (maxAmount, cooldown, expiry).');
        return;
      }

      const strategyData: StrategyCondition[] = configuredTriggers.map(trigger => ({
        oracle: trigger.oracle as `0x${string}`,
        operator: convertOperator(trigger.operator),
        value: convertValueToBigInt(trigger.value)
      }))

      // console.log("Action object:", action)
      
      if (!action.target || !action.selector || action.amountIndex === undefined || 
          action.isPayable === undefined || action.amountSource === undefined) {
        alert('Action configuration is incomplete. Please ensure all action fields are set.');
        console.error('Missing action fields:', {
          target: action.target,
          selector: action.selector,
          amountIndex: action.amountIndex,
          isPayable: action.isPayable,
          amountSource: action.amountSource
        });
        return;
      }

      const encodedData = await encodeFunctionDataFromAction(action)
      
      let actionValue = BigInt(0)
      if (action.amountSource === StrategyAmountSource.CALLDATA) {
        actionValue = BigInt(0)
      } else if (action.amountSource === StrategyAmountSource.MSG_VALUE) {
        const msgValue = (action as any).msgValue || (action as any).depositAmount || '0'
        actionValue = BigInt(msgValue)
      } else {
        actionValue = BigInt(0)
      }

      const actionAllowances: Allowance[] = ((action as any).allowances || []).map((a: any) => ({
        token: a.token as `0x${string}`,
        spender: a.spender as `0x${string}`,
        amount: BigInt(a.amount || '0')
      }))

      for (let i = 0; i < actionAllowances.length; i++) {
        const allowance = actionAllowances[i];
        if (!allowance.token || allowance.token === '0x0000000000000000000000000000000000000000') {
          alert(`Allowance #${i + 1}: Token address is invalid (zero address).`);
          setIsCreating(false);
          return;
        }
        if (!allowance.spender || allowance.spender === '0x0000000000000000000000000000000000000000') {
          alert(`Allowance #${i + 1}: Spender address is invalid (zero address).`);
          setIsCreating(false);
          return;
        }
        if (allowance.amount <= BigInt(0)) {
          alert(`Allowance #${i + 1}: Amount must be greater than 0.`);
          setIsCreating(false);
          return;
        }

        console.log(`Validating token contract: ${allowance.token}`);
        const isValidToken = await isValidERC20Token(allowance.token);
        if (!isValidToken) {
          const errorMsg = `Allowance #${i + 1}: Token address ${allowance.token} is not a valid ERC20 contract on this network.\n\n` +
            `Please verify:\n` +
            `1. The token address is correct\n` +
            `2. The token exists on Sepolia testnet\n` +
            `3. You're connected to the correct network`;
          alert(errorMsg);
          setIsCreating(false);
          return;
        }
        
        const tokenSymbol = await getERC20Symbol(allowance.token);
        console.log(`Token ${allowance.token} validated successfully (Symbol: ${tokenSymbol || 'unknown'})`);
      }

      if (actionAllowances.length > 0) {
        console.log("Token Allowances to be set:", actionAllowances.map(a => ({
          token: a.token,
          spender: a.spender,
          amount: a.amount.toString()
        })));
        console.warn("Note: If the transaction reverts, verify that the token addresses are valid ERC20 contracts on this network.");
      }

      const strategyAction: StrategyAction = {
        target: action.target,
        selector: action.selector,
        amountIndex: action.amountIndex,
        isPayable: action.isPayable,
        amountSource: action.amountSource,
        value: actionValue,
        data: encodedData,
        allowances: actionAllowances,
      }

      console.log("Strategy Action object:", {
        ...strategyAction,
        value: strategyAction.value.toString(),
        allowances: strategyAction.allowances.map(a => ({
          token: a.token,
          spender: a.spender,
          amount: a.amount.toString()
        }))
      })

      if (action.amountSource !== StrategyAmountSource.MSG_VALUE && actionValue !== BigInt(0)) {
        alert('Error: action.value must be 0 when amountSource is not MSG_VALUE');
        console.error('Invalid configuration: value is non-zero for non-MSG_VALUE amountSource', {
          amountSource: action.amountSource,
          value: actionValue.toString()
        });
        setIsCreating(false);
        return;
      }

      const maxAmount = BigInt(safety.maxAmount)
      const cooldown = BigInt(safety.cooldown)
      
      const expiryDuration = BigInt(safety.expiry)
      const currentTimestamp = BigInt(Math.floor(Date.now() / 1000))
      const expiry = currentTimestamp + expiryDuration

      console.log("Creating strategy with:", {
        vaultAddress,
        conditions: configuredTriggers.length,
        target: strategyAction.target,
        maxAmount: maxAmount.toString(),
        cooldown: cooldown.toString(),
        expiryDuration: expiryDuration.toString(),
        currentTimestamp: currentTimestamp.toString(),
        expiry: expiry.toString()
      })

      const hash = await createStrategy(
        vaultAddress as `0x${string}`,
        strategyData,
        strategyAction,
        maxAmount,
        cooldown,
        expiry
      )

      console.log('Strategy creation tx hash:', hash)

      const receipt = await waitForTx(hash);

      const event = receipt.logs.find(async log => {
        try {
          const decoded = await decodeEventLogAndReturn(log);
          return decoded.eventName === 'StrategyCreated';
        } catch {
          return false;
        }
      });

      if (!event) {
        console.log("StrategyCreated event not found");
        alert("Strategy created successfully!");
        setIsCreating(false)
        return;
      }

      const decoded = await decodeEventLogAndReturn(event);

      if (!decoded || !decoded.args || decoded.args.length === 0) {
        console.log("Failed to decode event log");
        alert("Strategy created successfully!");
        setIsCreating(false)
        return;
      }

      const strategyId = decoded.args.strategyId;

      console.log("Strategy created with Id: ", strategyId)
      try {
        const abiResponse = await fetch('/api/strategy-abi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vaultAddress: vaultAddress,
            strategyId: strategyId.toString(),
            targetContractABI: action.abi || [],
          }),
        });

        if (!abiResponse.ok) {
          console.error('Failed to store ABI:', await abiResponse.text());
        } else {
          console.log('ABI stored successfully');
        }
      } catch (abiError) {
        console.error('Error storing ABI:', abiError);
      }
      alert(`Strategy created successfully with ID: ${strategyId}`)
      setIsCreating(false)
      router.push(`/manage-vault?vault=${vaultAddress}`)
    } catch (error: any) {
      console.error("Error creating strategy:", error);
      
      let errorMessage = error.message || "Failed to create strategy";
      
      if (errorMessage.includes("execution reverted")) {
        const actionAllowances = (action as any)?.allowances || [];
        if (actionAllowances.length > 0) {
          errorMessage += "\n\nPossible causes:\n" +
            "1. One or more token addresses in allowances may not be valid ERC20 contracts on this network.\n" +
            "2. Verify all token addresses are correct for the Sepolia testnet.\n" +
            "3. The vault contract may not be able to call approve() on the specified tokens.";
        } else {
          errorMessage += "\n\nPossible causes:\n" +
            "1. Invalid strategy parameters (check maxAmount, cooldown, expiry).\n" +
            "2. Expiry must be in the future.\n" +
            "3. The action's value must be 0 unless amountSource is MSG_VALUE.";
        }
      }
      
      alert(errorMessage);
      setIsCreating(false)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-accent/40 sticky top-0 z-50 bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/setup">
            <Button variant="ghost" size="sm" className="text-accent hover:text-accent/80">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-sm font-bold text-accent tracking-widest">CREATE AUTOMATION STRATEGY</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center gap-0">
          {/* Trigger Cards */}
          <div className="w-full flex flex-col items-center gap-0">
            {triggerSections.map((section, index) => (
              <div key={section.id} className="w-full flex flex-col items-center gap-0">
                <TriggerBuilder
                  order={index + 1}
                  onChange={(value) => handleTriggerChange(section.id, value)}
                />

                {index < triggerSections.length - 1 && (
                  <div className="flex flex-col items-center gap-1 w-full py-4">
                    <div className="h-6 w-px bg-gradient-to-b from-accent to-accent/40" />
                    <div className="px-3 py-1 rounded-full bg-card border border-accent text-[10px] font-bold tracking-[0.3em] text-accent">
                      AND
                    </div>
                    <div className="h-6 w-px bg-gradient-to-b from-accent/40 to-accent" />
                  </div>
                )}
              </div>
            ))}

            {/* Add Trigger Button */}
            <div className="flex flex-col items-center gap-2 w-full py-6">
              <div className="h-6 w-px bg-gradient-to-b from-accent to-accent/40" />
              <button
                type="button"
                onClick={handleAddTrigger}
                className="h-10 cursor-pointer w-10 rounded-full bg-accent flex items-center justify-center text-card text-lg font-bold border-2 border-accent shadow-lg shadow-accent/50 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-colors"
                aria-label="Add another trigger"
              >
                +
              </button>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">
                Add Trigger
              </span>
              <div className="h-6 w-px bg-gradient-to-b from-accent/40 to-accent" />
            </div>
          </div>

          {/* Action Card */}
          <ActionBuilder onChange={setAction} />

          {/* Safety Controls - below the flow */}
          <div className="w-full mt-12">
            <SafetyControls onChange={setSafety} />
          </div>

          {/* Review Summary */}
          <div className="w-full mt-12 space-y-6">
            <div className="w-full border-2 border-accent/40 rounded-2xl p-6 bg-card shadow-lg shadow-accent/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-muted-foreground">STEP 4</p>
                  <h2 className="text-lg font-bold text-accent tracking-widest">REVIEW & SUBMIT</h2>
                </div>
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full tracking-[0.2em] ${isComplete ? 'bg-accent text-card' : 'bg-muted text-muted-foreground'}`}>
                  {isComplete ? 'READY' : 'INCOMPLETE'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Double-check each section before deploying your automation strategy.
              </p>

              <div className="grid gap-6 mt-6">
                <section>
                  <p className="text-[11px] font-bold text-accent tracking-[0.3em] mb-2">TRIGGERS</p>
                  {configuredTriggers.length ? (
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {configuredTriggers.map((trigger, index) => (
                        <li key={`${trigger.oracle}-${index}`} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-accent">{index + 1}.</span>
                          <span>
                            {`${formatOracleLabel(trigger.oracle)} ${formatOperatorLabel(trigger.operator)} ${trigger.value}`}
                          </span>
                        </li>
                      ))}
                    </ul>                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Configure at least one trigger to proceed.
                    </p>
                  )}
                </section>

                <section>
                  <p className="text-[11px] font-bold text-accent tracking-[0.3em] mb-2">ACTION</p>
                  {action ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="text-accent font-semibold">Target:</span> {action.target || 'Not set'}
                      </p>
                      <p>
                        <span className="text-accent font-semibold">Selector:</span> {action.selector || 'Not set'}
                      </p>
                      <p>
                        <span className="text-accent font-semibold">Amount Index:</span>{' '}
                        {typeof action.amountIndex === 'number' ? action.amountIndex : 'Not set'}
                      </p>
                      <p>
                        <span className="text-accent font-semibold">Funding:</span> {action.isPayable ? 'Payable' : 'Non-payable'}
                      </p>
                      <p>
                        <span className="text-accent font-semibold">Amount Source:</span> {action.amountSource ?? 'Not set'}
                      </p>
                      {(action as any).allowances && (action as any).allowances.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-accent/20">
                          <p className="text-accent font-semibold mb-1">Token Allowances:</p>
                          <ul className="space-y-1 text-xs">
                            {(action as any).allowances.map((a: any, idx: number) => (
                              <li key={idx} className="bg-muted/50 p-2 rounded">
                                <span className="text-accent">#{idx + 1}</span>
                                <span className="block">Token: <span className="font-mono">{a.token?.slice(0, 10)}...{a.token?.slice(-6)}</span></span>
                                <span className="block">Spender: <span className="font-mono">{a.spender?.slice(0, 10)}...{a.spender?.slice(-6)}</span></span>
                                <span className="block">Amount: <span className="font-mono">{a.amount?.length > 20 ? `${a.amount.slice(0, 10)}...` : a.amount}</span></span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Action configuration pending.</p>
                  )}
                </section>

                <section>
                  <p className="text-[11px] font-bold text-accent tracking-[0.3em] mb-2">SAFETY</p>
                  {safety ? (
                    <div className="text-sm text-muted-foreground grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold text-accent tracking-widest">MAX AMOUNT</p>
                        <p className="font-mono text-base">{safety.maxAmount || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-accent tracking-widest">COOLDOWN</p>
                        <p className="font-mono text-base">{safety.cooldown || '—'}s</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-accent tracking-widest">EXPIRY</p>
                        <p className="font-mono text-base">{safety.expiry || '—'}s</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Safety controls not configured.</p>
                  )}
                </section>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 justify-between w-full">
              <Link href="/setup">
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <Button
                type="button"
                disabled={!isComplete || isCreating}
                onClick={handleCreateAutomationStrategy}
                className={`${isComplete ? 'bg-accent text-card hover:bg-accent/90' : 'bg-muted text-muted-foreground'} font-bold`}
              >
                {isCreating ? 'Creating...' : 'Review & Create'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false)
          setIsCreating(false)
        }}
        depositType={(action as any)?.requiresDeposit || 'ETH'}
        tokenAddress={(action as any)?.depositTokenAddress}
        amount={(action as any)?.depositAmount || '0'}
        onDeposit={handleDeposit}
      />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateAutomationPage />
    </Suspense>
  );
}
