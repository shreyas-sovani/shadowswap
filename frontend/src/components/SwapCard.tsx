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
import { Coins, Shield, Check, Loader2, AlertCircle, ArrowDownUp, ExternalLink } from 'lucide-react';
import { useToken } from '../hooks/useToken';
import { useShadowSubmit } from '../hooks/useShadowSubmit';
import type { SwapDirection } from '../hooks/useShadowSubmit';
import { useIntentStatus } from '../hooks/useIntentStatus';
import { useSettlementEvents } from '../hooks/useSettlementEvents';
import type { SettlementEvent } from '../hooks/useSettlementEvents';
import { MOCK_ENS_ADDRESS } from '../config';
import { GradientButton } from '@/components/ui/gradient-button';

type ActionState = 'low-balance' | 'needs-approval' | 'ready';

// Helper to format event type for display
const getEventIcon = (type: string): string => {
  switch (type) {
    case 'CONNECTED': return '🔗';
    case 'MATCHED': return '⚡';
    case 'SETTLING_STARTED': return '🚀';
    case 'TX_SUBMITTED': return '📤';
    case 'TX_CONFIRMING': return '⏳';
    case 'TX_CONFIRMED': return '✅';
    case 'ENS_UPDATING': return '📝';
    case 'ENS_CONFIRMED': return '⛓️';
    case 'SETTLEMENT_COMPLETE': return '🎉';
    case 'SETTLEMENT_FAILED': return '❌';
    case 'WAITING_RATE_LIMIT': return '⏸️';
    default: return '📌';
  }
};

const getEventColor = (type: string): string => {
  switch (type) {
    case 'SETTLEMENT_COMPLETE': return 'text-green-400';
    case 'SETTLEMENT_FAILED': return 'text-red-400';
    case 'TX_CONFIRMED':
    case 'ENS_CONFIRMED': return 'text-green-300';
    case 'TX_SUBMITTED':
    case 'TX_CONFIRMING': return 'text-blue-300';
    case 'MATCHED':
    case 'SETTLING_STARTED': return 'text-purple-300';
    case 'WAITING_RATE_LIMIT': return 'text-yellow-300';
    default: return 'text-gray-300';
  }
};

// Individual event item display
function SettlementEventItem({ event }: { event: SettlementEvent }) {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const icon = getEventIcon(event.type);
  const color = getEventColor(event.type);

  return (
    <div className={`flex items-start gap-2 ${color} text-xs`}>
      <span className="w-5 flex-shrink-0">{icon}</span>
      <span className="flex-grow">
        <span className="font-semibold">{event.type.replace(/_/g, ' ')}</span>
        {event.data?.message && (
          <span className="text-gray-400 ml-1">- {event.data.message}</span>
        )}
        {event.data?.txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${event.data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-blue-400 hover:text-blue-300 underline"
          >
            {event.data.txHash.slice(0, 10)}...
          </a>
        )}
        {event.data?.error && (
          <span className="text-red-400 ml-1">- {event.data.error}</span>
        )}
      </span>
      <span className="text-gray-600 flex-shrink-0">{time}</span>
    </div>
  );
}

export function SwapCard() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<SwapDirection>('shadow-to-eth');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [successIntent, setSuccessIntent] = useState<{ id: string; initialStatus?: string } | null>(null);

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
    pendingIntentId,
    reset: resetSubmit,
  } = useShadowSubmit();

  // Poll intent status (must be called unconditionally at top level)
  const { data: intentStatus } = useIntentStatus(
    successIntent?.id ?? null,
    successIntent?.initialStatus ? { status: successIntent.initialStatus as 'PENDING' | 'MATCHED' | 'SETTLING' | 'SETTLED' | 'FAILED' | 'UNKNOWN' } : undefined
  );

  // Subscribe to live settlement events via SSE - use pendingIntentId for EARLY connection
  const activeIntentId = successIntent?.id ?? pendingIntentId ?? null;
  const { events: settlementEvents, isConnected: sseConnected } = useSettlementEvents(
    activeIntentId
  );

  // Set successIntent as soon as pendingIntentId is available (don't wait for API response)
  useEffect(() => {
    if (pendingIntentId && !successIntent) {
      console.log('[SwapCard] Setting successIntent from pendingIntentId:', pendingIntentId);
      setSuccessIntent({
        id: pendingIntentId,
        initialStatus: 'PENDING'
      });
      setAmount('');
    }
  }, [pendingIntentId, successIntent]);

  // Refetch balances after successful mint/approve
  useEffect(() => {
    if (isMintSuccess || isApproveSuccess) {
      refetch();
    }
  }, [isMintSuccess, isApproveSuccess, refetch]);

  // Refetch balances when settlement completes via SSE
  useEffect(() => {
    const hasSettled = settlementEvents.some(e => e.type === 'SETTLEMENT_COMPLETE');
    if (hasSettled) {
      console.log('[SwapCard] Settlement complete detected via SSE, refetching balances...');
      refetch();
    }
  }, [settlementEvents, refetch]);

  // Handle API response (update status, show toast, but successIntent already set via pendingIntentId)
  useEffect(() => {
    if (lastResult?.success) {
      // Update status from API response if we have new info
      if (successIntent && lastResult.status !== successIntent.initialStatus) {
        setSuccessIntent(prev => prev ? { ...prev, initialStatus: lastResult.status } : null);
      }
      setToast({
        type: 'success',
        message: `Intent ${lastResult.status}!`,
      });
      resetSubmit();
    }
  }, [lastResult, resetSubmit, successIntent]);

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
      <div className="max-w-md mx-auto text-center py-12">
        <Shield className="w-10 h-10 mx-auto mb-6 text-purple-400/60" />
        <p className="text-lg text-neutral-400 mb-2">Connect your wallet</p>
        <p className="text-sm text-neutral-600">to start trading privately</p>
      </div>
    );
  }

  // Success View (Reactive)
  if (successIntent) {
    // Derive status from SSE events if available, fall back to polled status
    const getStatusFromEvents = (): 'PENDING' | 'MATCHED' | 'SETTLING' | 'SETTLED' | 'FAILED' => {
      if (settlementEvents.length === 0) {
        const polledStatus = intentStatus?.status;
        if (polledStatus === 'UNKNOWN') return 'PENDING';
        return polledStatus || 'PENDING';
      }

      const latestEvent = settlementEvents[settlementEvents.length - 1];
      switch (latestEvent.type) {
        case 'SETTLEMENT_COMPLETE':
          return 'SETTLED';
        case 'SETTLEMENT_FAILED':
          return 'FAILED';
        case 'SETTLING_STARTED':
        case 'TX_SUBMITTED':
        case 'TX_CONFIRMING':
        case 'TX_CONFIRMED':
        case 'ENS_UPDATING':
        case 'ENS_CONFIRMED':
        case 'WAITING_RATE_LIMIT':
          return 'SETTLING';
        case 'MATCHED':
          return 'MATCHED';
        default: {
          const polledStatus = intentStatus?.status;
          if (polledStatus === 'UNKNOWN') return 'PENDING';
          return polledStatus || 'PENDING';
        }
      }
    };

    const status = getStatusFromEvents();

    // Get txHash from events or polled data
    const txnHashFromEvents = settlementEvents.find(e => e.data?.txHash)?.data?.txHash;
    const txnHash = txnHashFromEvents || intentStatus?.txnHash;

    const counterparty = intentStatus?.counterparty;
    const matchId = intentStatus?.matchId;
    const settlementError = intentStatus?.settlementError ||
      settlementEvents.find(e => e.type === 'SETTLEMENT_FAILED')?.data?.error;

    const getStatusColor = () => {
      switch (status) {
        case 'SETTLED': return 'text-green-400';
        case 'MATCHED':
        case 'SETTLING': return 'text-blue-400';
        case 'FAILED': return 'text-red-400';
        default: return 'text-yellow-400';
      }
    };

    const getStatusBg = () => {
      switch (status) {
        case 'SETTLED': return 'bg-green-900/30';
        case 'MATCHED':
        case 'SETTLING': return 'bg-blue-900/30';
        case 'FAILED': return 'bg-red-900/30';
        default: return 'bg-yellow-900/30';
      }
    };

    return (
      <div className="max-w-md mx-auto">
        <div className="p-6 space-y-6">

          {/* Header Section */}
          <div className="text-center space-y-3">
            <div className={`w-14 h-14 ${getStatusBg()} rounded-full flex items-center justify-center mx-auto ${status === 'PENDING' || status === 'SETTLING' ? 'animate-pulse' : ''}`}>
              {(status === 'PENDING' || status === 'SETTLING') && <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />}
              {status === 'MATCHED' && <Coins className="w-8 h-8 text-blue-400 animate-bounce" />}
              {status === 'SETTLED' && <Check className="w-8 h-8 text-green-400" />}
              {status === 'FAILED' && <AlertCircle className="w-8 h-8 text-red-400" />}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${getStatusColor()}`}>
                {status === 'PENDING' && '⏳ Scanning Yellow Network...'}
                {status === 'MATCHED' && '⚡ Match Found!'}
                {status === 'SETTLING' && '🔄 Executing On-Chain...'}
                {status === 'SETTLED' && '✅ Trade Settled'}
                {status === 'FAILED' && '❌ Settlement Failed'}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {status === 'PENDING' && 'Waiting for counter-party match'}
                {status === 'MATCHED' && 'Preparing settlement transaction'}
                {status === 'SETTLING' && 'Transaction submitted, awaiting confirmation'}
                {status === 'SETTLED' && 'Swap executed successfully!'}
                {status === 'FAILED' && (settlementError || 'Unknown error occurred')}
              </p>
            </div>
          </div>

          {/* Live Settlement Feed */}
          <div className="p-4 bg-white/5 rounded-xl space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500 text-xs uppercase tracking-wider">Live Settlement Feed</span>
              <span className={`text-xs px-2 py-0.5 rounded ${sseConnected ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {sseConnected ? '● LIVE' : '○ CONNECTING'}
              </span>
            </div>

            {/* Intent ID */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Your Intent</span>
              <span className="text-gray-300">{successIntent?.id?.slice(0, 12)}...</span>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-semibold ${getStatusColor()}`}>{status}</span>
            </div>

            {/* Counter-party (when matched) */}
            {counterparty && (
              <div className="flex items-center justify-between border-t border-gray-800 pt-2">
                <span className="text-gray-500">Counter-party</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${counterparty}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {counterparty?.slice(0, 6)}...{counterparty?.slice(-4)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Match ID (when matched) */}
            {matchId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Match ID</span>
                <span className="text-gray-300">{matchId?.slice(0, 12)}...</span>
              </div>
            )}

            {/* Transaction Hash (when settling/settled) */}
            {txnHash && (
              <div className="flex items-center justify-between border-t border-gray-800 pt-2">
                <span className="text-gray-500">Txn Hash</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txnHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300 flex items-center gap-1"
                >
                  {txnHash?.slice(0, 10)}...{txnHash?.slice(-6)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Live Event Log */}
            {settlementEvents.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3 space-y-2 max-h-48 overflow-y-auto">
                <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Event Log</div>
                {settlementEvents.map((event, idx) => (
                  <SettlementEventItem key={idx} event={event} />
                ))}
              </div>
            )}

            {/* Progress indicator (when no events yet) */}
            {(status === 'SETTLING' || status === 'MATCHED') && settlementEvents.length === 0 && (
              <div className="flex items-center gap-2 text-blue-400 border-t border-gray-800 pt-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for settlement events...</span>
              </div>
            )}
          </div>

          {/* ENS Audit Trail (when settled) */}
          {status === 'SETTLED' && (
            <div className="space-y-2">
              <a
                href={`https://sepolia.etherscan.io/address/${MOCK_ENS_ADDRESS}#readContract`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-purple-900/30 hover:bg-purple-900/40 text-purple-300 rounded-lg transition-colors border border-purple-800/50"
              >
                <span>⛓️ View ENS Audit Trail</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-xs text-gray-500 text-center">
                Proof stored in <span className="text-purple-400">shadowswap.eth</span>
              </p>
            </div>
          )}

          {/* Action Button */}
          <GradientButton
            variant={status === 'SETTLED' ? 'variant' : 'default'}
            onClick={() => setSuccessIntent(null)}
            className="w-full"
          >
            {status === 'SETTLED' || status === 'FAILED' ? 'Start New Swap' : 'Cancel View'}
          </GradientButton>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${toast?.type === 'success'
            ? 'bg-green-500/10 text-green-400'
            : 'bg-red-500/10 text-red-400'
            }`}
        >
          {toast?.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm">{toast?.message}</span>
        </div>
      )}

      <div className="p-6 space-y-6">
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
                  {ethBalance ? parseFloat(formatEther(ethBalance?.value ?? 0n)).toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
                </p>
              </div>
            </div>
          </div>
          <GradientButton
            variant="variant"
            onClick={handleMint}
            disabled={isMinting}
            className="min-w-[120px] px-4 py-2 flex items-center gap-2"
          >
            {isMinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Coins className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">
              {isMinting ? 'Minting...' : 'Mint SHADOW'}
            </span>
          </GradientButton>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Swap Direction Toggle */}
        <div className="flex items-center justify-center gap-4">
          <div className={`px-4 py-2 rounded-lg font-medium transition-colors ${direction === 'shadow-to-eth'
            ? 'bg-purple-500/15 text-purple-400'
            : 'text-neutral-500'
            }`}>
            {tokens.from}
          </div>

          <button
            onClick={toggleDirection}
            title="Switch direction"
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <ArrowDownUp className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
          </button>

          <div className={`px-4 py-2 rounded-lg font-medium transition-colors ${direction === 'eth-to-shadow'
            ? 'bg-purple-500/15 text-purple-400'
            : 'text-neutral-500'
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
              className="w-full px-4 py-3 bg-white/5 rounded-lg text-white text-xl placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
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
            <GradientButton
              disabled
              className="w-full opacity-50 cursor-not-allowed"
            >
              {!amount || parseFloat(amount) <= 0
                ? 'Enter Amount'
                : `Insufficient ${tokens.from} Balance`}
            </GradientButton>
          )}

          {actionState === 'needs-approval' && (
            <GradientButton
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full"
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve ShadowRouter for ${tokens.from}`
              )}
            </GradientButton>
          )}

          {actionState === 'ready' && (
            <GradientButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-5"
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
            </GradientButton>
          )}
        </div>

        {/* Info Footer */}
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-neutral-600 text-center">
            🔒 Your intent is encrypted and matched P2P — never enters the public mempool
          </p>
        </div>
      </div>
    </div>
  );
}
