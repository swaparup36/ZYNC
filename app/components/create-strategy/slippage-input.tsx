'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface SlippageInputProps {
  value: number
  onChange: (bps: number) => void
  className?: string
}

const PRESET_SLIPPAGES = [
  { label: '0.1%', bps: 10 },
  { label: '0.5%', bps: 50 },
  { label: '1%', bps: 100 },
  { label: '3%', bps: 300 },
]

export function SlippageInput({ value, onChange, className }: SlippageInputProps) {
  const [customMode, setCustomMode] = useState(false)
  const [customValue, setCustomValue] = useState('')

  // Check if current value matches a preset
  const matchedPreset = PRESET_SLIPPAGES.find((p) => p.bps === value)
  const isCustomValue = !matchedPreset && value > 0

  const handlePresetClick = (bps: number) => {
    setCustomMode(false)
    setCustomValue('')
    onChange(bps)
  }

  const handleCustomToggle = () => {
    setCustomMode(true)
    if (isCustomValue) {
      setCustomValue((value / 100).toString())
    }
  }

  const handleCustomChange = (inputValue: string) => {
    setCustomValue(inputValue)
    
    const parsed = parseFloat(inputValue)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
      onChange(Math.round(parsed * 100))
    }
  }

  // Warning thresholds
  const isHighSlippage = value > 500
  const isVeryHighSlippage = value > 1000

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-white tracking-wider">SLIPPAGE TOLERANCE</label>
        <span className="text-xs font-mono text-white">{(value / 100).toFixed(2)}%</span>
      </div>
      
      <div className="flex gap-2">
        {PRESET_SLIPPAGES.map((preset) => (
          <button
            key={preset.bps}
            type="button"
            onClick={() => handlePresetClick(preset.bps)}
            className={cn(
              'flex-1 px-3 py-2 text-xs font-bold rounded-md transition-all duration-200 border',
              value === preset.bps && !customMode
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
            )}
          >
            {preset.label}
          </button>
        ))}
        
        <button
          type="button"
          onClick={handleCustomToggle}
          className={cn(
            'flex-1 px-3 py-2 text-xs font-bold rounded-md transition-all duration-200 border',
            (customMode || isCustomValue)
              ? 'bg-white text-black border-white'
              : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
          )}
        >
          Custom
        </button>
      </div>

      {(customMode || isCustomValue) && (
        <div className="relative">
          <Input
            type="number"
            step="0.1"
            min="0"
            max="50"
            placeholder="Enter slippage %"
            value={customValue || (isCustomValue ? (value / 100).toString() : '')}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500 pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            %
          </span>
        </div>
      )}

      {isHighSlippage && (
        <div className={cn(
          'flex items-center gap-2 p-2 rounded-md text-xs',
          isVeryHighSlippage 
            ? 'bg-destructive/10 text-destructive border border-destructive/20' 
            : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
        )}>
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>
            {isVeryHighSlippage
              ? 'Very high slippage. Your transaction may be frontrun and result in significant losses.'
              : 'High slippage tolerance. Consider lowering to reduce potential losses.'}
          </span>
        </div>
      )}

      <p className="text-[10px] text-zinc-400">
        Maximum price difference you're willing to accept for this trade.
      </p>
    </div>
  )
}
