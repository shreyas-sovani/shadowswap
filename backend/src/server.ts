import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { setupClient, YellowClient } from './yellow-client';
import { OrderBook } from './matcher';
import { Intent } from './types';

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

        // Set initial status
        intent.status = 'PENDING';

        console.log(`\n[API] Received Intent: ${intent.id} from ${intent.userAddress}`);

        // Add to OrderBook
        const match = orderBook.addIntent(intent);

        if (match) {
            const [matchedIntent, existingIntent] = match;

            console.log(`[API] Match Detected! Triggering execution...`);

            // Execute Trade via Yellow Client
            if (yellowClient) {
                await yellowClient.executeTrade(matchedIntent, existingIntent);
            } else {
                console.warn('[API] Warning: Yellow Client not initialized, skipping execution call.');
            }

            res.status(200).json({
                status: 'MATCHED',
                matchId: existingIntent.id,
                message: 'Intent matched and trade executed.'
            });
        } else {
            res.status(200).json({
                status: 'PENDING',
                message: 'Intent added to order book. Waiting for match.'
            });
        }

    } catch (error) {
        console.error('[API] Error processing intent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
async function startServer() {
    try {
        console.log('Initializing Yellow Client...');
        // Initialize Yellow Client (opens channel logic underneath)
        // using default config or env vars
        yellowClient = await setupClient();
        console.log('Yellow Client initialized successfully.');

        app.listen(PORT, () => {
            console.log(`\nServer is running on http://localhost:${PORT}`);
            console.log('Ready to match intents...');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
