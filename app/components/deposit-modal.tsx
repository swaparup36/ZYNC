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
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  depositType: 'ERC20' | 'ETH'
  tokenAddress?: string
  amount: string
  onDeposit: () => Promise<void>
}

export function DepositModal({
  isOpen,
  onClose,
  depositType,
  tokenAddress,
  amount,
  onDeposit,
}: DepositModalProps) {
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositComplete, setDepositComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeposit = async () => {
    setIsDepositing(true)
    setError(null)
    try {
      await onDeposit()
      setDepositComplete(true)
    } catch (err: any) {
      setError(err.message || 'Deposit failed')
      setIsDepositing(false)
    }
  }

  const handleClose = () => {
    if (!isDepositing) {
      setDepositComplete(false)
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-2 border-accent/40">
        <DialogHeader>
          <DialogTitle className="text-accent tracking-widest font-bold">
            {depositComplete ? 'DEPOSIT COMPLETE' : 'DEPOSIT REQUIRED'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {depositComplete
              ? 'Your deposit has been successfully processed.'
              : 'This action requires depositing funds to your vault.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!depositComplete && !error && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-accent tracking-wider">TYPE</span>
                  <span className="font-mono text-sm text-foreground">{depositType}</span>
                </div>
                {depositType === 'ERC20' && tokenAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-accent tracking-wider">TOKEN</span>
                    <span className="font-mono text-xs text-foreground truncate max-w-50">
                      {tokenAddress}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-accent tracking-wider">AMOUNT</span>
                  <span className="font-mono text-sm text-foreground">{amount} Wei</span>
                </div>
              </div>

              <div className="bg-muted/50 border border-accent/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  {depositType === 'ERC20'
                    ? 'You will be prompted to sign transactions to approve and deposit ERC20 tokens to your vault. Ensure the token address is valid and deployed on the current network.'
                    : 'You will be prompted to sign a transaction to deposit ETH to your vault.'}
                </p>
              </div>
            </>
          )}

          {depositComplete && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-sm text-muted-foreground text-center">
                Funds have been deposited to your vault. You can now proceed with strategy creation.
              </p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <p className="text-sm text-destructive text-center">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {!depositComplete && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDepositing}
                className="border-accent text-accent hover:bg-accent/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="bg-accent text-card hover:bg-accent/90"
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  'Deposit Funds'
                )}
              </Button>
            </>
          )}
          {depositComplete && (
            <Button
              onClick={handleClose}
              className="bg-accent text-card hover:bg-accent/90"
            >
              Continue
            </Button>
          )}
          {error && (
            <Button
              onClick={() => {
                setError(null)
                handleDeposit()
              }}
              className="bg-accent text-card hover:bg-accent/90"
            >
              Retry
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
