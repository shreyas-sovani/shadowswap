/**
 * useShadowSubmit Hook
 * 
 * Handles signing and submitting encrypted intents to the backend.
 * Uses wallet signature to derive encryption key, then encrypts intent data.
 */

import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { generateKeyFromSignature, encryptIntent } from '../utils/crypto';
import { BACKEND_URL, MOCK_TOKEN } from '../config';
import { parseEther } from 'viem';

// Signature message for key derivation
const AUTH_MESSAGE = 'ShadowSwap Private Intent Authentication';

// Token addresses
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export type SwapDirection = 'shadow-to-eth' | 'eth-to-shadow';

interface SubmitResult {
  success: boolean;
  intentId: string;
  status: string;
  message?: string;
}

interface UseSubmitState {
  isSubmitting: boolean;
  isSigning: boolean;
  error: string | null;
  lastResult: SubmitResult | null;
  pendingIntentId: string | null; // Intent ID available immediately after signing
}

export function useShadowSubmit() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [state, setState] = useState<UseSubmitState>({
    isSubmitting: false,
    isSigning: false,
    error: null,
    lastResult: null,
    pendingIntentId: null,
  });

  const submit = useCallback(async (amount: string, direction: SwapDirection): Promise<SubmitResult> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, isSubmitting: true, isSigning: true, error: null, pendingIntentId: null }));

    try {
      // Step 1: Sign message to derive encryption key
      const signature = await signMessageAsync({ message: AUTH_MESSAGE });
      
      // Generate intentId immediately so SSE can connect early
      const intentId = crypto.randomUUID();
      
      // Set pendingIntentId IMMEDIATELY so frontend can start SSE connection
      setState(prev => ({ ...prev, isSigning: false, pendingIntentId: intentId }));

      // Step 2: Derive encryption key from signature
      const encryptionKey = await generateKeyFromSignature(signature);

      // Step 3: Create intent payload based on direction
      const amountWei = parseEther(amount).toString();
      
      // Determine tokenIn and tokenOut based on direction
      const tokenIn = direction === 'shadow-to-eth' ? MOCK_TOKEN : ETH_ADDRESS;
      const tokenOut = direction === 'shadow-to-eth' ? ETH_ADDRESS : MOCK_TOKEN;
      
      const intentPayload = {
        tokenIn,
        tokenOut,
        amountIn: amountWei,
        minAmountOut: amountWei, // 1:1 for simplicity (adjust with slippage in production)
      };

      // Step 4: Encrypt the intent
      const encryptedData = await encryptIntent(intentPayload, encryptionKey);

      // Step 5: Submit to backend
      const response = await fetch(`${BACKEND_URL}/submit-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: intentId,
          userAddress: address,
          // Send encrypted data (backend may store/forward as-is)
          encryptedData,
          // Also send unencrypted for matching (backend needs to see these)
          tokenIn,
          tokenOut,
          amountIn: amountWei,
          minAmountOut: amountWei,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const result: SubmitResult = {
        success: true,
        intentId,
        status: data.status,
        message: data.message,
      };
      
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        lastResult: result,
      }));

      return result;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        isSigning: false,
        error: message,
      }));
      throw error;
    }
  }, [address, signMessageAsync]);

  const reset = useCallback(() => {
    setState({
      isSubmitting: false,
      isSigning: false,
      error: null,
      lastResult: null,
      pendingIntentId: null,
    });
  }, []);

  return {
    submit,
    reset,
    ...state,
  };
}
