/**
 * ShadowSwap - Yellow Network Connection Pulse Check
 * ===================================================
 * Phase 1: Verify we can connect to Yellow Network's Clearnode
 * 
 * This script:
 * 1. Loads environment variables
 * 2. Connects to the Clearnode WebSocket
 * 3. Sends a `ping` request (no auth required)
 * 4. Logs SUCCESS or FAILURE
 */

import WebSocket from 'ws';
import { privateKeyToAccount } from 'viem/accounts';
import 'dotenv/config';

// ============================================================================
// Configuration
// ============================================================================

const CLEARNODE_WS_URL = process.env.CLEARNODE_WS_URL || 'wss://clearnet-sandbox.yellow.com/ws';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const CONNECTION_TIMEOUT_MS = 15000; // 15 seconds

// ============================================================================
// Helpers
// ============================================================================

function generateRequestId(): number {
  return Date.now();
}

/**
 * Build a Nitro RPC message in compact array format:
 * [requestId, method, params, timestamp]
 */
function buildRpcMessage(method: string, params: object = {}): string {
  const message = {
    req: [generateRequestId(), method, params, Date.now()],
    sig: [] // ping doesn't require signature
  };
  return JSON.stringify(message);
}

// ============================================================================
// Main Pulse Check
// ============================================================================

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       ShadowSwap - Yellow Network Pulse Check              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  // Validate environment
  if (!PRIVATE_KEY) {
    console.error('❌ FAILURE: PRIVATE_KEY not set in .env');
    process.exit(1);
  }

  // Derive wallet address from private key
  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`📍 Wallet Address: ${account.address}`);
  console.log(`🌐 Clearnode URL:  ${CLEARNODE_WS_URL}`);
  console.log('');
  console.log('⏳ Connecting to Yellow Network Clearnode...');

  // Create promise-based connection test
  const connectionResult = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve) => {
    const timeout = setTimeout(() => {
      ws.close();
      resolve({ success: false, error: 'Connection timeout after 15 seconds' });
    }, CONNECTION_TIMEOUT_MS);

    const ws = new WebSocket(CLEARNODE_WS_URL);

    ws.on('open', () => {
      console.log('✅ WebSocket connection established');
      console.log('📤 Sending ping request...');
      
      // Send ping - this is a public method that doesn't require auth
      const pingMessage = buildRpcMessage('ping', {});
      ws.send(pingMessage);
    });

    ws.on('message', (data: WebSocket.RawData) => {
      clearTimeout(timeout);
      
      try {
        const response = JSON.parse(data.toString());
        console.log('📥 Response received:');
        console.log(JSON.stringify(response, null, 2));
        
        // Check if we got a valid response
        if (response.res) {
          const [requestId, method, result, timestamp] = response.res;
          
          if (method === 'error') {
            // Even an error response means we connected successfully
            resolve({ 
              success: true, 
              data: { 
                connected: true, 
                method: 'ping',
                note: 'Received error response - connection works, method may need adjustment',
                result 
              } 
            });
          } else {
            resolve({ 
              success: true, 
              data: { 
                connected: true, 
                method,
                result,
                serverTimestamp: timestamp
              } 
            });
          }
        } else {
          resolve({ success: true, data: response });
        }
        
        ws.close();
      } catch (err) {
        resolve({ success: false, error: `Failed to parse response: ${err}` });
        ws.close();
      }
    });

    ws.on('error', (err: Error) => {
      clearTimeout(timeout);
      resolve({ success: false, error: `WebSocket error: ${err.message}` });
    });

    ws.on('close', (code: number, reason: Buffer) => {
      if (code !== 1000) {
        clearTimeout(timeout);
        resolve({ 
          success: false, 
          error: `WebSocket closed unexpectedly. Code: ${code}, Reason: ${reason.toString()}` 
        });
      }
    });
  });

  // Report results
  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  
  if (connectionResult.success) {
    console.log('');
    console.log('🎉 SUCCESS: Connected to Yellow Network Clearnode!');
    console.log('');
    console.log('Connection Details:');
    console.log(JSON.stringify(connectionResult.data, null, 2));
    console.log('');
    console.log('✅ Phase 1 Complete: Pulse check passed');
    console.log('   Next: Implement authentication flow');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ FAILURE: Could not connect to Yellow Network');
    console.log(`   Error: ${connectionResult.error}`);
    console.log('');
    console.log('Troubleshooting:');
    console.log('  1. Check your internet connection');
    console.log('  2. Verify CLEARNODE_WS_URL in .env');
    console.log('  3. Ensure the sandbox is operational');
    process.exit(1);
  }
}

// Run
main().catch((err) => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});
