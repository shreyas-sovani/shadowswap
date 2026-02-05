import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Moon, Shield, Zap } from 'lucide-react';

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
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            MEV-Protected Swaps
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Trade without fear. Your intents are private.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <Shield className="w-10 h-10 text-purple-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">MEV Protected</h3>
              <p className="text-gray-400 text-sm">
                Intents never hit the public mempool. No front-running.
              </p>
            </div>
            
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Matching</h3>
              <p className="text-gray-400 text-sm">
                Yellow Network state channels for off-chain coordination.
              </p>
            </div>
            
            <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <Moon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Hook-Protected</h3>
              <p className="text-gray-400 text-sm">
                Uniswap v4 Hook ensures only the solver can execute.
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="mt-12 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <p className="text-gray-400">
              {isConnected ? (
                <span className="text-green-400">✓ Wallet connected. Swap UI coming soon...</span>
              ) : (
                <span>Connect your wallet to get started</span>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
