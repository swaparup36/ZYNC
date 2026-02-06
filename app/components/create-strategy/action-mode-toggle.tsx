'use client'

import { cn } from '@/lib/utils'

export type ActionMode = 'custom' | 'prebuilt'

interface ActionModeToggleProps {
  value: ActionMode
  onChange: (mode: ActionMode) => void
  className?: string
}

export function ActionModeToggle({ value, onChange, className }: ActionModeToggleProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-accent tracking-[0.3em]">ACTION MODE</span>
      </div>
      
      <div className="inline-flex h-10 w-full p-1 bg-muted rounded-lg border border-accent/20">
        <button
          type="button"
          onClick={() => onChange('custom')}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-wider rounded-md transition-all duration-200',
            value === 'custom'
              ? 'bg-accent text-card shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          CUSTOM
        </button>
        
        <button
          type="button"
          onClick={() => onChange('prebuilt')}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-wider rounded-md transition-all duration-200',
            value === 'prebuilt'
              ? 'bg-accent text-card shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          PREBUILT
        </button>
      </div>
      
      <p className="mt-2 text-[10px] text-muted-foreground">
        {value === 'custom' 
          ? 'Configure a custom contract interaction with full control over parameters.'
          : 'Use pre-configured DeFi actions like Uniswap swaps with simplified settings.'}
      </p>
    </div>
  )
}
