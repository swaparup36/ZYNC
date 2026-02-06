'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TokenSelector } from './token-selector'
import { SlippageInput } from './slippage-input'
import { 
  buildUniversalRouterSwapAction, 
  parseTokenAmount, 
  getTokenByAddress,
  UNIVERSAL_ROUTER_ADDRESS,
  TOKEN_LIST,
} from '@/lib/actions/uniswap'
import { StrategyAction } from '@/types/types'
import { cn } from '@/lib/utils'
import { ArrowDown, Code2, MoreVertical, Settings2, RefreshCw } from 'lucide-react'

export interface UniswapSwapFormValue {
  tokenIn: `0x${string}` | ''
  tokenOut: `0x${string}` | ''
  amountIn: string
  slippageBps: number
  feeTier: number
}

interface UniswapSwapFormProps {
  vaultAddress: `0x${string}` | null
  onChange?: (action: StrategyAction | null) => void
  className?: string
}

const FEE_TIERS = [
  { value: 100, label: '0.01%', description: 'Best for stable pairs' },
  { value: 500, label: '0.05%', description: 'Best for stable pairs' },
  { value: 3000, label: '0.3%', description: 'Best for most pairs' },
  { value: 10000, label: '1%', description: 'Best for exotic pairs' },
]

export function UniswapSwapForm({ vaultAddress, onChange, className }: UniswapSwapFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const [tokenIn, setTokenIn] = useState<`0x${string}` | ''>('')
  const [tokenOut, setTokenOut] = useState<`0x${string}` | ''>('')
  const [amountIn, setAmountIn] = useState('')
  const [slippageBps, setSlippageBps] = useState(50)
  const [feeTier, setFeeTier] = useState(3000)

  // Derived state
  const tokenInInfo = tokenIn ? getTokenByAddress(tokenIn) : null
  const tokenOutInfo = tokenOut ? getTokenByAddress(tokenOut) : null

  useEffect(() => {
    // Validate all required fields
    if (!tokenIn || !tokenOut || !amountIn || !vaultAddress) {
      onChange?.(null)
      return
    }

    // Get token info
    const inputToken = getTokenByAddress(tokenIn)
    const decimals = inputToken?.decimals ?? 18

    console.log('UniswapSwapForm effect - token info:', {
      tokenIn,
      inputToken: inputToken?.symbol,
      decimals,
      amountIn,
    })

    // Parse amount
    let amountInBigInt: bigint
    try {
      amountInBigInt = parseTokenAmount(amountIn, decimals)
      console.log('Parsed amount:', {
        amountIn,
        decimals,
        amountInBigInt: amountInBigInt.toString(),
      })
      if (amountInBigInt <= BigInt(0)) {
        onChange?.(null)
        return
      }
    } catch {
      onChange?.(null)
      return
    }

    // Validate tokens are different
    if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
      onChange?.(null)
      return
    }

    // Build the action
    try {
      const action = buildUniversalRouterSwapAction({
        tokenIn,
        tokenOut,
        amountIn: amountInBigInt,
        slippageBps,
        recipient: vaultAddress,
        fee: feeTier,
      })

      // Add deposit metadata for the parent component
      const actionWithMetadata = {
        ...action,
        requiresDeposit: 'ERC20' as const,
        depositTokenAddress: tokenIn,
        depositAmount: amountInBigInt.toString(),
      }

      onChange?.(actionWithMetadata)
    } catch (error) {
      console.error('Error building Uniswap action:', error)
      onChange?.(null)
    }
  }, [tokenIn, tokenOut, amountIn, slippageBps, feeTier, vaultAddress, onChange])

  const handleSwapTokens = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    setAmountIn('')
  }

  const isValid = tokenIn && tokenOut && amountIn && parseFloat(amountIn) > 0 && tokenIn !== tokenOut

  return (
    <div className={cn(
      'w-full border-2 border-border rounded-lg p-6 bg-card relative mt-0 shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-accent px-3 py-1.5 rounded-full border border-accent">
            <RefreshCw className="h-4 w-4 text-card font-bold" />
            <span className="text-xs font-bold text-card tracking-widest">SWAP</span>
          </div>
          <span className="text-sm font-bold text-accent">UNISWAP</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-accent hover:text-accent/80"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-accent hover:text-accent/80">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4 font-medium">
        Swap tokens via Uniswap V3 Universal Router
      </p>

      {/* Expand/Collapse */}
      {!isExpanded && (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(true)}
          className="w-full bg-accent/5 border border-dashed border-accent/30 text-accent hover:bg-accent/10 py-6"
        >
          <span className="text-xs font-bold tracking-wider">CONFIGURE SWAP</span>
        </Button>
      )}

      {isExpanded && (
        <div className="space-y-4 border-t border-accent/30 pt-4">
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-muted/50 rounded-lg border border-accent/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-accent tracking-wider">SWAP SETTINGS</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSettings(false)}
                >
                  ✕
                </Button>
              </div>
              
              <SlippageInput
                value={slippageBps}
                onChange={setSlippageBps}
              />

              <div className="space-y-2">
                <label className="text-xs font-bold text-accent tracking-wider">FEE TIER</label>
                <Select value={feeTier.toString()} onValueChange={(v) => setFeeTier(parseInt(v))}>
                  <SelectTrigger className="bg-muted border-accent/40 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_TIERS.map((tier) => (
                      <SelectItem key={tier.value} value={tier.value.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{tier.label}</span>
                          <span className="text-muted-foreground text-xs">{tier.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Token In */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                1
              </div>
              <label className="text-xs font-bold text-accent tracking-wider">YOU PAY</label>
            </div>
            
            <div className="bg-muted rounded-lg p-4 border border-accent/20">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={amountIn}
                    onChange={(e) => {
                      // Allow only valid decimal input
                      const val = e.target.value
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setAmountIn(val)
                      }
                    }}
                    className="font-mono text-2xl bg-transparent border-0 p-0 h-auto text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                  />
                </div>
                <div className="w-40">
                  <TokenSelector
                    value={tokenIn}
                    onChange={setTokenIn}
                    label=""
                    excludeAddress={tokenOut}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <button
              type="button"
              onClick={handleSwapTokens}
              className="h-10 w-10 rounded-full bg-card border-2 border-accent/40 flex items-center justify-center text-accent hover:bg-accent hover:text-card transition-colors shadow-md"
              disabled={!tokenIn || !tokenOut}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Token Out */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-card">
                2
              </div>
              <label className="text-xs font-bold text-accent tracking-wider">YOU RECEIVE</label>
            </div>
            
            <div className="bg-muted rounded-lg p-4 border border-accent/20">
              <TokenSelector
                value={tokenOut}
                onChange={setTokenOut}
                label=""
                excludeAddress={tokenIn}
              />
            </div>
          </div>

          {/* Slippage Quick Settings (when settings panel closed) */}
          {!showSettings && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Slippage Tolerance</span>
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="font-mono text-accent hover:underline"
              >
                {(slippageBps / 100).toFixed(2)}%
              </button>
            </div>
          )}

          {/* Swap Summary */}
          {isValid && (
            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Route</span>
                <span className="font-mono text-foreground">
                  {tokenInInfo?.symbol || 'Token'} → {tokenOutInfo?.symbol || 'Token'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Fee Tier</span>
                <span className="font-mono text-foreground">
                  {FEE_TIERS.find(t => t.value === feeTier)?.label || '0.3%'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Router</span>
                <span className="font-mono text-foreground text-[10px]">
                  {UNIVERSAL_ROUTER_ADDRESS.slice(0, 10)}...{UNIVERSAL_ROUTER_ADDRESS.slice(-6)}
                </span>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t border-accent/20">
            <span className="text-xs text-muted-foreground">Action Status</span>
            <span className={cn(
              'px-2 py-1 text-[10px] font-bold rounded-full tracking-wider',
              isValid 
                ? 'bg-accent text-card' 
                : 'bg-muted text-muted-foreground'
            )}>
              {isValid ? 'READY' : 'INCOMPLETE'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
