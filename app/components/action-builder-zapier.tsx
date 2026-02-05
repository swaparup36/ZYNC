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
import { keccak256, toHex, toBytes } from 'viem'
import { StrategyAmountSource, Allowance } from '@/types/types'

interface AllowanceInput {
  token: string
  spender: string
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
        // Standard ABI array format
        abiArray = parsed
      } else if (parsed.abi && Array.isArray(parsed.abi)) {
        // Compilation artifact with .abi property
        abiArray = parsed.abi
      } else if (parsed.interface && Array.isArray(parsed.interface)) {
        // Some artifacts use .interface property
        abiArray = parsed.interface
      } else {
        alert('Invalid ABI format. Please provide a valid ABI array.')
        return
      }
      
      const funcs = abiArray.filter(
        (item: any) =>
          item.type === 'function' &&
          (item.stateMutability === 'payable' || item.stateMutability === 'nonpayable')
      )
      
      if (funcs.length === 0) {
        alert('No payable or non-payable functions found in the ABI.')
        return
      }
      
      setFunctions(funcs)
      setStep(3)
    } catch (error) {
      console.log('Invalid ABI JSON: ', error)
      alert('Failed to parse ABI. Please ensure it is valid JSON.')
    }
  }

  const selectedFunctionData = functions.find((f) => f.name === selectedFunction)
  const isPayable = selectedFunctionData?.stateMutability === 'payable'

  const handleFunctionSelect = (funcName: string) => {
    setSelectedFunction(funcName)
    setFunctionArgs({})
    setStep(4)
  }

  // Update action whenever any relevant state changes
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

    // Check if all function arguments are filled
    const allArgsFilled = selectedFunc.inputs?.every((_: any, idx: number) => 
      functionArgs[`arg_${idx}`] !== undefined && functionArgs[`arg_${idx}`] !== ''
    ) ?? true

    // Check if amount source is selected
    if (!amountSource) {
      onChange?.(null)
      return
    }

    // Check amount source specific requirements
    if (amountSource === 'CALLDATA' && !amountIndex) {
      onChange?.(null)
      return
    }

    if (amountSource === 'MSG_VALUE' && !msgValue) {
      onChange?.(null)
      return
    }

    // Check if deposit requirements are filled
    if (requiresDeposit === 'ERC20' && (!depositTokenAddress || !depositAmount)) {
      onChange?.(null)
      return
    }

    // Validate ERC20 token address format
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

    // Check if allowances are valid (if required)
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

    if (!allArgsFilled) {
      onChange?.(null)
      return
    }

    // Generate function selector (first 4 bytes of keccak256 hash of signature)
    const functionSignature = `${selectedFunc.name}(${selectedFunc.inputs?.map((i: any) => i.type).join(',') ?? ''})`
    const signatureHash = keccak256(toBytes(functionSignature))
    const selector = `0x${signatureHash.slice(2, 10)}` as `0x${string}`

    // Map amount source to enum value
    let amountSourceEnum: StrategyAmountSource
    if (amountSource === 'CALLDATA') {
      amountSourceEnum = StrategyAmountSource.CALLDATA
    } else if (amountSource === 'MSG_VALUE') {
      amountSourceEnum = StrategyAmountSource.MSG_VALUE
    } else {
      amountSourceEnum = StrategyAmountSource.NONE
    }

    // Convert allowances to proper format
    const formattedAllowances = requiresAllowance ? allowances.map(a => ({
      token: a.token as `0x${string}`,
      spender: a.spender as `0x${string}`,
      amount: a.amount
    })) : []

    onChange?.({
      target: contractAddress as `0x${string}`,
      selector: selector,
      amountIndex: amountSource === 'CALLDATA' ? parseInt(amountIndex) : 0,
      isPayable: isPayable,
      amountSource: amountSourceEnum,
      // Additional metadata for the page component
      functionArgs,
      abi: functions,
      selectedFunction,
      requiresDeposit,
      depositTokenAddress: depositTokenAddress as `0x${string}` | undefined,
      depositAmount,
      msgValue,
      requiresAllowance,
      allowances: formattedAllowances
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
    functions,
    isPayable,
    onChange
  ])

  return (
    <div className="w-full border-2 border-border rounded-lg p-6 bg-card relative mt-0 shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all">
      {/* Header with icon and menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-accent px-3 py-1.5 rounded-full border border-accent">
            <Code2 className="h-4 w-4 text-card font-bold" />
            <span className="text-xs font-bold text-card tracking-widest">ACTION</span>
          </div>
          <span className="text-sm font-bold text-accent">2.</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-accent hover:text-accent/80">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4 font-medium">
        Select the event for your automation to run
      </p>

      {/* Content - Hidden by default, shown on expand */}
      {isExpanded && (
        <div className="space-y-4 border-t border-accent/30 pt-4">
          {/* Step 1: Contract Address */}
          {step >= 1 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  1
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">TARGET CONTRACT</label>
              </div>
              <Input
                placeholder="0x..."
                value={contractAddress}
                onChange={(e) => handleContractAddressChange(e.target.value)}
                className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Step 2: ABI Input */}
          {step >= 2 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  2
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">CONTRACT ABI</label>
              </div>
              <Textarea
                placeholder='Paste your contract ABI JSON here...'
                value={abiInput}
                onChange={(e) => setAbiInput(e.target.value)}
                className="font-mono text-xs min-h-20 bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={parseABI}
                disabled={!contractAddress || !abiInput}
                className="w-full bg-accent text-card hover:bg-accent/90 font-bold text-xs"
              >
                PARSE ABI
              </Button>
            </div>
          )}

          {/* Step 3: Function Selector */}
          {step >= 3 && functions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  3
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">SELECT FUNCTION</label>
              </div>
              <Select value={selectedFunction} onValueChange={handleFunctionSelect}>
                <SelectTrigger className="bg-muted border-accent/40 text-foreground">
                  <SelectValue placeholder="Choose function..." />
                </SelectTrigger>
                <SelectContent>
                  {functions.map((func) => (
                    <SelectItem key={func.name} value={func.name}>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span>{func.name}</span>
                        {func.stateMutability === 'payable' && (
                          <span className="text-xs bg-accent text-card px-2 py-0.5 rounded font-bold">
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
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  4
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">FUNCTION ARGUMENTS</label>
              </div>
              {selectedFunctionData.inputs && selectedFunctionData.inputs.length > 0 ? (
                <div className="space-y-2">
                  {selectedFunctionData.inputs?.map((input: any, idx: number) => (
                    <div key={`${input.name}-${idx}`}>
                      <label className="text-xs text-accent font-bold mb-1 block">
                        {input.name || `arg${idx}`}
                        <span className="text-muted-foreground font-normal"> ({input.type})</span>
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
                        className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No arguments required</p>
              )}
            </div>
          )}

          {/* Step 5: Amount Source */}
          {step >= 4 && selectedFunctionData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  5
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">AMOUNT SOURCE</label>
              </div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Where should the transaction amount come from?
              </p>
              <Select value={amountSource} onValueChange={(val) => {
                setAmountSource(val)
                setAmountIndex('')
                setMsgValue('')
                setStep(5)
              }}>
                <SelectTrigger className="bg-muted border-accent/40 text-foreground">
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
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  6
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">AMOUNT ARGUMENT INDEX</label>
              </div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Which argument represents the amount?
              </p>
              <Select value={amountIndex} onValueChange={(val) => {
                setAmountIndex(val)
                setStep(6)
              }}>
                <SelectTrigger className="bg-muted border-accent/40 text-foreground">
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
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  6
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">ETH VALUE (Wei)</label>
              </div>
              <Input
                placeholder="Enter amount in Wei"
                value={msgValue}
                onChange={(e) => {
                  setMsgValue(e.target.value)
                  setStep(6)
                }}
                className="bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground font-mono text-xs"
              />
            </div>
          )}

          {/* Step 6c: No input if NONE */}
          {step >= 5 && amountSource === 'NONE' && (
            <div className="space-y-2">
              <Alert className="bg-background border-accent/50">
                <AlertCircle className="h-4 w-4 text-accent" />
                <AlertDescription className="text-xs text-muted-foreground">
                  No amount will be transferred with this action.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 7: Deposit Requirements */}
          {((step >= 6 && amountSource !== '') || (step >= 5 && amountSource === 'NONE')) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  7
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">DEPOSIT REQUIREMENTS</label>
              </div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Does this action require depositing tokens or ETH to the vault?
              </p>
              <Select value={requiresDeposit} onValueChange={(val) => {
                setRequiresDeposit(val as 'ERC20' | 'ETH' | 'NONE')
                setDepositTokenAddress('')
                setDepositAmount('')
              }}>
                <SelectTrigger className="bg-muted border-accent/40 text-foreground">
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
                <label className="text-xs font-bold text-accent tracking-wider">TOKEN ADDRESS</label>
                <Input
                  placeholder="0x..."
                  value={depositTokenAddress}
                  onChange={(e) => setDepositTokenAddress(e.target.value)}
                  className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
                />
                {depositTokenAddress && (!depositTokenAddress.startsWith('0x') || depositTokenAddress.length !== 42) && (
                  <p className="text-xs text-destructive">
                    Invalid token address. Must be a 42-character hex address starting with 0x.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-accent tracking-wider">DEPOSIT AMOUNT</label>
                <Input
                  placeholder="Amount in Wei"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Step 8b: ETH Amount */}
          {requiresDeposit === 'ETH' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent tracking-wider">DEPOSIT AMOUNT (Wei)</label>
              <Input
                placeholder="Amount in Wei"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Step 9: Token Allowances */}
          {((step >= 6 && amountSource !== '') || (step >= 5 && amountSource === 'NONE')) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                  8
                </div>
                <label className="text-xs font-bold text-accent tracking-wider">TOKEN ALLOWANCES</label>
              </div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">
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
                <SelectTrigger className="bg-muted border-accent/40 text-foreground">
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
                <div key={idx} className="space-y-2 p-4 border border-accent/30 rounded-lg bg-background/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-accent tracking-wider">
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
                    <label className="text-xs font-bold text-accent tracking-wider">TOKEN ADDRESS</label>
                    <Input
                      placeholder="0x... (ERC20 token to approve)"
                      value={allowance.token}
                      onChange={(e) => {
                        const newAllowances = [...allowances]
                        newAllowances[idx].token = e.target.value
                        setAllowances(newAllowances)
                      }}
                      className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
                    />
                    {allowance.token && (!allowance.token.startsWith('0x') || allowance.token.length !== 42) && (
                      <p className="text-xs text-destructive">
                        Invalid token address. Must be a 42-character hex address starting with 0x.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-accent tracking-wider">SPENDER ADDRESS</label>
                    <Input
                      placeholder="0x... (e.g., Uniswap Router)"
                      value={allowance.spender}
                      onChange={(e) => {
                        const newAllowances = [...allowances]
                        newAllowances[idx].spender = e.target.value
                        setAllowances(newAllowances)
                      }}
                      className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
                    />
                    {allowance.spender && (!allowance.spender.startsWith('0x') || allowance.spender.length !== 42) && (
                      <p className="text-xs text-destructive">
                        Invalid spender address. Must be a 42-character hex address starting with 0x.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-accent tracking-wider">APPROVAL AMOUNT</label>
                    <Input
                      placeholder="Amount in Wei (use max uint256 for unlimited)"
                      value={allowance.amount}
                      onChange={(e) => {
                        const newAllowances = [...allowances]
                        newAllowances[idx].amount = e.target.value
                        setAllowances(newAllowances)
                      }}
                      className="font-mono text-xs bg-muted border-accent/40 text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
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
                className="w-full border-accent/40 text-accent hover:bg-accent/10"
                onClick={() => {
                  setAllowances(prev => [...prev, { token: '', spender: '', amount: '' }])
                }}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Another Allowance
              </Button>
            </div>
          )}

          {functions.length === 0 && step >= 3 && (
            <Alert className="bg-background border-destructive/50">
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
          className="w-full text-left text-xs text-accent hover:text-accent/80 font-bold tracking-wide mt-2"
        >
          ► CONFIGURE ACTION
        </button>
      ) : (
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full text-left text-xs text-muted-foreground hover:text-accent mt-4 font-medium tracking-wide"
        >
          ▼ HIDE DETAILS
        </button>
      )}
    </div>
  )
}
