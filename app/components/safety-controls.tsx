'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield } from 'lucide-react'

interface SafetyControlsProps {
  onChange?: (controls: any) => void
}

export function SafetyControls({ onChange }: SafetyControlsProps) {
  const [values, setValues] = useState({
    maxAmount: '',
    cooldown: '',
    expiry: '',
  })

  const handleFieldChange = (field: keyof typeof values, value: string) => {
    const newValues = {
      ...values,
      [field]: value,
    }
    setValues(newValues)
    onChange?.(newValues)
  }

  return (
    <Card className="p-6 border border-zinc-700 bg-black">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded bg-white flex items-center justify-center">
          <Shield className="h-4 w-4 text-black font-bold" />
        </div>
        <h2 className="text-sm font-bold text-white tracking-widest">SAFETY CONTROLS</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-white mb-2 block tracking-wider">
            MAX AMOUNT (HARD CAP)
          </label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="e.g., 1.0"
              value={values.maxAmount}
              onChange={(e) => handleFieldChange('maxAmount', e.target.value)}
              step="0.001"
              className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Maximum amount that can be used in a single execution
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-white mb-2 block tracking-wider">
            COOLDOWN (SECONDS)
          </label>
          <Input
            type="number"
            placeholder="e.g., 3600"
            value={values.cooldown}
            onChange={(e) => handleFieldChange('cooldown', e.target.value)}
            className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
          />
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Minimum time between executions
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-white mb-2 block tracking-wider">
            EXPIRY (SECONDS)
          </label>
          <Input
            type="number"
            placeholder="e.g., 604800"
            value={values.expiry}
            onChange={(e) => handleFieldChange('expiry', e.target.value)}
            className="bg-zinc-900 border-zinc-600 text-white placeholder:text-zinc-500"
          />
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            How long this strategy remains active (604800 = 7 days)
          </p>
        </div>

        {/* Explanation */}
        <div className="mt-6 p-3 bg-zinc-900 rounded border border-zinc-700">
          <p className="text-xs font-bold text-white mb-2 tracking-widest">WHAT THESE DO:</p>
          <ul className="text-xs text-zinc-400 space-y-1 font-medium">
            <li>
              <span className="text-white font-bold">MAX:</span> Ensures no single execution exceeds this limit
            </li>
            <li>
              <span className="text-white font-bold">COOLDOWN:</span> Prevents execution spam
            </li>
            <li>
              <span className="text-white font-bold">EXPIRY:</span> Strategy automatically deactivates
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
