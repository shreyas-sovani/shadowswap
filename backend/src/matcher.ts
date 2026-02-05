import { Intent } from './types';

export class OrderBook {
    private orders: Map<string, Intent>;

    constructor() {
        this.orders = new Map();
    }

    /**
     * Add an intent and check for instant matches.
     * Simple "Exact Match" Logic:
     * 1. Opposite pair (TokenA->TokenB vs TokenB->TokenA)
     * 2. AmountIn >= Match.MinAmountOut (Simplified to Equality for now)
     */
    addIntent(newIntent: Intent): [Intent, Intent] | null {
        console.log(`[OrderBook] Processing intent ${newIntent.id} (${newIntent.amountIn} ${newIntent.tokenIn} -> ${newIntent.tokenOut})`);

        for (const [existingId, existingIntent] of this.orders.entries()) {
            // Check for inverse pair
            if (
                existingIntent.tokenIn === newIntent.tokenOut &&
                existingIntent.tokenOut === newIntent.tokenIn &&
                existingIntent.status === 'PENDING'
            ) {
                // Simplified Constraint: Check if amounts match exactly (as per task requirement)
                // In a real system, we'd check prices and slippage.
                // For this task: "Check if amountIn matches roughly (simplify to exact match for now)"

                // Check if New User gives enough for Existing matched request
                // AND Existing User gives enough for New matched request
                // (Assuming 1:1 value for this simplified mock or strictly explicit amounts)

                // Since we are doing "exact match for now", let's compare the string values
                // A match happens if B wants exactly what A offers, and vice versa.
                if (
                    existingIntent.amountIn === newIntent.minAmountOut &&
                    newIntent.amountIn === existingIntent.minAmountOut
                ) {
                    console.log(`[OrderBook] Match found: ${newIntent.id} <> ${existingId}`);

                    // Remove the matched order from the book
                    this.orders.delete(existingId);

                    // Mark both as matched
                    newIntent.status = 'MATCHED';
                    existingIntent.status = 'MATCHED';

                    return [newIntent, existingIntent];
                }
            }
        }

        // No match found, add to book
        console.log(`[OrderBook] No match found. Adding ${newIntent.id} to order book.`);
        this.orders.set(newIntent.id, newIntent);
        return null;
    }
}
