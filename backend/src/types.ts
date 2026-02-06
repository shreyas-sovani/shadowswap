export type IntentStatus = 'PENDING' | 'MATCHED' | 'SETTLING' | 'SETTLED' | 'FAILED';

export interface Intent {
    id: string;              // UUID
    userAddress: string;
    tokenIn: string;         // Token Address
    tokenOut: string;        // Token Address
    amountIn: string;        // BigInt string
    minAmountOut: string;    // BigInt string
    status: IntentStatus;

    // Settlement data (populated when matched/settled)
    matchId?: string;        // ID of the matched counter-party intent
    counterparty?: string;   // Address of counter-party
    txnHash?: string;        // Settlement transaction hash
    settlementError?: string; // Error message if settlement failed
    settledAt?: number;      // Unix timestamp of settlement
}

// Settlement event types for SSE streaming
export type SettlementEventType = 
    | 'MATCHED'
    | 'SETTLING_STARTED'
    | 'TX_SUBMITTED'
    | 'TX_CONFIRMING'
    | 'TX_CONFIRMED'
    | 'ENS_UPDATING'
    | 'ENS_CONFIRMED'
    | 'SETTLEMENT_COMPLETE'
    | 'SETTLEMENT_FAILED'
    | 'WAITING_RATE_LIMIT';

export interface SettlementEvent {
    type: SettlementEventType;
    intentId: string;
    timestamp: number;
    data?: {
        txHash?: string;
        blockNumber?: number;
        gasUsed?: string;
        counterparty?: string;
        matchId?: string;
        error?: string;
        message?: string;
        waitTimeMs?: number;
        confirmations?: number;
    };
}
