import { useState, useEffect, useCallback, useRef } from 'react';
import { BACKEND_URL } from '../config';

export type SettlementEventType =
    | 'CONNECTED'
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
        message?: string;
        error?: string;
        counterpartyIntentId?: string;
        confirmations?: number;
        waitTimeMs?: number;
    };
}

export const useSettlementEvents = (intentId: string | null) => {
    const [events, setEvents] = useState<SettlementEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const connect = useCallback(() => {
        if (!intentId) return;

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        console.log(`[SSE] Connecting to events for intent: ${intentId}`);
        const eventSource = new EventSource(`${BACKEND_URL}/events/${intentId}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            console.log(`[SSE] Connected to events for intent: ${intentId}`);
            setIsConnected(true);
            setError(null);
        };

        eventSource.onmessage = (event) => {
            try {
                const parsedEvent: SettlementEvent = JSON.parse(event.data);
                console.log(`[SSE] Received event:`, parsedEvent.type);
                setEvents((prev) => [...prev, parsedEvent]);
            } catch (e) {
                console.error('[SSE] Failed to parse event:', e);
            }
        };

        eventSource.onerror = (err) => {
            console.error('[SSE] Connection error:', err);
            setIsConnected(false);
            // Don't set error for normal close
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log('[SSE] Connection closed');
            } else {
                setError('Connection lost. Retrying...');
            }
        };

        return () => {
            eventSource.close();
        };
    }, [intentId]);

    // Connect when intentId changes
    useEffect(() => {
        if (intentId) {
            const cleanup = connect();
            return cleanup;
        }
    }, [intentId, connect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    // Clear events when intentId changes
    useEffect(() => {
        setEvents([]);
    }, [intentId]);

    const clearEvents = useCallback(() => {
        setEvents([]);
    }, []);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        }
    }, []);

    // Get latest event of each type
    const latestEvent = events.length > 0 ? events[events.length - 1] : null;
    const latestTxHash = events.find((e) => e.data?.txHash)?.data?.txHash ?? null;

    return {
        events,
        latestEvent,
        latestTxHash,
        isConnected,
        error,
        clearEvents,
        disconnect,
    };
};
