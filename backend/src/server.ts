import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { setupClient, YellowClient } from './yellow-client';
import { OrderBook, MatchResult } from './matcher';
import { Intent } from './types';
import { settler } from './settler';
import { settlementEvents, getStoredEvents } from './events';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// State
let yellowClient: YellowClient;
const orderBook = new OrderBook();

// Routes
app.post('/submit-intent', async (req, res) => {
    try {
        const intent: Intent = req.body;

        // Basic Validation
        if (!intent.id || !intent.userAddress || !intent.tokenIn || !intent.tokenOut || !intent.amountIn || !intent.minAmountOut) {
            res.status(400).json({ error: 'Missing required intent fields' });
            return;
        }

        // Validate user address format
        if (!intent.userAddress.startsWith('0x') || intent.userAddress.length !== 42) {
            res.status(400).json({ error: 'Invalid userAddress format' });
            return;
        }

        // Set initial status
        intent.status = 'PENDING';

        console.log(`\n[API] ════════════════════════════════════════════`);
        console.log(`[API] NEW INTENT RECEIVED`);
        console.log(`[API] ════════════════════════════════════════════`);
        console.log(`[API] ID: ${intent.id}`);
        console.log(`[API] User: ${intent.userAddress}`);
        console.log(`[API] Direction: ${intent.tokenIn === '0x0000000000000000000000000000000000000000' ? 'ETH → SHADOW' : 'SHADOW → ETH'}`);
        console.log(`[API] Amount: ${intent.amountIn} wei`);
        console.log(`[API] ────────────────────────────────────────────`);

        // Add to OrderBook (now async due to settlements)
        const result = await orderBook.addIntent(intent);

        if (result.matched && result.intents && result.settlements) {
            const [matchedIntent, existingIntent] = result.intents;
            const [settlement1, settlement2] = result.settlements;

            console.log(`[API] 🎉 MATCH FOUND AND SETTLED!`);
            console.log(`[API] Matched with: ${existingIntent.id}`);
            console.log(`[API] Counter-party: ${existingIntent.userAddress}`);

            // Execute Trade via Yellow Client (for state channel updates)
            if (yellowClient) {
                await yellowClient.executeTrade(matchedIntent, existingIntent);
            } else {
                console.warn('[API] Warning: Yellow Client not initialized, skipping state channel update.');
            }

            res.status(200).json({
                success: true,
                status: matchedIntent.status,
                intentId: intent.id,
                matchId: existingIntent.id,
                counterparty: existingIntent.userAddress,
                settlement: {
                    yourTx: settlement1.success ? settlement1.txHash : null,
                    counterpartyTx: settlement2.success ? settlement2.txHash : null,
                    yourSuccess: settlement1.success,
                    counterpartySuccess: settlement2.success,
                    yourError: settlement1.error,
                    counterpartyError: settlement2.error,
                },
                message: settlement1.success && settlement2.success
                    ? 'Trade matched and settled on-chain!'
                    : 'Trade matched but settlement had issues. Check settlement details.'
            });
        } else {
            console.log(`[API] ⏳ No match found. Waiting in order book.`);
            console.log(`[API] ════════════════════════════════════════════\n`);

            res.status(200).json({
                success: true,
                status: 'PENDING',
                intentId: intent.id,
                message: 'Intent added to order book. Waiting for counter-party match.'
            });
        }

    } catch (error) {
        console.error('[API] Error processing intent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get intent status by ID
app.get('/intent/:id', (req, res) => {
    const { id } = req.params;
    const intent = orderBook.getIntent(id);

    if (!intent) {
        res.status(404).json({ error: 'Intent not found' });
        return;
    }

    res.status(200).json({
        id: intent.id,
        status: intent.status,
        userAddress: intent.userAddress,
        tokenIn: intent.tokenIn,
        tokenOut: intent.tokenOut,
        amountIn: intent.amountIn,
        direction: intent.tokenIn === '0x0000000000000000000000000000000000000000' ? 'ETH → SHADOW' : 'SHADOW → ETH',
        // Settlement data
        matchId: intent.matchId ?? null,
        counterparty: intent.counterparty ?? null,
        txnHash: intent.txnHash ?? null,
        settledAt: intent.settledAt ?? null,
        settlementError: intent.settlementError ?? null,
    });
});

// SSE endpoint for real-time settlement events
app.get('/events/:intentId', (req, res) => {
    const { intentId } = req.params;
    
    console.log(`[SSE] Client subscribed to events for intent: ${intentId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', intentId, timestamp: Date.now() })}\n\n`);

    // Replay any stored events for this intent (in case client connected late)
    const storedEvents = getStoredEvents(intentId);
    if (storedEvents.length > 0) {
        console.log(`[SSE] Replaying ${storedEvents.length} stored events for ${intentId}`);
        for (const event of storedEvents) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
    }

    // Listen for new settlement events for this intent
    const eventHandler = (event: any) => {
        if (event.intentId === intentId) {
            console.log(`[SSE] Sending event to ${intentId}:`, event.type);
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
    };

    settlementEvents.on('settlement', eventHandler);

    // Clean up on client disconnect
    req.on('close', () => {
        console.log(`[SSE] Client disconnected from intent: ${intentId}`);
        settlementEvents.off('settlement', eventHandler);
        res.end();
    });
});

// Get pending intents
app.get('/intents', (req, res) => {
    const intents = orderBook.getIntents();
    res.status(200).json({
        count: intents.length,
        intents: intents.map(intent => ({
            id: intent.id,
            userAddress: intent.userAddress,
            tokenIn: intent.tokenIn,
            tokenOut: intent.tokenOut,
            amountIn: intent.amountIn,
            status: intent.status,
            direction: intent.tokenIn === '0x0000000000000000000000000000000000000000' ? 'ETH → SHADOW' : 'SHADOW → ETH'
        }))
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        yellowClient: !!yellowClient,
        pendingIntents: orderBook.getIntents().length
    });
});

// Start Server
async function startServer() {
    try {
        console.log('\n════════════════════════════════════════════════════');
        console.log('           SHADOWSWAP BACKEND STARTING');
        console.log('════════════════════════════════════════════════════\n');

        // Verify Settler Configuration
        console.log('[Startup] Verifying solver authorization...');
        const isAuthorized = await settler.verifySolverAuthorization();
        if (!isAuthorized) {
            console.error('[Startup] ❌ Solver not authorized on ShadowRouter!');
            console.error('[Startup] Settlement transactions will fail.');
            console.error('[Startup] Please deploy ShadowRouter with the correct solver address.');
            // Continue anyway for testing purposes
        }

        // Log solver balance
        const balance = await settler.getSolverBalance();
        console.log(`[Startup] Solver ETH balance: ${Number(balance) / 1e18} ETH`);
        if (balance < BigInt(1e16)) { // Less than 0.01 ETH
            console.warn('[Startup] ⚠️  Low solver balance! May not be able to pay gas.');
        }

        console.log('\n[Startup] Initializing Yellow Client...');
        // Initialize Yellow Client (opens channel logic underneath)
        // using default config or env vars
        yellowClient = await setupClient();
        console.log('[Startup] Yellow Client initialized successfully.');

        app.listen(PORT, () => {
            console.log(`\n════════════════════════════════════════════════════`);
            console.log(`   Server is running on http://localhost:${PORT}`);
            console.log(`   Ready to match and settle intents!`);
            console.log(`════════════════════════════════════════════════════\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
