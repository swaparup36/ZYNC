'use client'

import React, { createContext, useContext, useState } from 'react'

interface Condition {
  oracle: string
  operator: string
  value: string
}

interface Action {
  contractAddress: string
  abi: any[]
  selectedFunction: string
  functionArgs: Record<string, string>
  amountIndex?: string
  ethValue?: string
}

interface Safety {
  maxAmount: string
  cooldown: string
  expiry: string
}

interface AutomationState {
  condition: Condition | null
  action: Action | null
  safety: Safety | null
  setCondition: (condition: Condition) => void
  setAction: (action: Action) => void
  setSafety: (safety: Safety) => void
  reset: () => void
}

const AutomationContext = createContext<AutomationState | undefined>(undefined)

export function AutomationProvider({ children }: { children: React.ReactNode }) {
  const [condition, setCondition] = useState<Condition | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [safety, setSafety] = useState<Safety | null>(null)

  const reset = () => {
    setCondition(null)
    setAction(null)
    setSafety(null)
  }

  return (
    <AutomationContext.Provider
      value={{
        condition,
        action,
        safety,
        setCondition,
        setAction,
        setSafety,
        reset,
      }}
    >
      {children}
    </AutomationContext.Provider>
  )
}

export function useAutomation() {
  const context = useContext(AutomationContext)
  if (context === undefined) {
    throw new Error('useAutomation must be used within AutomationProvider')
  }
  return context
}
