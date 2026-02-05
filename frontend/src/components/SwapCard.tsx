/**
 * SwapCard Component
 * 
 * Main swap interface allowing users to:
 * 1. View SHADOW token balance and ETH balance
 * 2. Mint test tokens (self-faucet)
 * 3. Approve tokens for the Uniswap Router
 * 4. Sign & submit encrypted private swap intents
 * 5. Toggle swap direction (SHADOW ↔ ETH)
 */

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Coins, Shield, Check, Loader2, AlertCircle, ArrowDownUp } from 'lucide-react';
import { useToken } from '../hooks/useToken';
import { useShadowSubmit } from '../hooks/useShadowSubmit';
import type { SwapDirection } from '../hooks/useShadowSubmit';

type ActionState = 'low-balance' | 'needs-approval' | 'ready';

export function SwapCard() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<SwapDirection>('shadow-to-eth');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  });

  // Get SHADOW token balance and operations
  const {
    balance: shadowBalance,
    balanceRaw: shadowBalanceRaw,
    allowanceRaw,
    mint,
    approve,
    refetch,
    isMinting,
    isApproving,
    isMintSuccess,
    isApproveSuccess,
  } = useToken();

  const {
    submit,
    isSubmitting,
    isSigning,
    error: submitError,
    lastResult,
    reset: resetSubmit,
  } = useShadowSubmit();

  // Refetch balances after successful mint/approve
  useEffect(() => {
    if (isMintSuccess || isApproveSuccess) {
      refetch();
    }
  }, [isMintSuccess, isApproveSuccess, refetch]);

  // Show toast on successful submit
  useEffect(() => {
    if (lastResult?.success) {
      setToast({
        type: 'success',
        message: `Intent ${lastResult.status}! ID: ${lastResult.intentId.slice(0, 8)}...`,
      });
      setAmount('');
      resetSubmit();
    }
  }, [lastResult, resetSubmit]);

  // Show error toast
  useEffect(() => {
    if (submitError) {
      setToast({ type: 'error', message: submitError });
    }
  }, [submitError]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Get the relevant balance based on direction
  const getInputBalance = () => {
    if (direction === 'shadow-to-eth') {
      return { value: shadowBalance, symbol: 'SHADOW' };
    } else {
      return { 
        value: ethBalance ? formatEther(ethBalance.value) : '0', 
        symbol: 'ETH' 
      };
    }
  };

  const inputBalance = getInputBalance();

  // Determine action button state
  const getActionState = (): ActionState => {
    if (!amount || parseFloat(amount) <= 0) return 'low-balance';
    
    const amountWei = parseEther(amount);
    
    if (direction === 'shadow-to-eth') {
      // Check SHADOW balance
      if (shadowBalanceRaw < amountWei) return 'low-balance';
      // Check allowance for SHADOW
      if (allowanceRaw < amountWei) return 'needs-approval';
    } else {
      // Check ETH balance
      const ethBalanceWei = ethBalance?.value ?? 0n;
      if (ethBalanceWei < amountWei) return 'low-balance';
      // No approval needed for ETH (native token)
    }
    
    return 'ready';
  };

  const actionState = getActionState();

  const handleMint = async () => {
    try {
      await mint('1000'); // Mint 1000 SHADOW tokens
      setToast({ type: 'success', message: 'Minting 1000 SHADOW tokens...' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Mint failed' });
    }
  };

  const handleApprove = async () => {
    try {
      await approve('max');
      setToast({ type: 'success', message: 'Approving SHADOW...' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'Approve failed' });
    }
  };

  const handleSubmit = async () => {
    try {
      await submit(amount, direction);
    } catch (err) {
      // Error already handled in hook
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'shadow-to-eth' ? 'eth-to-shadow' : 'shadow-to-eth');
    setAmount(''); // Reset amount when switching
  };

  const getTokenLabels = () => {
    if (direction === 'shadow-to-eth') {
      return { from: 'SHADOW', to: 'ETH' };
    } else {
      return { from: 'ETH', to: 'SHADOW' };
    }
  };

  const tokens = getTokenLabels();

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
        <div className="text-center text-gray-400">
          <Shield className="w-12 h-12 mx-auto mb-4 text-purple-400" />
          <p>Connect your wallet to start trading privately</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-900/50 border border-green-700 text-green-300'
              : 'bg-red-900/50 border border-red-700 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 space-y-6">
        {/* Header: Balances & Mint */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-gray-500">SHADOW</p>
                <p className="text-lg font-bold text-white">
                  {parseFloat(shadowBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="h-8 w-px bg-gray-700" />
              <div>
                <p className="text-xs text-gray-500">ETH</p>
                <p className="text-lg font-bold text-white">
                  {ethBalance ? parseFloat(formatEther(ethBalance.value)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleMint}
            disabled={isMinting}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Coins className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">
              {isMinting ? 'Minting...' : 'Mint SHADOW'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700" />

        {/* Swap Direction Toggle */}
        <div className="flex items-center justify-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-medium ${
            direction === 'shadow-to-eth' 
              ? 'bg-purple-600/20 text-purple-400' 
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {tokens.from}
          </div>
          
          <button
            onClick={toggleDirection}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            title="Switch direction"
          >
            <ArrowDownUp className="w-5 h-5 text-gray-300" />
          </button>
          
          <div className={`px-4 py-2 rounded-lg font-medium ${
            direction === 'eth-to-shadow' 
              ? 'bg-purple-600/20 text-purple-400' 
              : 'bg-gray-700/50 text-gray-400'
          }`}>
            {tokens.to}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Amount ({tokens.from})
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white text-xl placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-gray-400 font-medium">{tokens.from}</span>
              <button
                onClick={() => setAmount(inputBalance.value)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                MAX
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Swap {tokens.from} → {tokens.to} via private intent
          </p>
        </div>

        {/* Action Button */}
        <div>
          {actionState === 'low-balance' && (
            <button
              disabled
              className="w-full py-4 bg-gray-700 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
            >
              {!amount || parseFloat(amount) <= 0
                ? 'Enter Amount'
                : `Insufficient ${tokens.from} Balance`}
            </button>
          )}

          {actionState === 'needs-approval' && (
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ShadowRouter for ${tokens.from}`
              )}
            </button>
          )}

          {actionState === 'ready' && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSigning ? 'Sign in Wallet...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Sign & Submit Private Swap
                </>
              )}
            </button>
          )}
        </div>

        {/* Info Footer */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your intent is encrypted and matched P2P - never enters the public mempool
          </p>
        </div>
      </div>
    </div>
  );
}
