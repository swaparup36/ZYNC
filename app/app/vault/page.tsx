'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Wallet, CheckCircle2, Plus } from 'lucide-react'
import ConnectWalletButton from '@/components/ui/ConnectWalletButton'
import { useAccount } from 'wagmi'
import { createVault, decodeEventLogAndReturn, getUserVaults, STRATEGY_VAULT_FACTORY_ADDRESS, waitForTx } from '@/lib/transactionHandler'

export default function SetupPage() {
  const [vaultCreated, setVaultCreated] = useState(false);
  const [vaultAddress, setVaultAddress] = useState<`0x${string}` | null>(null);
  const { address, isConnected } = useAccount();
  const [exisitngVaults, setExistingVaults] = useState<string[]>([]);
  const [isCreatingVault, setIsCreatingVault] = useState(false);
  const [isFetchingVaults, setIsFetchingVaults] = useState(false);

  const handleCreateVault = async () => {
    setIsCreatingVault(true);
    try {
      const txHash = await createVault();
      console.log("Transaction hash: ", txHash);
      const receipt = await waitForTx(txHash);
      const event = receipt.logs.find(
      (log) =>
          log.address.toLowerCase() === STRATEGY_VAULT_FACTORY_ADDRESS.toLowerCase()
      );

      if (!event) {
        console.log("VaultCreated event not found");
        alert("VaultCreated event not found");
        return;
      }

      const decoded = await decodeEventLogAndReturn(event);
      if (!decoded || !decoded.args || decoded.args.length === 0) {
        console.log("Failed to decode event log");
        alert("Failed to decode event log");
        return;
      }
      console.log("decoded: ", decoded)
      const vaultAddress = decoded.args.vault as `0x${string}`;

      console.log("Vault created at:", vaultAddress);

      setVaultAddress(vaultAddress);
      setVaultCreated(true);
    } catch (error) {
      console.error('Error creating vault:', error);
      alert('Failed to create vault. Please try again.');
    } finally {
      setIsCreatingVault(false);
    }
  }

  const fetchExistingVaults = async () => {
    if (!isConnected || !address) return;
    setIsFetchingVaults(true);
    try {
      const vaults = await getUserVaults(address);
      setExistingVaults(vaults);
    } catch (error) {
      console.error('Error fetching existing vaults:', error);
    } finally {
      setIsFetchingVaults(false);
    }
  }

  useEffect(() => {
    fetchExistingVaults();
  }, [isConnected, address]);

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Setup Automation Vault</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Step 1: Connect Wallet */}
          <Card className="p-6 border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  {isConnected ? (
                    <CheckCircle2 className="h-6 w-6 text-accent" />
                  ) : (
                    <Wallet className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-1">Connect Wallet</h2>
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to begin setting up your automation vault.
                  </p>
                </div>
              </div>
            </div>

            {isConnected && (
              <div className="mt-6 p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Connected Address</p>
                    <p className="font-mono text-sm">{address}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            )}

            <div className="mt-6">
              <ConnectWalletButton />
            </div>
          </Card>

          {/* Step 2: Create Vault */}
          {isConnected && (
            <Card className="p-6 border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    {vaultCreated ? (
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                    ) : (
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-1">Create Automation Vault</h2>
                    <p className="text-sm text-muted-foreground">
                      Deploy your personal automation vault that will hold and execute strategies.
                    </p>
                  </div>
                </div>
              </div>

              {vaultCreated && vaultAddress ? (
                <div className="mt-6 p-4 bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vault Address</p>
                      <p className="font-mono text-sm">{vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <Button
                    onClick={handleCreateVault}
                    className="w-full"
                    disabled={!isConnected || isCreatingVault}
                  >
                    {isCreatingVault ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                        Creating Vault...
                      </>
                    ) : (
                      'Create Automation Vault'
                    )}
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Next Steps */}
          {isConnected && vaultCreated && (
            <Card className="p-6 border-border bg-accent/5">
              <h3 className="font-semibold mb-4">You're all set!</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Your automation vault has been successfully created. You can now start building automation strategies.
              </p>
              <Link href={`/create-strategy?vault=${vaultAddress}`}>
                <Button className="w-full">
                  Create Your First Automation
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Button>
              </Link>
            </Card>
          )}

          {/* Existing vaults */}
          {isConnected && isFetchingVaults && (
            <Card className="p-6 border-border">
              <div className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full" />
                <span className="text-muted-foreground">Loading your vaults...</span>
              </div>
            </Card>
          )}
          {isConnected && !isFetchingVaults && exisitngVaults.length > 0 && (
            <Card className="p-6 border-border">
              <h3 className="font-semibold mb-4">Your Existing Vaults</h3>
              <ul className="space-y-2">
                {exisitngVaults.map((vault) => (
                  <li key={vault} className="p-4 bg-card rounded-lg border border-border flex items-center justify-between">
                    <span className="font-mono text-sm">{vault.slice(0, 6)}...{vault.slice(-4)}</span>
                    <Link href={`/manage-vault?vault=${vault}`}>
                      <Button variant="outline" size="sm" className="cursor-pointer! hover:bg-accent/50!">
                        Manage
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
