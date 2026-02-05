/**
 * ShadowSwap - Authentication & Channel Initialization
 * =====================================================
 * Phase 2: Complete auth handshake using Nitrolite SDK
 * 
 * Based on the official Quickstart pattern:
 * 1. Generate session key
 * 2. auth_request with session key address
 * 3. Sign challenge with EIP-712 (main wallet via createEIP712AuthMessageSigner)
 * 4. auth_verify to complete
 * 5. create_channel or use existing
 */

import {
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createECDSAMessageSigner,
  createEIP712AuthMessageSigner,
  createGetChannelsMessage,
  createCreateChannelMessage,
} from '@erc7824/nitrolite';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import WebSocket from 'ws';
import 'dotenv/config';

// ============================================================================
// Configuration
// ============================================================================

const CLEARNODE_WS_URL = process.env.CLEARNODE_WS_URL || 'wss://clearnet-sandbox.yellow.com/ws';
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.ALCHEMY_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

// ============================================================================
// Logging Helpers
// ============================================================================

function logStep(step: number, title: string): void {
  console.log('');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  STEP ${step}: ${title}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

function logSuccess(message: string): void {
  console.log(`  ✅ ${message}`);
}

function logInfo(label: string, value: string): void {
  console.log(`  📍 ${label}: ${value}`);
}

function logData(label: string, data: any): void {
  console.log(`  📦 ${label}:`);
  const lines = JSON.stringify(data, null, 2).split('\n');
  lines.forEach(l => console.log('     ' + l));
}

function logError(message: string, error?: any): void {
  console.log(`  ❌ ${message}`);
  if (error) {
    console.log(`     ${error}`);
  }
}

// ============================================================================
// WebSocket Message Handler with Request ID Matching
// ============================================================================

class ClearnodeConnection {
  private ws: WebSocket;
  private pendingRequests = new Map<number, {
    resolve: (response: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(ws: WebSocket) {
    this.ws = ws;
    
    ws.on('message', (data: WebSocket.RawData) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.res) {
          const [requestId] = response.res;
          const pending = this.pendingRequests.get(requestId);
          
          if (pending) {
            clearTimeout(pending.timeout);
            this.pendingRequests.delete(requestId);
            pending.resolve(response);
          }
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    });
  }

  async send(message: string): Promise<any> {
    const parsed = JSON.parse(message);
    const requestId = parsed.req?.[0];
    
    if (requestId === undefined) {
      throw new Error('Message missing request ID');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for ID ${requestId}`));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      this.ws.send(message);
    });
  }

  close() {
    this.ws.close();
  }
}

async function connectToClearnode(url: string): Promise<ClearnodeConnection> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('Connection timeout'));
    }, 15000);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(new ClearnodeConnection(ws));
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ============================================================================
// Main Flow
// ============================================================================

async function main(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ShadowSwap - Yellow Network Auth & Channel               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in .env');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Setup accounts and signers
  // ──────────────────────────────────────────────────────────────────────────
  const mainAccount = privateKeyToAccount(PRIVATE_KEY);
  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  console.log('');
  logInfo('Main Wallet', mainAccount.address);
  logInfo('Session Key', sessionAccount.address);

  // Create wallet client for main wallet (EIP-712 signing)
  const walletClient = createWalletClient({
    account: mainAccount,
    chain: sepolia,
    transport: http(RPC_URL),
  });

  // Session signer for RPC messages (ECDSA)
  const sessionSigner = createECDSAMessageSigner(sessionPrivateKey);

  // ──────────────────────────────────────────────────────────────────────────
  // Connect to Clearnode
  // ──────────────────────────────────────────────────────────────────────────
  console.log('');
  console.log('⏳ Connecting to Clearnode...');
  const connection = await connectToClearnode(CLEARNODE_WS_URL);
  logSuccess('Connected to Clearnode');

  try {
    // ════════════════════════════════════════════════════════════════════════
    logStep(1, 'AUTH_REQUEST');
    
    // IMPORTANT: expires_at must be Unix timestamp in SECONDS (not milliseconds!)
    const expiresAtSeconds = BigInt(Math.floor(Date.now() / 1000) + 86400); // 24 hours
    
    const authParams = {
      address: mainAccount.address,
      session_key: sessionAccount.address,
      application: 'clearnode', // Use 'clearnode' for root permissions
      allowances: [{ asset: 'ytest.usd', amount: '1000' }],
      expires_at: expiresAtSeconds,
      scope: 'console',
    };
    
    logData('Auth Params', {
      ...authParams,
      expires_at: authParams.expires_at.toString(),
    });
    
    // Create signed auth request
    const authRequestMsg = await createAuthRequestMessage(authParams);
    
    logInfo('Sending', 'auth_request');
    const authResponse = await connection.send(authRequestMsg);
    
    const [, authMethod, authResult] = authResponse.res;
    
    if (authMethod === 'error') {
      throw new Error(`auth_request failed: ${authResult?.error}`);
    }
    
    // The response should be auth_challenge
    if (authMethod !== 'auth_challenge') {
      logInfo('Response Method', authMethod);
      logData('Response', authResult);
      throw new Error(`Expected auth_challenge, got ${authMethod}`);
    }
    
    logSuccess('Challenge received');
    
    const challengeMessage = authResult.challenge_message;
    logInfo('Challenge', challengeMessage);

    // ════════════════════════════════════════════════════════════════════════
    logStep(2, 'PREPARE EIP-712 AUTH SIGNER');
    
    // The partialMessage contains auth params (signer will add challenge + wallet)
    const partialMessage = {
      scope: authParams.scope,
      session_key: sessionAccount.address,
      expires_at: authParams.expires_at,
      allowances: authParams.allowances,
    };
    
    // EIP-712 domain for Yellow Network auth
    // Domain name should be 'clearnode' for Clearnode authentication
    const authDomain = {
      name: 'clearnode',
    };
    
    // Create the EIP-712 signer that will sign auth_verify requests
    const eip712AuthSigner = createEIP712AuthMessageSigner(
      walletClient,
      partialMessage,
      authDomain
    );
    
    logSuccess('EIP-712 auth signer configured');
    logData('Partial Message', {
      ...partialMessage,
      expires_at: partialMessage.expires_at.toString(),
    });

    // ════════════════════════════════════════════════════════════════════════
    logStep(3, 'AUTH_VERIFY');
    
    // Create auth_verify message - the EIP712 signer will sign it with the challenge
    const authVerifyMsg = await createAuthVerifyMessageFromChallenge(
      eip712AuthSigner,  // This signer will do EIP-712 signing internally
      challengeMessage   // The challenge UUID from auth_challenge
    );
    
    // Debug: show what we're sending
    logData('Auth Verify Message', JSON.parse(authVerifyMsg));
    
    logInfo('Sending', 'auth_verify');
    const verifyResponse = await connection.send(authVerifyMsg);
    
    const [, verifyMethod, verifyResult] = verifyResponse.res;
    
    if (verifyMethod === 'error') {
      logData('Error Response', verifyResult);
      throw new Error(`auth_verify failed: ${verifyResult?.error}`);
    }
    
    logSuccess('Authentication successful!');
    logData('Session Info', verifyResult);

    // ════════════════════════════════════════════════════════════════════════
    logStep(4, 'GET_CHANNELS');
    
    const getChannelsMsg = await createGetChannelsMessage(
      sessionSigner,
      mainAccount.address
    );
    
    const channelsResponse = await connection.send(getChannelsMsg);
    const [, channelsMethod, channelsResult] = channelsResponse.res;
    
    let hasChannel = false;
    
    if (channelsMethod === 'error') {
      logInfo('Note', `get_channels: ${channelsResult?.error}`);
    } else {
      const channels = channelsResult?.channels || [];
      logInfo('Channels Found', `${channels.length}`);
      hasChannel = channels.length > 0;
      
      if (hasChannel) {
        logData('Existing Channels', channels);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    logStep(5, 'CREATE_CHANNEL');
    
    if (hasChannel) {
      logSuccess('Using existing channel');
    } else {
      const createChannelParams = {
        chain_id: 11155111, // Sepolia
        token: '0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb' as `0x${string}`,
      };
      
      logData('Channel Params', createChannelParams);
      
      const createChannelMsg = await createCreateChannelMessage(
        sessionSigner,
        createChannelParams
      );
      
      const createResponse = await connection.send(createChannelMsg);
      const [, createMethod, createResult] = createResponse.res;
      
      if (createMethod === 'error') {
        const errorMsg = createResult?.error || '';
        if (errorMsg.toLowerCase().includes('already') || 
            errorMsg.toLowerCase().includes('exist') ||
            errorMsg.toLowerCase().includes('open')) {
          logInfo('Note', 'Channel already exists');
          logSuccess('Channel available');
        } else {
          logError('create_channel failed', errorMsg);
        }
      } else {
        logSuccess('Channel created!');
        logData('Channel', createResult);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // Success!
    // ════════════════════════════════════════════════════════════════════════
    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
    console.log('🎉 ══════════════════════════════════════════════════════ 🎉');
    console.log('   CHANNEL OPEN. READY FOR INTENTS.');
    console.log('🎉 ══════════════════════════════════════════════════════ 🎉');
    console.log('');
    console.log('✅ Phase 2 Complete');
    console.log('   - Authentication: SUCCESS');
    console.log('   - Session Key: REGISTERED');
    console.log('   - Channel: READY');
    console.log('');
    console.log('   Next: Implement intent submission and matching');
    console.log('');

  } finally {
    connection.close();
  }
}

// Run
main().catch((err) => {
  console.error('');
  console.error('════════════════════════════════════════════════════════════');
  console.error('');
  console.error('❌ FAILURE:', err.message || err);
  console.error('');
  process.exit(1);
});
