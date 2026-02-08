'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Code2, MoreVertical, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { keccak256, toHex, toBytes } from 'viem'
import { StrategyAmountSource, Allowance, Transfer } from '@/types/types'

interface AllowanceInput {
  token: string
  spender: string
  amount: string
}

interface TransferInput {
  token: string
  to: string
  amount: string
}

interface ActionBuilderProps {
  onChange?: (action: any) => void
}

export function ActionBuilder({ onChange }: ActionBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [contractAddress, setContractAddress] = useState('')
  const [abiInput, setAbiInput] = useState('')
  const [selectedFunction, setSelectedFunction] = useState('')
  const [functions, setFunctions] = useState<any[]>([])
  const [functionArgs, setFunctionArgs] = useState<Record<string, string>>({})
  const [amountSource, setAmountSource] = useState<string>('')
  const [amountIndex, setAmountIndex] = useState<string>('')
  const [msgValue, setMsgValue] = useState('')
  const [requiresDeposit, setRequiresDeposit] = useState<'ERC20' | 'ETH' | 'NONE'>('NONE')
  const [depositTokenAddress, setDepositTokenAddress] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [requiresAllowance, setRequiresAllowance] = useState<boolean>(false)
  const [allowances, setAllowances] = useState<AllowanceInput[]>([])
  const [requiresTransfer, setRequiresTransfer] = useState<boolean>(false)
  const [transfers, setTransfers] = useState<TransferInput[]>([])
  const [step, setStep] = useState(1)

  const handleContractAddressChange = (value: string) => {
    setContractAddress(value)
    setStep(value.trim().length > 0 ? 2 : 1)
  }

  const parseABI = () => {
    try {
      const trimmedInput = abiInput.trim()
      let parsed = JSON.parse(trimmedInput)
      
      // Handle different ABI formats
      let abiArray: any[] = []
      
      if (Array.isArray(parsed)) {
        abiArray = parsed // Standard ABI array format
      } else if (parsed.abi && Array.isArray(parsed.abi)) {
        abiArray = parsed.abi // Compilation artifact with .abi property
      } else if (parsed.interface && Array.isArray(parsed.interface)) {
        abiArray = parsed.interface // Some artifacts use .interface property
      } else {
        toast({ title: 'Invalid Format', description: 'Invalid ABI format. Please provide a valid ABI array.', variant: 'destructive' })
        return
      }
      
      const funcs = abiArray.filter(
        (item: any) =>
          item.type === 'function' &&
          (item.stateMutability === 'payable' || item.stateMutability === 'nonpayable')
      )
      
      if (funcs.length === 0) {
        toast({ title: 'No Functions Found', description: 'No payable or non-payable functions found in the ABI.', variant: 'destructive' })
        return
      }
      
      setFunctions(funcs)
      setStep(3)
    } catch (error) {
      console.log('Invalid ABI JSON: ', error)
      toast({ title: 'Parse Error', description: 'Failed to parse ABI. Please ensure it is valid JSON.', variant: 'destructive' })
    }
  }

  const selectedFunctionData = functions.find((f) => f.name === selectedFunction)
  const isPayable = selectedFunctionData?.stateMutability === 'payable'

  const handleFunctionSelect = (funcName: string) => {
    setSelectedFunction(funcName)
    setFunctionArgs({})
    setStep(4)
  }

  useEffect(() => {
    if (!selectedFunction || !contractAddress) {
      onChange?.(null)
      return
    }

    const selectedFunc = functions.find((f) => f.name === selectedFunction)
    if (!selectedFunc) {
      onChange?.(null)
      return
    }

    const allArgsFilled = selectedFunc.inputs?.every((_: any, idx: number) => 
      functionArgs[`arg_${idx}`] !== undefined && functionArgs[`arg_${idx}`] !== ''
    ) ?? true

    if (!amountSource) {
      onChange?.(null)
      return
    }

    if (amountSource === 'CALLDATA' && !amountIndex) {
      onChange?.(null)
      return
    }

    if (amountSource === 'MSG_VALUE' && !msgValue) {
      onChange?.(null)
      return
    }

    if (requiresDeposit === 'ERC20' && (!depositTokenAddress || !depositAmount)) {
      onChange?.(null)
      return
    }

    if (requiresDeposit === 'ERC20' && depositTokenAddress) {
      if (!depositTokenAddress.startsWith('0x') || depositTokenAddress.length !== 42) {
        onChange?.(null)
        return
      }
    }

    if (requiresDeposit === 'ETH' && !depositAmount) {
      onChange?.(null)
      return
    }

    if (requiresAllowance && allowances.length > 0) {
      const allAllowancesValid = allowances.every(a => 
        a.token && a.token.startsWith('0x') && a.token.length === 42 &&
        a.spender && a.spender.startsWith('0x') && a.spender.length === 42 &&
        a.amount && a.amount.trim() !== ''
      )
      if (!allAllowancesValid) {
        onChange?.(null)
        return
      }
    }

    if (requiresTransfer && transfers.length > 0) {
      const allTransfersValid = transfers.every(t => 
        t.token && t.token.startsWith('0x') && t.token.length === 42 &&
        t.to && t.to.startsWith('0x') && t.to.length === 42 &&
        t.amount && t.amount.trim() !== ''
      )
      if (!allTransfersValid) {
        onChange?.(null)
        return
      }
    }

    if (!allArgsFilled) {
      onChange?.(null)
      return
    }

    const functionSignature = `${selectedFunc.name}(${selectedFunc.inputs?.map((i: any) => i.type).join(',') ?? ''})`
    const signatureHash = keccak256(toBytes(functionSignature))
    const selector = `0x${signatureHash.slice(2, 10)}` as `0x${string}`

    let amountSourceEnum: StrategyAmountSource
    if (amountSource === 'CALLDATA') {
      amountSourceEnum = StrategyAmountSource.CALLDATA
    } else if (amountSource === 'MSG_VALUE') {
      amountSourceEnum = StrategyAmountSource.MSG_VALUE
    } else {
      amountSourceEnum = StrategyAmountSource.NONE
    }

    const formattedAllowances = requiresAllowance ? allowances.map(a => ({
      token: a.token as `0x${string}`,
      spender: a.spender as `0x${string}`,
      amount: a.amount
    })) : []

    const formattedTransfers = requiresTransfer ? transfers.map(t => ({
      token: t.token as `0x${string}`,
      to: t.to as `0x${string}`,
      amount: t.amount
    })) : []

    onChange?.({
      target: contractAddress as `0x${string}`,
      selector: selector,
      amountIndex: amountSource === 'CALLDATA' ? parseInt(amountIndex) : 0,
      isPayable: isPayable,
      amountSource: amountSourceEnum,
      functionArgs,
      abi: functions,
      selectedFunction,
      requiresDeposit,
      depositTokenAddress: depositTokenAddress as `0x${string}` | undefined,
      depositAmount,
      msgValue,
      requiresAllowance,
      allowances: formattedAllowances,
      requiresTransfer,
      transfers: formattedTransfers
    })
  }, [
    contractAddress,
    selectedFunction,
    functionArgs,
    amountSource,
    amountIndex,
    msgValue,
    requiresDeposit,
    depositTokenAddress,
    depositAmount,
    requiresAllowance,
    allowances,
    requiresTransfer,
    transfers,
    functions,
    isPayable,
    onChange
  ])

  return (
    <div className="w-full border border-zinc-700 rounded-lg p-6 bg-black relative mt-0 rainbow-border-hover">
      {/* Header with icon and menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-zinc-600">
            <Code2 className="h-4 w-4 text-black font-bold" />
            <span className="text-xs font-bold text-black tracking-widest">ACTION</span>
          </div>
          <span className="text-sm font-bold text-white">2.</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:text-white/80">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 mb-4 font-medium">
        Select the event for your automation to run
      </p>

      {/* Content - Hidden by default, shown on expand */}
      {isExpanded && (
        <div className="space-y-4 border-t border-zinc-700 pt-4">
          {/* Step 1: Contract Address */}
          {step >= 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  1
                </div>
                <label className="text-xs font-bold text-white tracking-wider">TARGET CONTRACT</label>
              </div>
              <Input
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => handleContractAddressChange(e.target.value)}
                className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
              />
            </div>
          )}

          {/* Step 2: ABI Input */}
          {step >= 2 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  2
                </div>
                <label className="text-xs font-bold text-white tracking-wider">CONTRACT ABI</label>
              </div>
              <Textarea
                placeholder='Paste your contract ABI JSON here...'
                value={abiInput}
                onChange={(e) => setAbiInput(e.target.value)}
                className="font-mono text-xs min-h-20 bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
              />
              <Button
                onClick={parseABI}
                disabled={!contractAddress || !abiInput}
                className="w-full bg-white text-black hover:bg-white/90 font-bold text-xs"
              >
                PARSE ABI
              </Button>
            </div>
          )}

          {/* Step 3: Function Selector */}
          {step >= 3 && functions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  3
                </div>
                <label className="text-xs font-bold text-white tracking-wider">SELECT FUNCTION</label>
              </div>
              <Select value={selectedFunction} onValueChange={handleFunctionSelect}>
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue placeholder="Choose function..." />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((func) => (
                    <SelectItem key={func.name} value={func.name}>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span>{func.name}</span>
                        {func.stateMutability === 'payable' && (
                          <span className="text-xs bg-white text-black px-2 py-0.5 rounded font-bold">
                            payable
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 4: Function Arguments */}
          {step >= 4 && selectedFunctionData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  4
                </div>
                <label className="text-xs font-bold text-white tracking-wider">FUNCTION ARGUMENTS</label>
              </div>
              {selectedFunctionData.inputs && selectedFunctionData.inputs.length > 0 ? (
                <div className="space-y-2">
                  {selectedFunctionData.inputs?.map((input: any, idx: number) => (
                    <div key={`${input.name}-${idx}`}>
                      <label className="text-xs text-white font-bold mb-1 block">
                        {input.name || `arg${idx}`}
                        <span className="text-zinc-400 font-normal"> ({input.type})</span>
                      </label>
                      <Input
                        placeholder={`Enter ${input.type}`}
                        value={functionArgs[`arg_${idx}`] || ''}
                        onChange={(e) => {
                          setFunctionArgs({
                            ...functionArgs,
                            [`arg_${idx}`]: e.target.value,
                          })
                        }}
                        className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No arguments required</p>
              )}
            </div>
          )}

          {/* Step 5: Amount Source */}
          {step >= 4 && selectedFunctionData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  5
                </div>
                <label className="text-xs font-bold text-white tracking-wider">AMOUNT SOURCE</label>
              </div>
              <p className="text-xs text-zinc-400 mb-2 font-medium">
                Where should the transaction amount come from?
              </p>
              <Select value={amountSource} onValueChange={(val) => {
                setAmountSource(val)
                setAmountIndex('')
                setMsgValue('')
                setStep(5)
              }}>
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue placeholder="Select amount source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALLDATA">CALLDATA (from function argument)</SelectItem>
                  <SelectItem value="MSG_VALUE">MSG_VALUE (ETH value)</SelectItem>
                  <SelectItem value="NONE">NONE (no amount)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 6a: Amount Index (if CALLDATA) */}
          {step >= 5 && amountSource === 'CALLDATA' && selectedFunctionData?.inputs && selectedFunctionData.inputs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  6
                </div>
                <label className="text-xs font-bold text-white tracking-wider">AMOUNT ARGUMENT INDEX</label>
              </div>
              <p className="text-xs text-zinc-400 mb-2 font-medium">
                Which argument represents the amount?
              </p>
              <Select value={amountIndex} onValueChange={(val) => {
                setAmountIndex(val)
                setStep(6)
              }}>
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue placeholder="Select argument..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedFunctionData.inputs.map((input: any, idx: number) => (
                    <SelectItem key={`amount-${idx}`} value={idx.toString()}>
                      <span className="font-mono text-xs">{input.name || `arg${idx}`} ({input.type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 6b: MSG_VALUE (if MSG_VALUE) */}
          {step >= 5 && amountSource === 'MSG_VALUE' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  6
                </div>
                <label className="text-xs font-bold text-white tracking-wider">ETH VALUE (Wei)</label>
              </div>
              <Input
                placeholder="Enter amount in Wei"
                value={msgValue}
                onChange={(e) => {
                  setMsgValue(e.target.value)
                  setStep(6)
                }}
                className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500 font-mono text-xs"
              />
            </div>
          )}

          {/* Step 6c: No input if NONE */}
          {step >= 5 && amountSource === 'NONE' && (
            <div className="space-y-2">
              <Alert className="bg-zinc-900 border-zinc-700">
                <AlertCircle className="h-4 w-4 text-white" />
                <AlertDescription className="text-xs text-zinc-400">
                  No amount will be transferred with this action.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 7: Deposit Requirements */}
          {((step >= 6 && amountSource !== '') || (step >= 5 && amountSource === 'NONE')) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  7
                </div>
                <label className="text-xs font-bold text-white tracking-wider">DEPOSIT REQUIREMENTS</label>
              </div>
              <p className="text-xs text-zinc-400 mb-2 font-medium">
                Does this action require depositing tokens or ETH to the vault?
              </p>
              <Select value={requiresDeposit} onValueChange={(val) => {
                setRequiresDeposit(val as 'ERC20' | 'ETH' | 'NONE')
                setDepositTokenAddress('')
                setDepositAmount('')
              }}>
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue placeholder="Select deposit type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No deposit required</SelectItem>
                  <SelectItem value="ERC20">ERC20 Token</SelectItem>
                  <SelectItem value="ETH">Native ETH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 8a: ERC20 Token Details */}
          {requiresDeposit === 'ERC20' && (
            <div className="space-y-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white tracking-wider">TOKEN ADDRESS</label>
                <Input
                  placeholder="0x..."
                  value={depositTokenAddress}
                  onChange={(e) => setDepositTokenAddress(e.target.value)}
                  className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                />
                {depositTokenAddress && (!depositTokenAddress.startsWith('0x') || depositTokenAddress.length !== 42) && (
                  <p className="text-xs text-destructive">
                    Invalid token address. Must be a 42-character hex address starting with 0x.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white tracking-wider">DEPOSIT AMOUNT</label>
                <Input
                  placeholder="Amount in Wei"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
          )}

          {/* Step 8b: ETH Amount */}
          {requiresDeposit === 'ETH' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-white tracking-wider">DEPOSIT AMOUNT (Wei)</label>
              <Input
                placeholder="Amount in Wei"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
              />
            </div>
          )}

          {/* Step 9: Token Allowances */}
          {((step >= 6 && amountSource !== '') || (step >= 5 && amountSource === 'NONE')) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  8
                </div>
                <label className="text-xs font-bold text-white tracking-wider">TOKEN ALLOWANCES</label>
              </div>
              <p className="text-xs text-zinc-400 mb-2 font-medium">
                Does this action need ERC20 token spending approval? (e.g., approval to Uniswap Router to spend tokens on behalf of the vault)
              </p>
              <Select 
                value={requiresAllowance ? 'yes' : 'no'} 
                onValueChange={(val) => {
                  const needsAllowance = val === 'yes'
                  setRequiresAllowance(needsAllowance)
                  if (needsAllowance && allowances.length === 0) {
                    setAllowances([{ token: '', spender: '', amount: '' }])
                  } else if (!needsAllowance) {
                    setAllowances([])
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No allowances needed</SelectItem>
                  <SelectItem value="yes">Yes, requires token approvals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 9a: Allowance Details */}
          {requiresAllowance && (
            <div className="space-y-4">
              {allowances.map((allowance, idx) => (
                <div key={idx} className="space-y-2 p-4 border border-zinc-700 rounded-lg bg-zinc-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white tracking-wider">
                      ALLOWANCE {idx + 1}
                    </span>
                    {allowances.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                        onClick={() => {
                          setAllowances(prev => prev.filter((_, i) => i !== idx))
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white tracking-wider">TOKEN ADDRESS</label>
                    <Input
                      placeholder="0x... (ERC20 token to approve)"
                      value={allowance.token}
                      onChange={(e) => {
                        const newAllowances = [...allowances]
                        newAllowances[idx].token = e.target.value
                        setAllowances(newAllowances)
                      }}
                      className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                    {allowance.token && (!allowance.token.startsWith('0x') || allowance.token.length !== 42) && (
                      <p className="text-xs text-destructive">
                        Invalid token address. Must be a 42-character hex address starting with 0x.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white tracking-wider">SPENDER ADDRESS</label>
                    <Input
                      placeholder="0x... (e.g., Uniswap Router)"
                      value={allowance.spender}
                      onChange={(e) => {
                        const newAllowances = [...allowances]
                        newAllowances[idx].spender = e.target.value
                        setAllowances(newAllowances)
                      }}
                      className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                    {allowance.spender && (!allowance.spender.startsWith('0x') || allowance.spender.length !== 42) && (
                      <p className="text-xs text-destructive">
                        Invalid spender address. Must be a 42-character hex address starting with 0x.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white tracking-wider">APPROVAL AMOUNT</label>
                    <Input
                      placeholder="Amount in Wei (use max uint256 for unlimited)"
                      value={allowance.amount}
                      onChange={(e) => {
                        const newAllowances = [...allowances]
                        newAllowances[idx].amount = e.target.value
                        setAllowances(newAllowances)
                      }}
                      className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                    <p className="text-xs text-zinc-500">
                      Tip: Use "115792089237316195423570985008687907853269984665640564039457584007913129639935" for max approval
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Add another allowance button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-zinc-600 text-white hover:bg-zinc-800"
                onClick={() => {
                  setAllowances(prev => [...prev, { token: '', spender: '', amount: '' }])
                }}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Another Allowance
              </Button>
            </div>
          )}

          {/* Step 10: Token Transfers */}
          {((step >= 6 && amountSource !== '') || (step >= 5 && amountSource === 'NONE')) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                  9
                </div>
                <label className="text-xs font-bold text-white tracking-wider">TOKEN TRANSFERS</label>
              </div>
              <p className="text-xs text-zinc-400 mb-2 font-medium">
                Does this action need to transfer tokens to an external address before execution? (e.g., transfer tokens to a contract that requires them)
              </p>
              <Select 
                value={requiresTransfer ? 'yes' : 'no'} 
                onValueChange={(val) => {
                  const needsTransfer = val === 'yes'
                  setRequiresTransfer(needsTransfer)
                  if (needsTransfer && transfers.length === 0) {
                    setTransfers([{ token: '', to: '', amount: '' }])
                  } else if (!needsTransfer) {
                    setTransfers([])
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No transfers needed</SelectItem>
                  <SelectItem value="yes">Yes, requires token transfers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 10a: Transfer Details */}
          {requiresTransfer && (
            <div className="space-y-4">
              {transfers.map((transfer, idx) => (
                <div key={idx} className="space-y-2 p-4 border border-zinc-700 rounded-lg bg-zinc-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white tracking-wider">
                      TRANSFER {idx + 1}
                    </span>
                    {transfers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                        onClick={() => {
                          setTransfers(prev => prev.filter((_, i) => i !== idx))
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white tracking-wider">TOKEN ADDRESS</label>
                    <Input
                      placeholder="0x... (ERC20 token to transfer)"
                      value={transfer.token}
                      onChange={(e) => {
                        const newTransfers = [...transfers]
                        newTransfers[idx].token = e.target.value
                        setTransfers(newTransfers)
                      }}
                      className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                    {transfer.token && (!transfer.token.startsWith('0x') || transfer.token.length !== 42) && (
                      <p className="text-xs text-destructive">
                        Invalid token address. Must be a 42-character hex address starting with 0x.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white tracking-wider">RECIPIENT ADDRESS</label>
                    <Input
                      placeholder="0x... (address to receive tokens)"
                      value={transfer.to}
                      onChange={(e) => {
                        const newTransfers = [...transfers]
                        newTransfers[idx].to = e.target.value
                        setTransfers(newTransfers)
                      }}
                      className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                    {transfer.to && (!transfer.to.startsWith('0x') || transfer.to.length !== 42) && (
                      <p className="text-xs text-destructive">
                        Invalid recipient address. Must be a 42-character hex address starting with 0x.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white tracking-wider">TRANSFER AMOUNT</label>
                    <Input
                      placeholder="Amount in Wei"
                      value={transfer.amount}
                      onChange={(e) => {
                        const newTransfers = [...transfers]
                        newTransfers[idx].amount = e.target.value
                        setTransfers(newTransfers)
                      }}
                      className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                    />
                  </div>
                </div>
              ))}
              
              {/* Add another transfer button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-zinc-600 text-white hover:bg-zinc-800"
                onClick={() => {
                  setTransfers(prev => [...prev, { token: '', to: '', amount: '' }])
                }}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Another Transfer
              </Button>
            </div>
          )}

          {functions.length === 0 && step >= 3 && (
            <Alert className="bg-zinc-900 border-destructive/50">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-xs text-destructive">No functions found in the provided ABI.</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Collapse/Expand button */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-xs text-white hover:text-white/80 font-bold tracking-wide mt-2"
        >
          ► CONFIGURE ACTION
        </button>
      ) : (
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full text-left text-xs text-zinc-400 hover:text-white mt-4 font-medium tracking-wide"
        >
          ▼ HIDE DETAILS
        </button>
      )}
    </div>
  )
}
