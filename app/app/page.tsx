import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Lock, Zap, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="text-2xl font-bold text-accent">ZYNC</div>
          <nav className="flex gap-6 items-center">
            <button className="text-sm text-muted-foreground hover:text-foreground transition">
              How It Works
            </button>
            <Link href="/vault">
              <Button size="sm">
                Create Automation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 py-24">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-balance">
            Automate onchain actions with rules, not bots.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
            Create non-custodial automations that anyone can execute safely. No backend. No intermediaries. Just smart contracts and your rules.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/vault">
              <Button size="lg" className="text-base">
                Create Automation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-base bg-transparent">
              View How It Works
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 pt-16 border-t border-border">
          <div className="space-y-4">
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Non-Custodial</h3>
            <p className="text-sm text-muted-foreground">
              Your funds never leave your control. Automations execute directly from your vault.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Permissionless</h3>
            <p className="text-sm text-muted-foreground">
              Anyone can execute your strategies when conditions are met. No permissions required.
            </p>
          </div>

          <div className="space-y-4">
            <div className="h-12 w-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Safe Bounds</h3>
            <p className="text-sm text-muted-foreground">
              Set maximum amounts, cooldowns, and expiry times to define automation limits.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
