'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TokenSelector } from './token-selector'
import { 
  buildV2RouterSwapAction, 
  parseTokenAmount, 
  getTokenByAddress,
  UNISWAP_V2_ROUTER_ADDRESS,
} from '@/lib/actions/uniswap'
import { StrategyAction } from '@/types/types'
import { cn } from '@/lib/utils'
import { ArrowDown, MoreVertical, RefreshCw } from 'lucide-react'

export interface UniswapSwapFormValue {
  tokenIn: `0x${string}` | ''
  tokenOut: `0x${string}` | ''
  amountIn: string
  amountOutMin: string
}

interface UniswapSwapFormProps {
  vaultAddress: `0x${string}` | null
  onChange?: (action: StrategyAction | null) => void
  className?: string
}

export function UniswapSwapForm({ vaultAddress, onChange, className }: UniswapSwapFormProps) {
  const { address: connectedWallet } = useAccount()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const [tokenIn, setTokenIn] = useState<`0x${string}` | ''>('')
  const [tokenOut, setTokenOut] = useState<`0x${string}` | ''>('')
  const [amountIn, setAmountIn] = useState('')
  const [amountOutMin, setAmountOutMin] = useState('')

  // Derived state
  const tokenInInfo = tokenIn ? getTokenByAddress(tokenIn) : null
  const tokenOutInfo = tokenOut ? getTokenByAddress(tokenOut) : null

  useEffect(() => {
    // Validate all required fields
    if (!tokenIn || !tokenOut || !amountIn || !amountOutMin || !vaultAddress || !connectedWallet) {
      onChange?.(null)
      return
    }

    // Get token info
    const inputToken = getTokenByAddress(tokenIn)
    const outputToken = getTokenByAddress(tokenOut)
    const decimalsIn = inputToken?.decimals ?? 18
    const decimalsOut = outputToken?.decimals ?? 18

    console.log('UniswapSwapForm effect - token info:', {
      tokenIn,
      inputToken: inputToken?.symbol,
      decimalsIn,
      amountIn,
      amountOutMin,
    })

    // Parse amounts
    let amountInBigInt: bigint
    let amountOutMinBigInt: bigint
    try {
      amountInBigInt = parseTokenAmount(amountIn, decimalsIn)
      amountOutMinBigInt = parseTokenAmount(amountOutMin, decimalsOut)
      console.log('Parsed amounts:', {
        amountIn,
        decimalsIn,
        amountInBigInt: amountInBigInt.toString(),
        amountOutMin,
        decimalsOut,
        amountOutMinBigInt: amountOutMinBigInt.toString(),
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
      const action = buildV2RouterSwapAction({
        tokenIn,
        tokenOut,
        amountIn: amountInBigInt,
        amountOutMin: amountOutMinBigInt,
        recipient: connectedWallet,
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
  }, [tokenIn, tokenOut, amountIn, amountOutMin, vaultAddress, connectedWallet, onChange])

  const handleSwapTokens = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    setAmountIn('')
    setAmountOutMin('')
  }

  const isValid = tokenIn && tokenOut && amountIn && amountOutMin && parseFloat(amountIn) > 0 && tokenIn !== tokenOut

  return (
    <div className={cn(
      'w-full border-2 border-zinc-700 rounded-lg p-6 bg-black relative mt-0 shadow-lg shadow-white/10 hover:shadow-white/20 transition-all',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-white">
            <RefreshCw className="h-4 w-4 text-black font-bold" />
            <span className="text-xs font-bold text-black tracking-widest">SWAP</span>
          </div>
          <span className="text-sm font-bold text-white">UNISWAP</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:text-white/80">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-400 mb-4 font-medium">
        Swap tokens via Uniswap V2 Universal Router
      </p>

      {/* Expand/Collapse */}
      {!isExpanded && (
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(true)}
          className="w-full bg-zinc-900 border border-dashed border-zinc-600 text-white hover:bg-zinc-800 py-6"
        >
          <span className="text-xs font-bold tracking-wider">CONFIGURE SWAP</span>
        </Button>
      )}

      {isExpanded && (
        <div className="space-y-4 border-t border-zinc-700 pt-4">

          {/* Token In */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                1
              </div>
              <label className="text-xs font-bold text-white tracking-wider">YOU PAY</label>
            </div>
            
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
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
                    className="font-mono text-2xl bg-transparent border-0 p-0 h-auto text-white placeholder:text-zinc-500 focus-visible:ring-0"
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
              className="h-10 w-10 rounded-full bg-black border-2 border-zinc-600 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors shadow-md"
              disabled={!tokenIn || !tokenOut}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Token Out */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black">
                2
              </div>
              <label className="text-xs font-bold text-white tracking-wider">YOU RECEIVE</label>
            </div>
            
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Min. amount out"
                    value={amountOutMin}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setAmountOutMin(val)
                      }
                    }}
                    className="font-mono text-2xl bg-transparent border-0 p-0 h-auto text-white placeholder:text-zinc-500 focus-visible:ring-0"
                  />
                  <span className="text-xs text-zinc-400">Minimum amount to receive</span>
                </div>
                <div className="w-40">
                  <TokenSelector
                    value={tokenOut}
                    onChange={setTokenOut}
                    label=""
                    excludeAddress={tokenIn}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Swap Summary */}
          {isValid && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Route</span>
                <span className="font-mono text-white">
                  {tokenInInfo?.symbol || 'Token'} → {tokenOutInfo?.symbol || 'Token'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Fee</span>
                <span className="font-mono text-white">0.3% (V2)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Router</span>
                <span className="font-mono text-white text-[10px]">
                  {UNISWAP_V2_ROUTER_ADDRESS.slice(0, 10)}...{UNISWAP_V2_ROUTER_ADDRESS.slice(-6)}
                </span>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
            <span className="text-xs text-zinc-400">Action Status</span>
            <span className={cn(
              'px-2 py-1 text-[10px] font-bold rounded-full tracking-wider',
              isValid 
                ? 'bg-white text-black' 
                : 'bg-zinc-800 text-zinc-400'
            )}>
              {isValid ? 'READY' : 'INCOMPLETE'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
