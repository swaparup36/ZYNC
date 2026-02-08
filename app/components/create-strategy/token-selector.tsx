'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TOKEN_LIST, TokenInfo, isKnownToken } from '@/lib/actions/uniswap'
import { cn } from '@/lib/utils'
import { AlertCircle, ChevronDown } from 'lucide-react'

interface TokenSelectorProps {
  value: `0x${string}` | ''
  onChange: (address: `0x${string}`) => void
  label: string
  excludeAddress?: `0x${string}` | ''
  className?: string
  error?: string
}

export function TokenSelector({
  value,
  onChange,
  label,
  excludeAddress,
  className,
  error,
}: TokenSelectorProps) {
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customAddress, setCustomAddress] = useState('')

  const availableTokens = TOKEN_LIST.filter(
    (token) => !excludeAddress || token.address.toLowerCase() !== excludeAddress.toLowerCase()
  )

  const selectedToken = value ? TOKEN_LIST.find(
    (t) => t.address.toLowerCase() === value.toLowerCase()
  ) : null

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'custom') {
      setShowCustomInput(true)
      return
    }
    setShowCustomInput(false)
    setCustomAddress('')
    onChange(selectedValue as `0x${string}`)
  }

  const handleCustomAddressChange = (address: string) => {
    setCustomAddress(address)
    if (address.startsWith('0x') && address.length === 42) {
      onChange(address as `0x${string}`)
    }
  }

  const isCustomToken = value && !isKnownToken(value)

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-xs font-bold text-white tracking-wider">{label}</label>
      
      <Select
        value={isCustomToken ? 'custom' : value || undefined}
        onValueChange={handleSelectChange}
      >
        <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white w-full">
          <SelectValue placeholder="Select token...">
            {selectedToken ? (
              <div className="flex items-center gap-2">
                <TokenIcon symbol={selectedToken.symbol} />
                <span className="font-medium">{selectedToken.symbol}</span>
                <span className="text-zinc-400 text-xs">{selectedToken.name}</span>
              </div>
            ) : isCustomToken ? (
              <div className="flex items-center gap-2">
                <TokenIcon symbol="?" />
                <span className="font-mono text-xs">{value?.slice(0, 10)}...{value?.slice(-6)}</span>
              </div>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableTokens.map((token) => (
            <SelectItem key={token.address} value={token.address}>
              <div className="flex items-center gap-2">
                <TokenIcon symbol={token.symbol} />
                <span className="font-medium">{token.symbol}</span>
                <span className="text-zinc-400 text-xs">{token.name}</span>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="custom">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
                +
              </div>
              <span className="font-medium">Custom Token</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {(showCustomInput || isCustomToken) && (
        <Input
          placeholder="Enter token address (0x...)"
          value={customAddress || (isCustomToken ? value : '')}
          onChange={(e) => handleCustomAddressChange(e.target.value)}
          className="font-mono text-xs bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
        />
      )}

      {error && (
        <div className="flex items-center gap-1 text-destructive text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

function TokenIcon({ symbol }: { symbol: string }) {
  const colors: Record<string, string> = {
    WETH: 'bg-blue-500',
    USDC: 'bg-green-500',
    DAI: 'bg-yellow-500',
    UNI: 'bg-pink-500',
    LINK: 'bg-purple-500',
  }

  return (
    <div
      className={cn(
        'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white',
        colors[symbol] || 'bg-gray-500'
      )}
    >
      {symbol.charAt(0)}
    </div>
  )
}
