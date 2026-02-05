import { Intent } from './types';
import { settler, SettlementResult } from './settler';

export interface MatchResult {
    matched: boolean;
    intents?: [Intent, Intent];
    settlements?: [SettlementResult, SettlementResult];
}

// Price ratio: 1 ETH = 1000 SHADOW
const ETH_TO_SHADOW_RATIO = 1000n;
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export class OrderBook {
    private orders: Map<string, Intent>;

    constructor() {
        this.orders = new Map();
    }

    /**
     * Check if two amounts match at the current price ratio
     * ethAmount * 1000 should equal shadowAmount (with 5% tolerance)
     */
    private amountsMatch(ethAmount: bigint, shadowAmount: bigint): boolean {
        // Calculate expected: ethAmount * 1000 = shadowAmount
        const expectedShadow = ethAmount * ETH_TO_SHADOW_RATIO;
        
        // Allow 5% tolerance for rounding
        const tolerance = expectedShadow / 20n; // 5%
        const diff = expectedShadow > shadowAmount 
            ? expectedShadow - shadowAmount 
            : shadowAmount - expectedShadow;
        
        const matches = diff <= tolerance;
        console.log(`[OrderBook] Price check: ${ethAmount} ETH * 1000 = ${expectedShadow} vs ${shadowAmount} SHADOW (diff: ${diff}, tolerance: ${tolerance}, match: ${matches})`);
        return matches;
    }

    /**
     * Add an intent and check for instant matches.
     * Price-aware matching:
     * 1. Opposite pair (TokenA->TokenB vs TokenB->TokenA)
     * 2. Amounts match at 1 ETH = 1000 SHADOW ratio (with tolerance)
     * 
     * If a match is found, settlements are executed automatically.
     */
    async addIntent(newIntent: Intent): Promise<MatchResult> {
        console.log(`[OrderBook] Processing intent ${newIntent.id} (${newIntent.amountIn} ${newIntent.tokenIn} -> ${newIntent.tokenOut})`);

        for (const [existingId, existingIntent] of this.orders.entries()) {
            // Check for inverse pair
            if (
                existingIntent.tokenIn.toLowerCase() === newIntent.tokenOut.toLowerCase() &&
                existingIntent.tokenOut.toLowerCase() === newIntent.tokenIn.toLowerCase() &&
                existingIntent.status === 'PENDING'
            ) {
                // Price-aware matching at 1 ETH = 1000 SHADOW
                const newAmountIn = BigInt(newIntent.amountIn);
                const existingAmountIn = BigInt(existingIntent.amountIn);
                
                let ethAmount: bigint;
                let shadowAmount: bigint;
                
                // Determine which is ETH and which is SHADOW
                if (newIntent.tokenIn.toLowerCase() === ETH_ADDRESS) {
                    // New intent: ETH -> SHADOW
                    // Existing intent: SHADOW -> ETH
                    ethAmount = newAmountIn;
                    shadowAmount = existingAmountIn;
                } else {
                    // New intent: SHADOW -> ETH
                    // Existing intent: ETH -> SHADOW
                    shadowAmount = newAmountIn;
                    ethAmount = existingAmountIn;
                }
                
                // Check if amounts match at the price ratio
                if (this.amountsMatch(ethAmount, shadowAmount)) {
                    console.log(`[OrderBook] ✅ Match found: ${newIntent.id} <> ${existingId}`);

                    // Remove the matched order from the book
                    this.orders.delete(existingId);

                    // Mark both as matched
                    newIntent.status = 'MATCHED';
                    existingIntent.status = 'MATCHED';

                    // Execute settlements on-chain
                    console.log(`[OrderBook] 🔄 Initiating on-chain settlement...`);
                    const settlements = await settler.executeMatch(newIntent, existingIntent);

                    // Update statuses based on settlement results
                    const [result1, result2] = settlements;
                    
                    if (result1.success) {
                        newIntent.status = 'SETTLED';
                        console.log(`[OrderBook] ✅ Intent ${newIntent.id} SETTLED (tx: ${result1.txHash})`);
                    } else {
                        console.error(`[OrderBook] ❌ Intent ${newIntent.id} settlement failed: ${result1.error}`);
                    }

                    if (result2.success) {
                        existingIntent.status = 'SETTLED';
                        console.log(`[OrderBook] ✅ Intent ${existingIntent.id} SETTLED (tx: ${result2.txHash})`);
                    } else {
                        console.error(`[OrderBook] ❌ Intent ${existingIntent.id} settlement failed: ${result2.error}`);
                    }

                    return {
                        matched: true,
                        intents: [newIntent, existingIntent],
                        settlements,
                    };
                }
            }
        }

        // No match found, add to book
        console.log(`[OrderBook] ⏳ No match found. Adding ${newIntent.id} to order book.`);
        this.orders.set(newIntent.id, newIntent);
        return { matched: false };
    }

    /**
     * Get all pending intents in the order book
     */
    getIntents(): Intent[] {
        return Array.from(this.orders.values());
    }

    /**
     * Get intent count
     */
    getCount(): number {
        return this.orders.size;
    }

    /**
     * Clear all intents (for testing)
     */
    clear(): void {
        this.orders.clear();
    }
}
