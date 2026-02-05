/**
 * ShadowSwap Frontend Configuration
 * 
 * Replace placeholder values with your actual deployment addresses from Phase 5 HookMiner logs.
 * Run the deployment script and copy the output values here.
 */

// ============ Backend Configuration ============
export const BACKEND_URL = 'http://localhost:3000';

// ============ Chain Configuration ============
export const CHAIN_ID = 11155111; // Sepolia
export const CHAIN_NAME = 'Sepolia';

// ============ Contract Addresses ============
// Replace with actual deployed addresses from `forge script` output

/**
 * ShadowHook contract address (deployed via HookMiner)
 * Must have BEFORE_SWAP_FLAG (bit 7 = 0x80) in address
 * 
 * Example from deployment:
 * HOOK_ADDRESS= 0x...80 (ends in 80 for beforeSwap flag)
 */
export const HOOK_ADDRESS = '0x0000000000000000000000000000000000000080'; // TODO: Replace with actual

/**
 * Uniswap v4 PoolManager on Sepolia
 * Source: https://docs.uniswap.org/contracts/v4/deployments
 */
export const POOL_MANAGER_ADDRESS = '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543';

/**
 * Mock token deployed during hook deployment (for testing)
 * In production, replace with actual token addresses
 */
export const MOCK_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Replace with actual

// ============ Pool Key Configuration ============
// These values define the specific pool for swap execution

/**
 * Pool Key Object
 * Used to identify the pool in Uniswap v4
 * 
 * Currency0 and Currency1 must be ordered: currency0 < currency1
 * address(0) represents native ETH
 */
export const POOL_KEY = {
  currency0: '0x0000000000000000000000000000000000000000', // Native ETH (address(0))
  currency1: '0x0000000000000000000000000000000000000000', // TODO: Replace with MOCK_TOKEN_ADDRESS
  fee: 3000, // 0.30% fee tier
  tickSpacing: 60,
  hooks: '0x0000000000000000000000000000000000000080', // TODO: Replace with HOOK_ADDRESS
} as const;

// ============ Supported Tokens ============
// Token metadata for the UI

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export const TOKENS: Record<string, Token> = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  SHADOW: {
    address: MOCK_TOKEN_ADDRESS,
    symbol: 'SHADOW',
    name: 'ShadowSwap Test Token',
    decimals: 18,
    logoURI: undefined,
  },
};

// ============ Yellow Network Configuration ============
export const YELLOW_NETWORK = {
  sandbox: 'wss://clearnet-sandbox.yellow.com/ws',
  production: 'wss://clearnet.yellow.com/ws',
} as const;

// ============ API Endpoints ============
export const API = {
  submitIntent: `${BACKEND_URL}/submit-intent`,
  getIntents: `${BACKEND_URL}/intents`,
  health: `${BACKEND_URL}/health`,
} as const;

// ============ UI Configuration ============
export const UI_CONFIG = {
  // Slippage tolerance options (in basis points)
  slippageOptions: [50, 100, 200, 500], // 0.5%, 1%, 2%, 5%
  defaultSlippage: 100, // 1%
  
  // Intent expiry time (in seconds)
  intentExpiryTime: 300, // 5 minutes
  
  // Polling interval for intent status (in ms)
  statusPollingInterval: 3000,
} as const;
