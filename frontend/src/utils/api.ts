/**
 * ShadowSwap API Client
 * 
 * Handles communication with the backend solver.
 */

import { API } from '../config';
import type { Intent, SubmitIntentResponse, HealthResponse } from '../types';

/**
 * Submit an intent to the backend solver
 */
export async function submitIntent(intent: Omit<Intent, 'status'>): Promise<SubmitIntentResponse> {
  const response = await fetch(API.submitIntent, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(intent),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(API.health);
  
  if (!response.ok) {
    throw new Error(`Health check failed: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get intent status by ID
 */
export async function getIntentStatus(intentId: string): Promise<Intent | null> {
  const response = await fetch(`${API.getIntents}/${intentId}`);
  
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to get intent: HTTP ${response.status}`);
  }

  return response.json();
}
