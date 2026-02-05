import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Moon, Shield, Zap } from 'lucide-react';
import { SwapCard } from './components/SwapCard';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-8 h-8 text-purple-400" />
            <span className="text-xl font-bold text-white">ShadowSwap</span>
          </div>
          
          <div>
            {isConnected ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-mono text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            MEV-Protected Swaps
          </h1>
          <p className="text-xl text-gray-400">
            Trade without fear. Your intents are private.
          </p>
        </div>

        {/* Swap Card */}
        <SwapCard />

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <Shield className="w-10 h-10 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2 text-center">MEV Protected</h3>
            <p className="text-gray-400 text-sm text-center">
              Intents never hit the public mempool. No front-running.
            </p>
          </div>
          
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2 text-center">Instant Matching</h3>
            <p className="text-gray-400 text-sm text-center">
              Yellow Network state channels for off-chain coordination.
            </p>
          </div>
          
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <Moon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2 text-center">Hook-Protected</h3>
            <p className="text-gray-400 text-sm text-center">
              Uniswap v4 Hook ensures only the solver can execute.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
