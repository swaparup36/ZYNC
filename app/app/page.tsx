import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Lock, Zap, Shield } from 'lucide-react'
import Image from 'next/image'
import { WebGLShader } from "@/components/ui/web-gl-shader";
import { LiquidButton } from '@/components/ui/liquid-glass-button' 

function DemoOne() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-24">
      <WebGLShader/> 
      <div className="relative border border-[#27272a] p-2 w-full mx-auto max-w-4xl">
      <main className="relative border border-[#27272a] py-16 px-8 overflow-hidden">
                <h1 className="mb-6 text-white text-center text-5xl font-extrabold tracking-tighter md:text-[clamp(2rem,6vw,5rem)] leading-tight">Automate onchain actions with rules, not bots.</h1>
                <p className="text-white/60 px-6 text-center text-sm md:text-base lg:text-lg max-w-2xl mx-auto">Create non-custodial automations that anyone can execute safely. No backend. No intermediaries. Just smart contracts and your rules.</p>
                <div className="my-8 flex items-center justify-center gap-1">
                    <span className="relative flex h-3 w-3 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                    </span>
                    <p className="text-xs text-green-500">Live on Sepolia</p>
                </div>
                
            <div className="flex flex-col sm:flex-row gap-4 justify-center"> 
                <Link href="/vault">
                  <LiquidButton className="text-white border rounded-full" size={'xl'}>
                    Create Automation
                  </LiquidButton>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg" className="text-base bg-transparent rounded-full px-8">
                    View How It Works
                  </Button>
                </Link>
            </div>
            <div className="mt-8 flex justify-center">
                <Link href="/become-an-executor" className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition font-medium">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Want to earn? Become an Executor →
                </Link>
            </div> 
            </main>
            </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="border-b border-border/30 relative z-50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto px-32 py-6 flex items-center justify-between">
          <div className="text-2xl font-bold text-accent">
            <Image src="/logo.png" alt="Smart Vault Logo" width={70} height={70} className="inline-block mr-2" />
          </div>
          <nav className="flex gap-6 items-center">
            <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
              How It Works
            </Link>
            <Link href="/become-an-executor" className="text-sm text-muted-foreground hover:text-foreground transition">
              Become an Executor
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
      <DemoOne />

      {/* Features Grid */}
      <main className="px-40 mx-auto pb-24">
        <div className="grid md:grid-cols-3 gap-8 pt-16 border-t border-border/30">
          <Card>
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Non-Custodial</h3>
              <p className="text-sm text-white/60">
                Your funds never leave your control. Automations execute directly from your vault.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Permissionless</h3>
              <p className="text-sm text-white/60">
                Anyone can execute your strategies when conditions are met. No permissions required.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Safe Bounds</h3>
              <p className="text-sm text-white/60">
                Set maximum amounts, cooldowns, and expiry times to define automation limits.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
