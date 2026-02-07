import { useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Moon, Shield, Zap } from 'lucide-react';
import { SwapCard } from './components/SwapCard';
import { SplineScene } from '@/components/ui/splite';
import { Spotlight } from '@/components/ui/spotlight';
import { Icons } from '@/components/ui/icons';
import { GradientButton } from '@/components/ui/gradient-button';
import { VariableFontAndCursor } from '@/components/ui/variable-font-and-cursor';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Full-page 3D Spline Background */}
      <div className="fixed inset-0 z-0">
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
        {/* Gradient overlay for depth and readability - pointer-events-none to keep robot interactive */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Spotlight Effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20 z-10"
        fill="white"
      />

      {/* Header - Glass morphism */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.logo className="w-8 h-8 text-purple-400" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              ShadowSwap
            </span>
          </div>

          <div>
            {isConnected ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <GradientButton
                  variant="variant"
                  onClick={() => disconnect()}
                  className="min-w-[100px] px-6 py-2.5"
                >
                  Disconnect
                </GradientButton>
              </div>
            ) : (
              <GradientButton
                onClick={() => connect({ connector: connectors[0] })}
                className="min-w-[140px]"
              >
                Connect Wallet
              </GradientButton>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Floats above background, pointer-events pass-through for smooth Spline interaction */}
      <main className="relative z-20 container mx-auto px-4 py-16 pointer-events-none">
        {/* Hero Text - interactive variable font */}
        <div ref={heroRef} className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-400">
              MEV-Protected
            </span>
            <br />
            <VariableFontAndCursor
              label="Dark Pool Swaps"
              containerRef={heroRef}
              fontVariationMapping={{
                x: { name: 'wght', min: 400, max: 900 },
                y: { name: 'wght', min: 400, max: 900 },
              }}
              className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </h1>
          <p className="mt-6 text-lg md:text-xl text-neutral-300/90 max-w-xl mx-auto leading-relaxed">
            Trade without fear. Your intents are encrypted and matched P2P via Yellow Network —
            never entering the public mempool.
          </p>
        </div>

        {/* Swap Card - minimal, blends with background */}
        <div className="max-w-lg mx-auto pointer-events-auto">
          <SwapCard />
        </div>

        {/* Features - minimal, blended with background */}
        <div className="mt-28 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            {/* MEV Protected */}
            <div className="group text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Shield className="w-5 h-5 text-purple-400/80 group-hover:text-purple-300 transition-colors duration-500" />
                <h3 className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors duration-500">
                  MEV Protected
                </h3>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors duration-500">
                Intents never hit the public mempool. No front-running, no sandwich attacks.
              </p>
            </div>

            {/* Instant Matching */}
            <div className="group text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Zap className="w-5 h-5 text-yellow-400/80 group-hover:text-yellow-300 transition-colors duration-500" />
                <h3 className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors duration-500">
                  Instant Matching
                </h3>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors duration-500">
                Yellow Network state channels enable lightning-fast off-chain coordination.
              </p>
            </div>

            {/* Hook-Protected */}
            <div className="group text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <Moon className="w-5 h-5 text-blue-400/80 group-hover:text-blue-300 transition-colors duration-500" />
                <h3 className="text-lg font-semibold text-white/90 group-hover:text-white transition-colors duration-500">
                  Hook-Protected
                </h3>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors duration-500">
                Uniswap v4 Hook ensures only the authorized solver can execute your swap.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/50 to-transparent z-10 pointer-events-none" />
    </div>
  );
}

export default App;
