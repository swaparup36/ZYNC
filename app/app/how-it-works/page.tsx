import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Wallet, Zap, Shield, Eye, Clock, CheckCircle, Settings, Target, Box } from 'lucide-react'
import Image from 'next/image'

export default function HowItWorksPage() {
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
          <h1 className="mb-6 text-white text-5xl font-extrabold tracking-tighter md:text-6xl leading-tight">
            How ZYNC Works
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Build non-custodial automations using IF/THEN logic. Your funds stay in your vault while anyone can execute your strategies when conditions are met.
          </p>
        </div>
      </section>

      {/* Core Concept Overview */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-12 text-center">The Core Concept</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Triggers</h3>
                <p className="text-sm text-white/60">
                  Define conditions based on onchain data like price feeds from Chainlink oracles.
                </p>
                <div className="bg-white/5 rounded-lg p-3 font-mono text-xs text-white/80">
                  IF ETH/USD &gt; $3,000
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Actions</h3>
                <p className="text-sm text-white/60">
                  Specify what should happen when triggers fire—swaps, transfers, or any contract call.
                </p>
                <div className="bg-white/5 rounded-lg p-3 font-mono text-xs text-white/80">
                  THEN swap 1 ETH → USDC
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Safety Controls</h3>
                <p className="text-sm text-white/60">
                  Set limits on executions—max amounts, cooldowns, and expiry times.
                </p>
                <div className="bg-white/5 rounded-lg p-3 font-mono text-xs text-white/80">
                  Max 5 ETH, 1hr cooldown
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Step by Step Flow */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-12 text-center">How to Create an Automation</h2>
          
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-border">
                <span className="text-lg font-bold text-white">1</span>
              </div>
              <div className="flex-1 pb-8 border-l border-border/30 pl-8 ml-[-30px]">
                <div className="flex items-center gap-3 mb-3">
                  <Wallet className="h-5 w-5 text-white/60" />
                  <h3 className="text-lg font-semibold text-white">Connect & Create Vault</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Connect your wallet and deploy a personal automation vault. This vault is a smart contract you own—it holds your funds and executes strategies according to your rules.
                </p>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs text-white/40 mb-1">Your Vault Address</p>
                  <p className="font-mono text-sm text-white/80">0x1234...abcd</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-border">
                <span className="text-lg font-bold text-white">2</span>
              </div>
              <div className="flex-1 pb-8 border-l border-border/30 pl-8 ml-[-30px]">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="h-5 w-5 text-white/60" />
                  <h3 className="text-lg font-semibold text-white">Define Your Strategy</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Use the strategy builder to set up your automation:
                </p>
                <ul className="space-y-3 text-sm text-white/60">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white/80">Trigger:</strong> Choose an oracle feed and set your condition (ETH/USD &gt; $3,000)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white/80">Action:</strong> Select a DeFi action like Uniswap swap or custom contract call</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong className="text-white/80">Safety:</strong> Set max amount, cooldown period, and expiry time</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-border">
                <span className="text-lg font-bold text-white">3</span>
              </div>
              <div className="flex-1 pb-8 border-l border-border/30 pl-8 ml-[-30px]">
                <div className="flex items-center gap-3 mb-3">
                  <Box className="h-5 w-5 text-white/60" />
                  <h3 className="text-lg font-semibold text-white">Deposit Funds</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Transfer tokens to your vault. These funds remain under your control and can only be used according to the strategies you've defined.
                </p>
                <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Vault Balance</p>
                    <p className="text-lg font-semibold text-white">5.0 ETH</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-1">Available for Automation</p>
                    <p className="text-sm text-green-500">Ready</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-white/10 flex items-center justify-center border border-border">
                <span className="text-lg font-bold text-white">4</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="h-5 w-5 text-white/60" />
                  <h3 className="text-lg font-semibold text-white">Permissionless Execution</h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Once deployed, anyone can execute your strategy when conditions are met. Executors are incentivized to monitor and trigger automations. Your vault verifies all conditions onchain before any action executes.
                </p>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="relative flex h-3 w-3 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    <p className="text-sm text-green-500 font-semibold">Strategy Active</p>
                  </div>
                  <p className="text-xs text-white/60">Waiting for ETH/USD &gt; $3,000 to trigger swap</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-12 text-center">Why Use ZYNC?</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Non-Custodial</h3>
                  <p className="text-sm text-white/60">
                    Your funds are always in your vault. No third party ever has access to your tokens. You can withdraw at any time.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Fully Transparent</h3>
                  <p className="text-sm text-white/60">
                    All logic lives onchain. Anyone can verify your strategies, conditions, and safety limits. No hidden backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Permissionless Execution</h3>
                  <p className="text-sm text-white/60">
                    Anyone can trigger your automation when conditions are met. No centralized keepers or single points of failure.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Built-in Safety</h3>
                  <p className="text-sm text-white/60">
                    Set maximum amounts, cooldown periods between executions, and expiry times to protect against unexpected behavior.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section className="py-16 px-8 border-b border-border/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-12 text-center">Technical Architecture</h2>
          
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Smart Contract Components</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono text-white">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">StrategyVaultFactory</p>
                    <p className="text-xs text-white/60">Deploys new personal vaults for users. Each vault is owned by its creator.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono text-white">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">StrategyVault</p>
                    <p className="text-xs text-white/60">Holds funds and strategies. Verifies conditions and executes actions when triggered.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono text-white">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">Chainlink Oracles</p>
                    <p className="text-xs text-white/60">Provides reliable price feeds for trigger conditions. Decentralized and tamper-proof.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Execution Flow</h3>
              <div className="flex items-center justify-between gap-2 text-xs font-mono overflow-x-auto pb-2">
                <div className="bg-white/10 rounded px-3 py-2 text-center min-w-[100px]">
                  <p className="text-white/60 text-[10px] mb-1">Executor</p>
                  <p className="text-white">Calls execute()</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
                <div className="bg-white/10 rounded px-3 py-2 text-center min-w-[100px]">
                  <p className="text-white/60 text-[10px] mb-1">Vault</p>
                  <p className="text-white">Check conditions</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
                <div className="bg-white/10 rounded px-3 py-2 text-center min-w-[100px]">
                  <p className="text-white/60 text-[10px] mb-1">Oracle</p>
                  <p className="text-white">Get price</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
                <div className="bg-white/10 rounded px-3 py-2 text-center min-w-[100px]">
                  <p className="text-white/60 text-[10px] mb-1">Vault</p>
                  <p className="text-white">Execute action</p>
                </div>
                <ArrowRight className="h-4 w-4 text-white/40 flex-shrink-0" />
                <div className="bg-green-500/20 rounded px-3 py-2 text-center min-w-[100px] border border-green-500/30">
                  <p className="text-green-500/80 text-[10px] mb-1">Target</p>
                  <p className="text-green-500">Swap complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Automate?</h2>
          <p className="text-white/60 mb-8">
            Create your first non-custodial automation in minutes. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/vault">
              <Button size="lg" className="text-base px-8">
                Create Automation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="text-base bg-transparent rounded-full px-8">
                Back to Home
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
