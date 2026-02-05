/**
 * ShadowSwap Type Definitions
 * 
 * Shared types used across the frontend application.
 * Mirrors the backend types for consistency.
 */

// ============ Intent Types ============

/**
 * Intent status throughout its lifecycle
 */
export type IntentStatus = 'PENDING' | 'MATCHED' | 'SETTLED' | 'FAILED' | 'EXPIRED';

/**
 * Swap direction
 */
export type SwapDirection = 'BUY' | 'SELL';

/**
 * Intent object representing a user's swap intention
 */
export interface Intent {
  /** Unique identifier (UUID) */
  id: string;
  /** User's wallet address */
  userAddress: string;
  /** Token to sell (address) */
  tokenIn: string;
  /** Token to buy (address) */
  tokenOut: string;
  /** Amount to sell (BigInt string) */
  amountIn: string;
  /** Minimum amount to receive (BigInt string) */
  minAmountOut: string;
  /** Current status */
  status: IntentStatus;
  /** Timestamp when intent was created */
  createdAt?: number;
  /** Timestamp when intent expires */
  expiresAt?: number;
}

/**
 * Form data for creating a new intent
 */
export interface IntentFormData {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number; // Basis points (e.g., 100 = 1%)
}

// ============ API Types ============

/**
 * Response from intent submission
 */
export interface SubmitIntentResponse {
  success: boolean;
  intentId: string;
  status: IntentStatus;
  matchedWith?: string; // ID of matched intent if matched
  message?: string;
}

/**
 * Backend health check response
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: number;
  yellowConnected: boolean;
}

// ============ Token Types ============

/**
 * Token information for UI display
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: string; // User's balance (BigInt string)
}

// ============ Transaction Types ============

/**
 * Transaction status for UI tracking
 */
export type TransactionStatus = 'idle' | 'signing' | 'pending' | 'success' | 'error';

/**
 * Transaction state
 */
export interface TransactionState {
  status: TransactionStatus;
  hash?: string;
  error?: string;
}

// ============ Wallet Types ============

/**
 * Connected wallet state
 */
export interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  isCorrectChain: boolean;
}

// ============ UI State Types ============

/**
 * Swap panel state
 */
export interface SwapPanelState {
  tokenIn: TokenInfo | null;
  tokenOut: TokenInfo | null;
  amountIn: string;
  amountOut: string;
  slippageBps: number;
  isLoading: boolean;
  error: string | null;
}
