/**
 * Settlement Event Emitter
 * 
 * Broadcasts real-time settlement events to connected SSE clients
 * Also stores recent events for replay when clients connect late
 */

import { EventEmitter } from 'events';
import type { SettlementEvent, SettlementEventType } from './types';

// Store events per intent for replay (keeps last N events per intent)
const MAX_EVENTS_PER_INTENT = 50;
const eventHistory: Map<string, SettlementEvent[]> = new Map();

// Clean up old events after 5 minutes
const EVENT_TTL_MS = 5 * 60 * 1000;

class SettlementEventEmitter extends EventEmitter {
    emit(event: 'settlement', data: SettlementEvent): boolean;
    emit(event: string, ...args: any[]): boolean {
        return super.emit(event, ...args);
    }

    on(event: 'settlement', listener: (data: SettlementEvent) => void): this;
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }
}

export const settlementEvents = new SettlementEventEmitter();

// Helper to emit settlement events
export function emitSettlementEvent(
    type: SettlementEventType,
    intentId: string,
    data?: SettlementEvent['data']
) {
    const event: SettlementEvent = {
        type,
        intentId,
        timestamp: Date.now(),
        data,
    };
    
    // Store in history
    if (!eventHistory.has(intentId)) {
        eventHistory.set(intentId, []);
    }
    const history = eventHistory.get(intentId)!;
    history.push(event);
    
    // Trim to max size
    if (history.length > MAX_EVENTS_PER_INTENT) {
        history.shift();
    }
    
    console.log(`[Events] 📢 ${type} for ${intentId.slice(0, 8)}...`);
    settlementEvents.emit('settlement', event);
}

// Get stored events for an intent (for replay on late connection)
export function getStoredEvents(intentId: string): SettlementEvent[] {
    return eventHistory.get(intentId) || [];
}

// Clean up old events periodically
setInterval(() => {
    const now = Date.now();
    for (const [intentId, events] of eventHistory.entries()) {
        // Filter out events older than TTL
        const recentEvents = events.filter(e => now - e.timestamp < EVENT_TTL_MS);
        if (recentEvents.length === 0) {
            eventHistory.delete(intentId);
        } else {
            eventHistory.set(intentId, recentEvents);
        }
    }
}, 60 * 1000); // Run cleanup every minute

