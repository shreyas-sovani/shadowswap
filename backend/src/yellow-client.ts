/**
 * ShadowSwap - Yellow Network Client Module
 * ==========================================
 * Reusable WebSocket client for Nitrolite Clearnode communication
 */

import WebSocket from 'ws';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, type WalletClient, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';
import 'dotenv/config';

// ============================================================================
// Types
// ============================================================================

export interface ClearnodeConfig {
  wsUrl: string;
  privateKey: `0x${string}`;
  rpcUrl?: string;
}

export interface RpcRequest {
  req: [number, string, object, number];
  sig: string[];
}

export interface RpcResponse {
  res: [number, string, any, number];
  sig: string[];
}

export interface SessionKeyInfo {
  privateKey: `0x${string}`;
  address: `0x${string}`;
}

export interface YellowClient {
  ws: WebSocket;
  account: ReturnType<typeof privateKeyToAccount>;
  sessionKey: SessionKeyInfo;
  walletClient: WalletClient;
  publicClient: PublicClient;
  sendRequest: (method: string, params: object, signatures?: string[]) => Promise<RpcResponse>;
  close: () => void;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: Partial<ClearnodeConfig> = {
  wsUrl: process.env.CLEARNODE_WS_URL || 'wss://clearnet-sandbox.yellow.com/ws',
  rpcUrl: process.env.ALCHEMY_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo',
};

// ============================================================================
// Helpers
// ============================================================================

let requestCounter = 0;

export function generateRequestId(): number {
  return Date.now() + (++requestCounter);
}

/**
 * Build a Nitro RPC message in compact array format
 */
export function buildRpcMessage(method: string, params: object, signatures: string[] = []): RpcRequest {
  return {
    req: [generateRequestId(), method, params, Date.now()],
    sig: signatures
  };
}

/**
 * Sign a message using keccak256 hash (for RPC messages)
 */
export async function signRpcPayload(
  payload: RpcRequest['req'],
  privateKey: `0x${string}`
): Promise<string> {
  const { keccak256, toBytes, signatureToHex } = await import('viem');
  const { sign } = await import('viem/accounts');
  
  // Nitro RPC signs the exact JSON bytes of the req array
  const messageBytes = toBytes(JSON.stringify(payload));
  const hash = keccak256(messageBytes);
  
  const signature = await sign({ hash, privateKey });
  return signatureToHex(signature);
}

// ============================================================================
// Client Setup
// ============================================================================

/**
 * Create and connect a Yellow Network client
 */
export async function setupClient(config?: Partial<ClearnodeConfig>): Promise<YellowClient> {
  const finalConfig: ClearnodeConfig = {
    wsUrl: config?.wsUrl || DEFAULT_CONFIG.wsUrl!,
    privateKey: config?.privateKey || process.env.PRIVATE_KEY as `0x${string}`,
    rpcUrl: config?.rpcUrl || DEFAULT_CONFIG.rpcUrl,
  };

  if (!finalConfig.privateKey) {
    throw new Error('PRIVATE_KEY not set in environment or config');
  }

  // Main wallet account
  const account = privateKeyToAccount(finalConfig.privateKey);
  
  // Generate ephemeral session key
  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);
  const sessionKey: SessionKeyInfo = {
    privateKey: sessionPrivateKey,
    address: sessionAccount.address,
  };

  // Viem clients for on-chain operations
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(finalConfig.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(finalConfig.rpcUrl),
  });

  // Connect WebSocket
  const ws = await connectWebSocket(finalConfig.wsUrl);

  // Request/response tracking
  const pendingRequests = new Map<number, {
    resolve: (response: RpcResponse) => void;
    reject: (error: Error) => void;
  }>();

  // Handle incoming messages
  ws.on('message', (data: WebSocket.RawData) => {
    try {
      const response: RpcResponse = JSON.parse(data.toString());
      if (response.res) {
        const [requestId] = response.res;
        const pending = pendingRequests.get(requestId);
        if (pending) {
          pendingRequests.delete(requestId);
          pending.resolve(response);
        }
      }
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  });

  /**
   * Send an RPC request and wait for response
   */
  async function sendRequest(
    method: string,
    params: object,
    signatures: string[] = []
  ): Promise<RpcResponse> {
    const message = buildRpcMessage(method, params, signatures);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        pendingRequests.delete(message.req[0]);
        reject(new Error(`Request timeout for method: ${method}`));
      }, 30000);

      pendingRequests.set(message.req[0], {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      ws.send(JSON.stringify(message));
    });
  }

  function close() {
    ws.close();
  }

  return {
    ws,
    account,
    sessionKey,
    walletClient,
    publicClient,
    sendRequest,
    close,
  };
}

/**
 * Connect to WebSocket with promise wrapper
 */
function connectWebSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 15000);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ============================================================================
// Authentication Helpers
// ============================================================================

/**
 * Create auth_request parameters per Nitrolite protocol
 */
export function buildAuthRequestParams(
  walletAddress: `0x${string}`,
  sessionKeyAddress: `0x${string}`,
  options?: {
    application?: string;
    scope?: string;
    expireInSeconds?: number;
    allowances?: Array<{ symbol: string; amount: string }>;
  }
): object {
  const expiresAt = Date.now() + (options?.expireInSeconds || 86400) * 1000; // Default 24h
  
  return {
    wallet: walletAddress,
    participant: sessionKeyAddress,  // Session key address
    app_name: options?.application || 'shadowswap',
    allowances: options?.allowances || [
      { symbol: 'ytest.usd', amount: '1000' }  // Default allowance
    ],
    expire: expiresAt,
    scope: options?.scope || 'console',
  };
}

/**
 * Sign auth challenge from Clearnode
 * The challenge can be either:
 * 1. A simple string/UUID - sign with personal_sign (EIP-191)
 * 2. EIP-712 typed data object - sign with signTypedData
 */
export async function signAuthChallenge(
  walletClient: WalletClient,
  challengeMessage: any
): Promise<`0x${string}`> {
  // Check if it's EIP-712 typed data (has domain, types, primaryType)
  if (
    typeof challengeMessage === 'object' &&
    challengeMessage.domain &&
    challengeMessage.types &&
    challengeMessage.primaryType
  ) {
    // EIP-712 typed data signing
    const signature = await walletClient.signTypedData({
      account: walletClient.account!,
      domain: challengeMessage.domain,
      types: challengeMessage.types,
      primaryType: challengeMessage.primaryType,
      message: challengeMessage.message,
    });
    return signature;
  }
  
  // Simple string challenge - use personal sign (EIP-191)
  const message = typeof challengeMessage === 'string' 
    ? challengeMessage 
    : JSON.stringify(challengeMessage);
  
  const signature = await walletClient.signMessage({
    account: walletClient.account!,
    message: message,
  });
  
  return signature;
}
