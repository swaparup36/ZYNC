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
      <DialogContent className="sm:max-w-md bg-black border-2 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white tracking-widest font-bold">
            {depositComplete ? 'DEPOSIT COMPLETE' : 'DEPOSIT REQUIRED'}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
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
                  <span className="text-xs font-bold text-white tracking-wider">TYPE</span>
                  <span className="font-mono text-sm text-white">{depositType}</span>
                </div>
                {depositType === 'ERC20' && tokenAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white tracking-wider">TOKEN</span>
                    <span className="font-mono text-xs text-white truncate max-w-50">
                      {tokenAddress}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white tracking-wider">AMOUNT</span>
                  <span className="font-mono text-sm text-white">{amount} Wei</span>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3">
                <p className="text-xs text-zinc-400">
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
              <p className="text-sm text-zinc-400 text-center">
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
                className="border-zinc-600 text-white hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="bg-white text-black hover:bg-white/90"
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
              className="bg-white text-black hover:bg-white/90"
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
              className="bg-white text-black hover:bg-white/90"
            >
              Retry
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
