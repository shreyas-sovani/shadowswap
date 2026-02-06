import {
    createWalletClient,
    createPublicClient,
    http,
    type Address,
    type Hex,
    formatEther,
} from 'viem';
import { namehash } from 'viem/ens';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { Intent } from './types';
import 'dotenv/config';

// ============ Configuration ============

// Solver private key (the backend wallet that executes settlements)
const SOLVER_PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
if (!SOLVER_PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not set in environment');
}

// RPC URL for Sepolia
const RPC_URL = process.env.ALCHEMY_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';

// Contract addresses from config
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require('./config.json');

const ROUTER_ADDRESS = config.routerAddress as Address;
const HOOK_ADDRESS = config.hookAddress as Address;
const MOCK_TOKEN_ADDRESS = config.mockTokenAddress as Address;
const MOCK_ENS_ADDRESS = config.mockENSAddress as Address;

// Pool Key from config
const POOL_KEY = {
    currency0: config.poolKey.currency0 as Address,
    currency1: config.poolKey.currency1 as Address,
    fee: config.poolKey.fee,
    tickSpacing: config.poolKey.tickSpacing,
    hooks: HOOK_ADDRESS,
};

// ============ ABI ============

// ShadowRouter ABI for executeMatch function
const SHADOW_ROUTER_ABI = [
    {
        name: 'executeMatch',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            { name: 'user', type: 'address' },
            {
                name: 'poolKey',
                type: 'tuple',
                components: [
                    { name: 'currency0', type: 'address' },
                    { name: 'currency1', type: 'address' },
                    { name: 'fee', type: 'uint24' },
                    { name: 'tickSpacing', type: 'int24' },
                    { name: 'hooks', type: 'address' },
                ],
            },
            { name: 'zeroForOne', type: 'bool' },
            { name: 'amountIn', type: 'uint256' },
        ],
        outputs: [{ name: 'amountOut', type: 'uint256' }],
    },
    {
        name: 'solver',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'manager',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ name: '', type: 'address' }],
    },
    {
        name: 'MatchExecuted',
        type: 'event',
        inputs: [
            { name: 'user', type: 'address', indexed: true },
            { name: 'tokenIn', type: 'address', indexed: true },
            { name: 'tokenOut', type: 'address', indexed: true },
            { name: 'amountIn', type: 'uint256', indexed: false },
            { name: 'amountOut', type: 'uint256', indexed: false },
        ],
    },
] as const;

// MockENSResolver ABI
const MOCK_ENS_ABI = [
    {
        name: 'setText',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'key', type: 'string' },
            { name: 'value', type: 'string' },
        ],
        outputs: [],
    },
] as const;

// ============ Types ============

export interface SettlementResult {
    success: boolean;
    txHash?: Hex;
    amountOut?: string;
    error?: string;
}

// ============ Settlement Engine ============

export class SettlementEngine {
    private account;
    private walletClient;
    private publicClient;

    constructor() {
        // Initialize account from private key
        this.account = privateKeyToAccount(SOLVER_PRIVATE_KEY);

        // Initialize public client for reading
        this.publicClient = createPublicClient({
            chain: sepolia,
            transport: http(RPC_URL),
        });

        // Initialize wallet client for writing
        this.walletClient = createWalletClient({
            account: this.account,
            chain: sepolia,
            transport: http(RPC_URL),
        });

        console.log(`[Settler] ════════════════════════════════════════════`);
        console.log(`[Settler] Settlement Engine Initialized`);
        console.log(`[Settler] Solver Address: ${this.account.address}`);
        console.log(`[Settler] Router Address: ${ROUTER_ADDRESS}`);
        console.log(`[Settler] ════════════════════════════════════════════\n`);
    }

    /**
     * Verify that this solver is authorized on the router
     */
    async verifySolverAuthorization(): Promise<boolean> {
        try {
            const authorizedSolver = await this.publicClient.readContract({
                address: ROUTER_ADDRESS,
                abi: SHADOW_ROUTER_ABI,
                functionName: 'solver',
            }) as Address;

            const isAuthorized = authorizedSolver.toLowerCase() === this.account.address.toLowerCase();

            if (!isAuthorized) {
                console.error(`[Settler] ❌ SOLVER NOT AUTHORIZED!`);
                console.error(`[Settler] Expected: ${this.account.address}`);
                console.error(`[Settler] Router has: ${authorizedSolver}`);
            } else {
                console.log(`[Settler] ✅ Solver authorization verified`);
            }

            return isAuthorized;
        } catch (error) {
            console.error(`[Settler] Error verifying solver:`, error);
            return false;
        }
    }

    /**
     * Execute a matched intent on-chain
     * @param intent The intent to settle
     * @returns Settlement result with transaction hash
     */
    async execute(intent: Intent): Promise<SettlementResult> {
        console.log(`[Settler] ────────────────────────────────────────────`);
        console.log(`[Settler] Executing settlement for intent: ${intent.id}`);
        console.log(`[Settler] User: ${intent.userAddress}`);
        console.log(`[Settler] TokenIn: ${intent.tokenIn}`);
        console.log(`[Settler] TokenOut: ${intent.tokenOut}`);
        console.log(`[Settler] AmountIn: ${intent.amountIn}`);

        // Validate intent status
        if (intent.status !== 'MATCHED') {
            console.error(`[Settler] ❌ Intent status is ${intent.status}, expected MATCHED`);
            return {
                success: false,
                error: `Invalid intent status: ${intent.status}`,
            };
        }

        try {
            // Determine swap direction based on tokens
            // zeroForOne = true means swapping currency0 (ETH) for currency1 (SHADOW)
            // zeroForOne = false means swapping currency1 (SHADOW) for currency0 (ETH)
            const isEthToToken = intent.tokenIn.toLowerCase() === POOL_KEY.currency0.toLowerCase();
            const zeroForOne = isEthToToken;

            console.log(`[Settler] Direction: ${zeroForOne ? 'ETH → SHADOW' : 'SHADOW → ETH'}`);

            // Prepare the transaction
            const amountIn = BigInt(intent.amountIn);

            // For ETH swaps, we need to send value
            const value = isEthToToken ? amountIn : 0n;

            console.log(`[Settler] Calling executeMatch...`);
            console.log(`[Settler] Pool Key:`, POOL_KEY);
            console.log(`[Settler] Value (ETH): ${formatEther(value)}`);

            // Simulate the transaction first
            const { request } = await this.publicClient.simulateContract({
                address: ROUTER_ADDRESS,
                abi: SHADOW_ROUTER_ABI,
                functionName: 'executeMatch',
                args: [
                    intent.userAddress as Address,
                    POOL_KEY,
                    zeroForOne,
                    amountIn,
                ],
                value,
                account: this.account,
            });

            // Execute the transaction
            const txHash = await this.walletClient.writeContract(request);

            console.log(`[Settler] ✅ Transaction submitted!`);
            console.log(`[Settler] TxHash: ${txHash}`);

            // Wait for confirmation (1 block)
            console.log(`[Settler] Waiting for confirmation...`);
            const receipt = await this.publicClient.waitForTransactionReceipt({
                hash: txHash,
                confirmations: 1,
            });

            if (receipt.status === 'success') {
                console.log(`[Settler] ✅ Settlement CONFIRMED in block ${receipt.blockNumber}`);
                console.log(`[Settler] Gas used: ${receipt.gasUsed}`);

                // Update ENS Audit Trail (skip if it causes rate limiting issues)
                console.log(`[Settler] 📝 Recording settlement to Mock ENS...`);
                try {
                    const node = namehash("shadowswap.eth");
                    const key = "latest_settlement";
                    const value = txHash;

                    const { request: ensRequest } = await this.publicClient.simulateContract({
                        address: MOCK_ENS_ADDRESS,
                        abi: MOCK_ENS_ABI,
                        functionName: 'setText',
                        args: [node, key, value],
                        account: this.account,
                    });

                    const ensTx = await this.walletClient.writeContract(ensRequest);
                    console.log(`[Settler] ✅ ENS updated! Tx: ${ensTx}`);
                    
                    // Wait for ENS tx to confirm before continuing (avoid in-flight limit)
                    await this.publicClient.waitForTransactionReceipt({
                        hash: ensTx,
                        confirmations: 1,
                    });
                    console.log(`[Settler] ✅ ENS tx confirmed`);
                    
                    // Extra delay to be safe
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (ensError) {
                    console.error(`[Settler] ⚠️ Failed to update ENS (non-critical):`, ensError);
                }

                // Try to decode the MatchExecuted event to get amountOut
                let amountOut: string | undefined;
                for (const log of receipt.logs) {
                    // The MatchExecuted event signature
                    if (log.topics[0] === '0x...') { // We'd need the actual topic hash
                        // Decode event data
                    }
                }

                return {
                    success: true,
                    txHash,
                    amountOut,
                };
            } else {
                console.error(`[Settler] ❌ Transaction REVERTED`);
                return {
                    success: false,
                    txHash,
                    error: 'Transaction reverted',
                };
            }
        } catch (error: any) {
            console.error(`[Settler] ❌ Settlement failed:`, error.message || error);

            // Extract useful error info
            let errorMessage = 'Unknown error';
            if (error.shortMessage) {
                errorMessage = error.shortMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Execute settlements for a matched pair of intents
     * @param intent1 First matched intent
     * @param intent2 Second matched intent
     * @returns Array of settlement results
     */
    async executeMatch(intent1: Intent, intent2: Intent): Promise<[SettlementResult, SettlementResult]> {
        console.log(`\n[Settler] ════════════════════════════════════════════`);
        console.log(`[Settler] EXECUTING MATCHED PAIR`);
        console.log(`[Settler] Intent 1: ${intent1.id} (${intent1.userAddress})`);
        console.log(`[Settler] Intent 2: ${intent2.id} (${intent2.userAddress})`);
        console.log(`[Settler] ════════════════════════════════════════════`);

        // Execute both settlements sequentially with delay to avoid RPC rate limiting
        const result1 = await this.execute(intent1);
        
        // Wait 5 seconds before second settlement to avoid "in-flight transaction limit"
        console.log(`[Settler] ⏳ Waiting 5s before second settlement (RPC rate limit)...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const result2 = await this.execute(intent2);

        console.log(`[Settler] ════════════════════════════════════════════`);
        console.log(`[Settler] SETTLEMENT COMPLETE`);
        console.log(`[Settler] Intent 1: ${result1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`[Settler] Intent 2: ${result2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`[Settler] ════════════════════════════════════════════\n`);

        return [result1, result2];
    }

    /**
     * Get the solver's ETH balance
     */
    async getSolverBalance(): Promise<bigint> {
        return this.publicClient.getBalance({
            address: this.account.address,
        });
    }

    /**
     * Get solver address
     */
    getSolverAddress(): Address {
        return this.account.address;
    }
}

// Export singleton instance
export const settler = new SettlementEngine();
