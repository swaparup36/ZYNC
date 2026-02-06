'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { getTokenByAddress, formatTokenAmount } from '@/lib/actions/uniswap'

export interface ApprovalStep {
  token: `0x${string}`
  spender: `0x${string}`
  amount: bigint
  status: 'pending' | 'approving' | 'approved' | 'error'
  error?: string
}

interface ApproveModalProps {
  isOpen: boolean
  onClose: () => void
  approvals: ApprovalStep[]
  onApprove: (tokenAddress: `0x${string}`, spender: `0x${string}`, amount: bigint) => Promise<void>
  onComplete: () => void
}

export function ApproveModal({
  isOpen,
  onClose,
  approvals,
  onApprove,
  onComplete,
}: ApproveModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localApprovals, setLocalApprovals] = useState<ApprovalStep[]>(approvals)
  const [isProcessing, setIsProcessing] = useState(false)

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCurrentIndex(0)
      setLocalApprovals(approvals.map(a => ({ ...a, status: 'pending' })))
      setIsProcessing(false)
    } else if (!isProcessing) {
      onClose()
    }
  }

  const currentApproval = localApprovals[currentIndex]
  const allApproved = localApprovals.every(a => a.status === 'approved')
  const hasError = localApprovals.some(a => a.status === 'error')

  const handleApprove = async () => {
    if (!currentApproval || currentApproval.status === 'approved') return

    setIsProcessing(true)
    setLocalApprovals(prev => prev.map((a, i) => 
      i === currentIndex ? { ...a, status: 'approving' as const, error: undefined } : a
    ))

    try {
      await onApprove(currentApproval.token, currentApproval.spender, currentApproval.amount)
      
      setLocalApprovals(prev => prev.map((a, i) => 
        i === currentIndex ? { ...a, status: 'approved' as const } : a
      ))

      // Move to next approval or complete
      if (currentIndex < localApprovals.length - 1) {
        setCurrentIndex(prev => prev + 1)
      }
    } catch (error: any) {
      setLocalApprovals(prev => prev.map((a, i) => 
        i === currentIndex ? { ...a, status: 'error' as const, error: error.message || 'Approval failed' } : a
      ))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  const handleRetry = () => {
    setLocalApprovals(prev => prev.map((a, i) => 
      i === currentIndex ? { ...a, status: 'pending' as const, error: undefined } : a
    ))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-accent/40">
        <DialogHeader>
          <DialogTitle className="text-accent tracking-widest font-bold">
            {allApproved ? 'APPROVALS COMPLETE' : 'TOKEN APPROVALS REQUIRED'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {allApproved
              ? 'All token approvals have been completed. You can now create your strategy.'
              : 'The following tokens need to be approved for the strategy to work.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Approval Steps */}
          <div className="space-y-2">
            {localApprovals.map((approval, index) => {
              const tokenInfo = getTokenByAddress(approval.token)
              const isActive = index === currentIndex
              
              return (
                <div
                  key={`${approval.token}-${index}`}
                  className={`p-3 rounded-lg border transition-colors ${
                    isActive 
                      ? 'border-accent bg-accent/5' 
                      : 'border-accent/20 bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        approval.status === 'approved' 
                          ? 'bg-green-500 text-white' 
                          : approval.status === 'error'
                          ? 'bg-destructive text-white'
                          : approval.status === 'approving'
                          ? 'bg-accent text-card'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {approval.status === 'approved' ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : approval.status === 'error' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : approval.status === 'approving' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tokenInfo?.symbol || 'Token'} Approval
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {approval.token.slice(0, 10)}...{approval.token.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold tracking-wider ${
                        approval.status === 'approved' 
                          ? 'text-green-500' 
                          : approval.status === 'error'
                          ? 'text-destructive'
                          : approval.status === 'approving'
                          ? 'text-accent'
                          : 'text-muted-foreground'
                      }`}>
                        {approval.status === 'approved' && 'APPROVED'}
                        {approval.status === 'error' && 'FAILED'}
                        {approval.status === 'approving' && 'APPROVING...'}
                        {approval.status === 'pending' && 'PENDING'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {formatTokenAmount(approval.amount, tokenInfo?.decimals || 18)} {tokenInfo?.symbol || ''}
                      </p>
                    </div>
                  </div>
                  {approval.status === 'error' && approval.error && (
                    <p className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                      {approval.error}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Info Box */}
          {!allApproved && !hasError && (
            <div className="bg-muted/50 border border-accent/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                You will be prompted to sign approval transactions in your wallet. 
                This allows the vault to spend the specified tokens on your behalf.
              </p>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-mono">
              {localApprovals.filter(a => a.status === 'approved').length} / {localApprovals.length}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 border-accent text-accent hover:bg-accent/10 bg-transparent"
          >
            Cancel
          </Button>
          
          {allApproved ? (
            <Button
              onClick={handleComplete}
              className="flex-1 bg-accent text-card hover:bg-accent/90 font-bold"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : hasError && currentApproval?.status === 'error' ? (
            <Button
              onClick={handleRetry}
              className="flex-1 bg-accent text-card hover:bg-accent/90 font-bold"
            >
              Retry
            </Button>
          ) : (
            <Button
              onClick={handleApprove}
              disabled={isProcessing || currentApproval?.status === 'approved'}
              className="flex-1 bg-accent text-card hover:bg-accent/90 font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  Approve {getTokenByAddress(currentApproval?.token)?.symbol || 'Token'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
