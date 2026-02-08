import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Terminal, Coins, Zap, Eye, Shield, Settings, CheckCircle, Copy, DollarSign, Clock, Activity } from 'lucide-react'
import Image from 'next/image'

export default function BecomeAnExecutorPage() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="border-b border-border/30 relative z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto px-32 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Image src="/logo.png" alt="Smart Vault Logo" width={70} height={70} className="inline-block" />
            </Link>
          </div>
          <nav className="flex gap-6 items-center">
            <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
              How It Works
            </Link>
            <Link href="/vault">
              <Button size="sm" className='py-5'>
                Create Automation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-8 border-b border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2 mb-6">
            <span className="text-sm text-green-500 font-medium">Earn rewards by executing strategies</span>
          </div>
          <h1 className="mb-6 text-white text-5xl font-extrabold tracking-tighter md:text-6xl leading-tight">
            Become an Executor
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Run the ZYNC Executor CLI to monitor vaults, execute eligible strategies, and earn incentives. No permission needed—anyone can participate.
          </p>
        </div>
      </section>

      {/* What is an Executor */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">What is an Executor?</h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-12">
            Executors are the backbone of ZYNC's permissionless automation system. They monitor vaults and trigger strategies when conditions are met.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Monitor</h3>
                <p className="text-sm text-white/60">
                  Scan the StrategyVaultFactory for all deployed vaults and their active strategies continuously.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Verify</h3>
                <p className="text-sm text-white/60">
                  Check each strategy's trigger conditions against onchain oracle data to determine eligibility.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Execute</h3>
                <p className="text-sm text-white/60">
                  Call the execute function on eligible strategies to trigger the automated action and earn rewards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Installation Guide */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Quick Start Guide</h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-12">
            Get the ZYNC Executor running in minutes with npm.
          </p>
          
          <div className="space-y-6">
            {/* Step 1: Install */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">1</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Install the CLI</h3>
              </div>
              <p className="text-sm text-white/60 mb-4">Install the executor globally using npm:</p>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm relative group">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-white/40">Terminal</span>
                </div>
                <code className="text-green-400">npm install -g zync-executor</code>
              </div>
            </div>

            {/* Step 2: Configure RPC */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">2</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Configure RPC URL</h3>
              </div>
              <p className="text-sm text-white/60 mb-4">Set your Sepolia RPC endpoint (Alchemy, Infura, or any provider):</p>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-white/40">Terminal</span>
                </div>
                <code className="text-green-400">zync-executor config-rpc --url https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY</code>
              </div>
            </div>

            {/* Step 3: Configure Wallet */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">3</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Configure Wallet</h3>
              </div>
              <p className="text-sm text-white/60 mb-4">Set up your executor wallet (needs ETH for gas):</p>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-white/40">Terminal</span>
                </div>
                <code className="text-green-400">zync-executor config-wallet --private-key YOUR_PRIVATE_KEY</code>
              </div>
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-500/80">
                    Your private key is encrypted with AES-256-CBC and stored securely. You'll be prompted for a password.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4: Run */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <span className="text-sm font-bold text-green-500">4</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Start Executing</h3>
              </div>
              <p className="text-sm text-white/60 mb-4">Launch the executor and start earning:</p>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Terminal className="h-4 w-4" />
                  <span className="text-white/40">Terminal</span>
                </div>
                <code className="text-green-400">zync-executor run</code>
                <div className="mt-4 text-white/40 text-xs">
                  <p># Or with debug logging:</p>
                  <p className="text-green-400">zync-executor --debug run</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLI Commands Reference */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">CLI Commands</h2>
          
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  <th className="text-left p-4 text-sm font-semibold text-white">Command</th>
                  <th className="text-left p-4 text-sm font-semibold text-white">Description</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-border/50">
                  <td className="p-4 font-mono text-green-400">config-rpc --url &lt;URL&gt;</td>
                  <td className="p-4 text-white/60">Configure the RPC endpoint URL</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 font-mono text-green-400">config-wallet --private-key &lt;PK&gt;</td>
                  <td className="p-4 text-white/60">Configure and encrypt the executor wallet</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 font-mono text-green-400">rpc-url</td>
                  <td className="p-4 text-white/60">Display the configured RPC URL</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 font-mono text-green-400">wallet</td>
                  <td className="p-4 text-white/60">Display the executor wallet address</td>
                </tr>
                <tr>
                  <td className="p-4 font-mono text-green-400">run</td>
                  <td className="p-4 text-white/60">Start the executor keeper loop</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-white/40">Use <code className="bg-white/10 px-2 py-1 rounded">--debug</code> flag for verbose logging or <code className="bg-white/10 px-2 py-1 rounded">--help</code> for more info</p>
          </div>
        </div>
      </section>

      {/* How Executors Earn */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">How Executors Earn Incentives</h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-12">
            ZYNC uses a simple fee model where executors earn 90% of execution fees for keeping the network running.
          </p>

          {/* Fee Split Visualization */}
          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">Execution Fee Distribution</h3>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <div className="h-24 w-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-green-500">90%</span>
                </div>
                <p className="text-sm text-white font-semibold">Executor</p>
                <p className="text-xs text-white/60">Your reward</p>
              </div>
              <div className="text-4xl text-white/20">+</div>
              <div className="text-center">
                <div className="h-24 w-24 rounded-full bg-blue-500/20 border-4 border-blue-500 flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-blue-500">10%</span>
                </div>
                <p className="text-sm text-white font-semibold">ZYNC Treasury</p>
                <p className="text-xs text-white/60">Protocol fee</p>
              </div>
            </div>
            <p className="text-center text-xs text-white/40">Execution fees are set and controlled by ZYNC authority to ensure fair pricing</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-500/30">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Vault Recharge Model</h3>
                  <p className="text-sm text-white/60">
                    When users create strategies, they recharge their vault with funds to cover execution fees. This ensures executors are always compensated for successful executions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-500/30">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">First-Come-First-Serve</h3>
                  <p className="text-sm text-white/60">
                    Executions are competitive. The fastest executor to identify an eligible strategy and submit the transaction earns the 90% fee share.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Guaranteed Payment</h3>
                  <p className="text-sm text-white/60">
                    Execution fees are pre-funded in the vault. If a strategy is executable, the fee is guaranteed—no risk of non-payment.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                  <Shield className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Controlled Fees</h3>
                  <p className="text-sm text-white/60">
                    Execution fees are set by ZYNC authority to maintain fair pricing across the network. This prevents fee manipulation and ensures predictable earnings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Incentive Flow Diagram */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-6 text-center">Execution Fee Flow</h3>
            <div className="flex items-center justify-between gap-2 text-xs font-mono overflow-x-auto pb-2">
              <div className="bg-white/10 rounded px-4 py-3 text-center min-w-[120px]">
                <p className="text-white/60 text-[10px] mb-1">User</p>
                <p className="text-white">Recharges vault</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
              <div className="bg-white/10 rounded px-4 py-3 text-center min-w-[120px]">
                <p className="text-white/60 text-[10px] mb-1">Executor</p>
                <p className="text-white">Monitors vault</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
              <div className="bg-white/10 rounded px-4 py-3 text-center min-w-[120px]">
                <p className="text-white/60 text-[10px] mb-1">Condition</p>
                <p className="text-white">Becomes true</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
              <div className="bg-white/10 rounded px-4 py-3 text-center min-w-[120px]">
                <p className="text-white/60 text-[10px] mb-1">Executor</p>
                <p className="text-white">Calls execute()</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
              <div className="bg-green-500/20 rounded px-4 py-3 text-center min-w-[140px] border border-green-500/30">
                <p className="text-green-500/80 text-[10px] mb-1">Fee Split</p>
                <p className="text-green-500">90% Executor</p>
                <p className="text-blue-400 text-[10px]">10% Treasury</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Requirements</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">System Requirements</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/60">Node.js 18+ installed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/60">npm or yarn package manager</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/60">Stable internet connection</span>
                </li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-white mb-4">Blockchain Requirements</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/60">Sepolia RPC endpoint (Alchemy, Infura, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/60">Funded wallet with Sepolia ETH for gas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-white/60">Private key for signing transactions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Executing?</h2>
          <p className="text-white/60 mb-8">
            Install the CLI, configure your wallet, and start earning by executing strategies on ZYNC.
          </p>
          <div className="bg-black/50 rounded-lg p-4 font-mono text-sm mb-8 inline-block">
            <code className="text-green-400">npm install -g zync-executor</code>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vault">
              <Button size="lg" className="text-base px-8">
                Create Your Own Automation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" size="lg" className="text-base bg-transparent rounded-full px-8">
                Learn How ZYNC Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-white/40">
          <p>ZYNC - Non-Custodial Onchain Automation</p>
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
            </span>
            <span className="text-green-500">Live on Sepolia</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
