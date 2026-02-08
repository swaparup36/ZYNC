'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Zap, MoreVertical } from 'lucide-react'
import { SEPOLIA_ORACLE_SOURCES } from '@/lib/oracles'

export interface TriggerBuilderValue {
  oracle: string
  operator: string
  value: string
}

interface TriggerBuilderProps {
  order?: number
  onChange?: (trigger: TriggerBuilderValue) => void
}

const OPERATORS = [
  { id: 'lt', label: 'is less than (<)', value: 'lt' },
  { id: 'gt', label: 'is greater than (>)', value: 'gt' },
  { id: 'eq', label: 'equals (=)', value: 'eq' },
]

export function TriggerBuilder({ onChange, order = 1 }: TriggerBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [oracle, setOracle] = useState('')
  const [operator, setOperator] = useState('gt')
  const [value, setValue] = useState('')

  const handleChange = (newOracle?: string, newOperator?: string, newValue?: string) => {
    const updatedOracle = newOracle ?? oracle
    const updatedOperator = newOperator ?? operator
    const updatedValue = newValue ?? value

    if (updatedOracle && updatedOperator && updatedValue) {
      const selectedOracle = SEPOLIA_ORACLE_SOURCES.find((s) => s.value === updatedOracle)
      const decimals = selectedOracle?.decimals || 0
      const finalValue = (parseFloat(updatedValue) * Math.pow(10, decimals)).toString()
      
      onChange?.({
        oracle: updatedOracle,
        operator: updatedOperator,
        value: finalValue,
      })
    }
  }

  const getOracleLabel = () => {
    return SEPOLIA_ORACLE_SOURCES.find((s) => s.value === oracle)?.label || 'Select oracle'
  }

  const getOperatorLabel = () => {
    return OPERATORS.find((o) => o.value === operator)?.label || 'Select operator'
  }

  return (
    <div className="w-full border border-zinc-700 rounded-lg p-6 bg-black relative rainbow-border-hover">
      {/* Header with icon and menu */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-zinc-600">
            <Zap className="h-4 w-4 text-black font-bold" />
            <span className="text-xs font-bold text-black tracking-widest">TRIGGER</span>
          </div>
          <span className="text-sm font-bold text-white">{order}.</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:text-white/80">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 mb-4 font-medium">
        Select the event that starts your automation
      </p>

      {/* Content - Hidden by default, shown on expand */}
      {isExpanded && (
        <div className="space-y-4 border-t border-zinc-700 pt-4">
          {/* Oracle Source */}
          <div>
            <label className="text-xs font-bold text-white mb-2 block tracking-wider">
              TRIGGER EVENT
            </label>
            <Select
              value={oracle}
              defaultValue='1'
              onValueChange={(val) => {
                setOracle(val)
                handleChange(val, operator, value)
              }}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEPOLIA_ORACLE_SOURCES.map((source) => (
                  <SelectItem key={source.id} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator and Value in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-white mb-2 block tracking-wider">
                CONDITION
              </label>
              <Select
                value={operator}
                onValueChange={(val) => {
                  setOperator(val)
                  handleChange(oracle, val, value)
                }}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((op) => (
                    <SelectItem key={op.id} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-white mb-2 block tracking-wider">
                VALUE
              </label>
              <Input
                type="number"
                placeholder="e.g., 2800"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  handleChange(oracle, operator, e.target.value)
                }}
                className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
                step="0.01"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-zinc-900 rounded border border-zinc-700">
            <p className="text-xs text-zinc-400 font-medium">
              {`>>> ${getOracleLabel()} ${getOperatorLabel().split('(')[0].trim()} ${value || '—'}`}
            </p>
          </div>
        </div>
      )}

      {/* Collapse/Expand button */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-left text-xs text-white hover:text-white/80 font-bold tracking-wide mt-2"
        >
          ► CONFIGURE TRIGGER
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
