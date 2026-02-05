/**
 * Web3Provider - Wagmi + React Query Provider Setup
 * 
 * Configures wallet connection for Sepolia testnet using Wagmi v2.
 * Wraps the app with WagmiProvider and QueryClientProvider.
 */

import { type ReactNode } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// ============ Configuration ============

// Replace with your WalletConnect project ID from https://cloud.walletconnect.com/
const WALLETCONNECT_PROJECT_ID = 'YOUR_WALLETCONNECT_PROJECT_ID';

// Optional: Use a custom RPC URL for better reliability
// Replace with your Alchemy/Infura URL or use the default public RPC
const SEPOLIA_RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL || undefined;

// ============ Wagmi Config ============

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    // MetaMask and other injected wallets
    injected({
      shimDisconnect: true,
    }),
    // WalletConnect for mobile wallets
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
      metadata: {
        name: 'ShadowSwap',
        description: 'MEV-Resistant Intent-Based Swaps',
        url: 'https://shadowswap.xyz',
        icons: ['https://shadowswap.xyz/icon.png'],
      },
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'ShadowSwap',
      appLogoUrl: 'https://shadowswap.xyz/icon.png',
    }),
  ],
  transports: {
    // Use custom RPC if provided, otherwise use default public RPC
    [sepolia.id]: SEPOLIA_RPC_URL 
      ? http(SEPOLIA_RPC_URL) 
      : http(),
  },
  // Enable batch processing for better performance
  batch: {
    multicall: true,
  },
});

// ============ React Query Client ============

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time for queries (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Retry failed queries 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: false,
    },
  },
});

// ============ Provider Component ============

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * Web3Provider wraps the application with necessary providers for
 * wallet connection and blockchain interaction.
 * 
 * Usage in main.tsx:
 * ```tsx
 * <Web3Provider>
 *   <App />
 * </Web3Provider>
 * ```
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// ============ Type Exports ============

// Re-export commonly used types for convenience
export type { Config } from 'wagmi';
export { sepolia };
