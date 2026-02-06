# 🌑 ShadowSwap

**MEV-Resistant Intent-Based Swaps powered by Yellow Network State Channels & Uniswap v4 Hooks**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-blue)](https://soliditylang.org/)
[![Uniswap v4](https://img.shields.io/badge/Uniswap-v4-ff007a)](https://docs.uniswap.org/)
[![Yellow Network](https://img.shields.io/badge/Yellow-Network-yellow)](https://yellow.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Live%20on%20Sepolia-success)](https://sepolia.etherscan.io/)

---

## 📖 Overview

ShadowSwap is an MEV-resistant decentralized exchange that leverages **intent-based trading** to protect users from front-running, sandwich attacks, and other MEV extraction techniques. 

Instead of broadcasting swap transactions publicly, users submit **private intents** to our backend solver. The solver matches intents peer-to-peer using **Yellow Network state channels** for instant off-chain coordination, then settles matched trades through a **Uniswap v4 Hook** that only allows our whitelisted solver to execute swaps.

### 🔑 Key Innovation

```
Traditional DEX Flow:
User → Public Mempool → MEV Bots See → Front-Run/Sandwich → User Gets Worse Price

ShadowSwap Flow:
User → Private Intent → Solver Matches P2P → Yellow State Channel → Hook-Protected Settlement
                                    ↑                                       ↓
                             No public mempool!                    Only solver can execute!
```

### ✅ Fully Functional on Sepolia Testnet

ShadowSwap is **live and working** on Sepolia! Users can:
1. Connect their wallet to the frontend
2. Submit swap intents (ETH ↔ SHADOW)
3. Get matched with counter-parties automatically
4. Have swaps settled on-chain through the protected Uniswap v4 pool
5. **Verify the trade** via our on-chain ENS Audit Trail

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ShadowSwap Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────┐        ┌────────────────────────────────────────────┐   │
│  │    User A     │        │              Backend Solver                 │   │
│  │  (Intent Tx)  │───────>│  ┌──────────┐  ┌───────────────────────┐  │   │
│  └───────────────┘        │  │ Express  │  │    Order Book         │  │   │
│                           │  │  API     │  │  (Intent Matcher)     │  │   │
│  ┌───────────────┐        │  └────┬─────┘  └───────────┬───────────┘  │   │
│  │    User B     │───────>│       │                    │              │   │
│  │  (Intent Tx)  │        │       ▼                    ▼              │   │
│  └───────────────┘        │  ┌────────────────────────────────────┐   │   │
│                           │  │          Settler Engine            │   │   │
│                           │  │   (On-Chain Settlement via Router) │   │   │
│                           │  └───────────────┬────────────────────┘   │   │
│                           │                  │                         │   │
│                           │  ┌────────────────────────────────────┐   │   │
│                           │  │         Yellow Client              │   │   │
│                           │  │   (State Channel Coordination)     │   │   │
│                           │  └───────────────┬────────────────────┘   │   │
│                           └──────────────────┼────────────────────────┘   │
│                                              │                             │
│                                              ▼                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    Yellow Network (Off-Chain Layer)                  │ │
│  │  ┌─────────────┐                                                     │ │
│  │  │  Clearnode  │◄── WebSocket ── Auth + Session Keys + Transfers    │ │
│  │  │  (Sandbox)  │                                                     │ │
│  │  └─────────────┘                                                     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                              │                             │
│                                              ▼                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    On-Chain Layer (Uniswap v4)                       │ │
│  │                                                                       │ │
│  │  ┌─────────────────┐      ┌───────────────────────────────────────┐  │ │
│  │  │   PoolManager   │◄─────│           ShadowRouter.sol            │  │ │
│  │  │   (v4-core)     │      │   - executeMatch() for settlements   │  │ │
│  │  └────────┬────────┘      │   - Pulls funds via transferFrom     │  │ │
│  │           │               │   - IUnlockCallback pattern          │  │ │
│  │           ▼               └───────────────────────────────────────┘  │ │
│  │  ┌─────────────────┐      ┌───────────────────────────────────────┐  │ │
│  │  │   ETH/SHADOW    │◄─────│           ShadowHook.sol              │  │ │
│  │  │     Pool        │      │   - beforeSwap() validation          │  │ │
│  │  │  (1:1000 ratio) │      │   - Only solver can execute swaps    │  │ │
│  │  └─────────────────┘      │   - Emits PrivateTradeSettled event  │  │ │
│  │                           └───────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
shadowswap/
├── README.md                    # This file
│
├── frontend/                    # React + Vite + TypeScript dApp
│   ├── package.json             # Dependencies (wagmi, viem, tailwind)
│   ├── vite.config.ts           # Vite + Tailwind configuration
│   └── src/
│       ├── main.tsx             # App entry (Web3Provider wrapper)
│       ├── App.tsx              # Main layout with SwapCard
│       ├── Web3Provider.tsx     # Wagmi + React Query setup
│       ├── config.ts            # Contract addresses & Pool Key exports
│       ├── config.json          # Auto-generated deployment config
│       ├── types.ts             # Intent, Token, API types
│       ├── components/
│       │   └── SwapCard.tsx     # Main swap interface component
│       ├── hooks/
│       │   ├── useShadowSubmit.ts # Intent submission hook
│       │   └── useToken.ts      # Token balance/approve hooks
│       └── utils/
│           ├── crypto.ts        # AES-GCM encryption, key derivation
│           └── api.ts           # Backend API client
│
├── backend/                     # Node.js/TypeScript solver backend
│   ├── package.json             # Dependencies (express, viem, ws)
│   ├── tsconfig.json            # TypeScript configuration
│   └── src/
│       ├── server.ts            # Express API server (POST /submit-intent)
│       ├── matcher.ts           # Price-aware OrderBook matching engine
│       ├── settler.ts           # On-chain settlement via ShadowRouter
│       ├── yellow-client.ts     # Yellow Network WebSocket client
│       ├── config.json          # Deployment addresses (synced with frontend)
│       ├── types.ts             # TypeScript type definitions
│       └── abis/
│           └── ShadowRouter.json # Router ABI for settlements
│
├── contracts/                   # Foundry Solidity project
│   ├── foundry.toml             # Foundry config (solc 0.8.26, via_ir, cancun)
│   ├── remappings.txt           # Import remappings
│   ├── src/
│   │   ├── ShadowHook.sol       # Uniswap v4 Hook (solver-only swaps)
│   │   └── ShadowRouter.sol     # Router for fund transfer & settlement
│   ├── script/
│   │   ├── DeployAll.s.sol      # Master deployment script
│   │   ├── DeployHook.s.sol     # Hook-only deployment
│   │   ├── AddLiquidity.s.sol   # Liquidity addition script
│   │   ├── DeployAndAddLiquidity.s.sol # Combined liquidity helper
│   │   └── mocks/
│   │       └── MockERC20.sol    # Mock SHADOW token for testing
│   ├── test/
│   │   └── ShadowHook.t.sol     # Comprehensive Foundry tests (7/7 passing)
│   └── lib/                     # Dependencies (v4-core, v4-periphery, forge-std)
│
└── docs/                        # Reference documentation
    ├── Learn yellow.md          # Yellow Network learning path
    ├── Quick Start Guide.md     # Yellow SDK quick start
    └── Yellow docs.md           # Nitrolite protocol specification
```

---

## 🔧 Components

### 1. ShadowHook (On-Chain MEV Protection)

The core MEV protection mechanism - a Uniswap v4 Hook that restricts swap execution to our whitelisted solver (the Router contract).

**File:** `contracts/src/ShadowHook.sol`

```solidity
contract ShadowHook is BaseHook {
    address public immutable solver;  // ShadowRouter address
    
    error OnlySolver();
    event PrivateTradeSettled(bytes32 indexed poolId, int256 amountSpecified);
    
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        if (sender != solver) revert OnlySolver();  // MEV Protection!
        emit PrivateTradeSettled(PoolId.unwrap(key.toId()), params.amountSpecified);
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
```

### 2. ShadowRouter (On-Chain Settlement)

The router contract that handles fund transfers and executes swaps through the PoolManager.

**File:** `contracts/src/ShadowRouter.sol`

```solidity
contract ShadowRouter is IUnlockCallback {
    address public immutable solver;      // Backend wallet address
    IPoolManager public immutable poolManager;
    
    modifier onlySolver() {
        require(msg.sender == solver, "Only solver");
        _;
    }
    
    /// @notice Execute a matched intent - pulls funds from user and swaps
    function executeMatch(
        PoolKey calldata key,
        address user,
        bool zeroForOne,
        int256 amountSpecified
    ) external payable onlySolver returns (BalanceDelta) {
        // For token swaps, pull tokens from user first
        if (!zeroForOne) {
            IERC20(Currency.unwrap(key.currency1)).transferFrom(
                user, address(this), uint256(amountSpecified)
            );
        }
        
        // Execute swap through PoolManager.unlock pattern
        bytes memory result = poolManager.unlock(
            abi.encode(key, user, zeroForOne, amountSpecified)
        );
        return abi.decode(result, (BalanceDelta));
    }
}
```

### 3. Settler Engine (Backend)

Executes on-chain settlements when intents are matched.

**File:** `backend/src/settler.ts`

```typescript
class Settler {
    async executeMatch(intentA: Intent, intentB: Intent): Promise<SettlementResult[]> {
        // Execute both sides of the matched trade
        const result1 = await this.settleIntent(intentA);
        const result2 = await this.settleIntent(intentB);
        
        // Notify Yellow Network of the completed trade
        await yellowClient.executeTrade(intentA, intentB);
        
        return [result1, result2];
    }
    
    private async settleIntent(intent: Intent): Promise<SettlementResult> {
        // Call ShadowRouter.executeMatch() on-chain
        const txHash = await walletClient.writeContract({
            address: SHADOW_ROUTER_ADDRESS,
            abi: SHADOW_ROUTER_ABI,
            functionName: 'executeMatch',
            args: [poolKey, intent.userAddress, zeroForOne, amountSpecified],
            value: isEthSwap ? BigInt(intent.amountIn) : 0n,
        });
        
        return { success: true, txHash };
    }
}
```

### 4. Price-Aware Order Matcher (Backend)

Matches intents based on the pool's price ratio (1 ETH = 1000 SHADOW).

**File:** `backend/src/matcher.ts`

```typescript
class OrderBook {
    // Price ratio: 1 ETH = 1000 SHADOW
    private readonly ETH_TO_SHADOW_RATIO = 1000n;
    
    private amountsMatch(ethAmount: bigint, shadowAmount: bigint): boolean {
        const expectedShadow = ethAmount * this.ETH_TO_SHADOW_RATIO;
        const tolerance = expectedShadow / 20n; // 5% tolerance
        return diff <= tolerance;
    }
    
    async addIntent(newIntent: Intent): Promise<MatchResult> {
        for (const [id, existingIntent] of this.orders) {
            // Check for inverse pair with price-aware matching
            if (this.isInversePair(newIntent, existingIntent) && 
                this.amountsMatch(ethAmount, shadowAmount)) {
                // Match found! Execute settlement
                const settlements = await settler.executeMatch(newIntent, existingIntent);
                return { matched: true, settlements };
            }
        }
        this.orders.set(newIntent.id, newIntent);
        return { matched: false };
    }
}
```

### 5. Frontend SwapCard Component

React component for submitting swap intents with wallet integration.

**File:** `frontend/src/components/SwapCard.tsx`

```typescript
function SwapCard() {
    const { submitIntent, isPending } = useShadowSubmit();
    const { approve, allowance } = useToken(tokenAddress, ROUTER_ADDRESS);
    
    const handleSwap = async () => {
        // 1. Approve router if needed (for token swaps)
        if (needsApproval) await approve(amount);
        
        // 2. Submit intent to backend
        await submitIntent({
            tokenIn: selectedToken.address,
            tokenOut: outputToken.address,
            amountIn: parseUnits(amount, 18).toString(),
            minAmountOut: "0",
        });
    };
}
```

### 6. Mock ENS Resolver (Audit Trail)

Simulates ENS text records to provide a decentralized audit trail of all settled trades.

**File:** `contracts/src/MockENSResolver.sol`

- Stores mapping of `node => key => value`
- Backend records `latest_settlement` hash for `shadowswap.eth`
- Frontend verifies this to prove on-chain settlement
---

## 🚀 Live Deployment (Sepolia Testnet)

### Current Contract Addresses

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **ShadowHook** | `0xE0dc953A2136a4cb6A9EEB3cbD44296969D14080` | [View](https://sepolia.etherscan.io/address/0xE0dc953A2136a4cb6A9EEB3cbD44296969D14080) |
| **ShadowRouter** | `0x4D54281B30b6D708A46d5dC64762288aF3748f81` | [View](https://sepolia.etherscan.io/address/0x4D54281B30b6D708A46d5dC64762288aF3748f81) |
| **SHADOW Token** | `0xf4442339bA89BC5DA1Cf2304Af163D1b82CF0751` | [View](https://sepolia.etherscan.io/address/0xf4442339bA89BC5DA1Cf2304Af163D1b82CF0751) |
| **LiquidityHelper** | `0x58f49493c477E7C4c2C2866896c5B1b904184c4E` | [View](https://sepolia.etherscan.io/address/0x58f49493c477E7C4c2C2866896c5B1b904184c4E) |
| **Solver Wallet** | `0xD2aA21AF4faa840Dea890DB2C6649AACF2C80Ff3` | [View](https://sepolia.etherscan.io/address/0xD2aA21AF4faa840Dea890DB2C6649AACF2C80Ff3) |

### Pool Configuration

| Parameter | Value |
|-----------|-------|
| **Pool ID** | `0xdad314d2c21833ecf196233147cca1d22adb13ff3d3306772022f8b9425fb788` |
| **Currency0** | ETH (`0x0000000000000000000000000000000000000000`) |
| **Currency1** | SHADOW (`0xf4442339bA89BC5DA1Cf2304Af163D1b82CF0751`) |
| **Fee** | 0.3% (3000) |
| **Tick Spacing** | 60 |
| **Price** | 1 ETH = 1000 SHADOW |
| **Initial Tick** | 69081 |

### Uniswap v4 Sepolia Addresses

| Contract | Address |
|----------|---------|
| PoolManager | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |
| PositionManager | `0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4` |
| Universal Router | `0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Foundry** (for smart contracts)
- **Private Key** with Sepolia ETH (for solver operations)
- **MetaMask** or compatible wallet

### Quick Start

```bash
# Clone the repository
git clone https://github.com/shreyas-sovani/shadowswap.git
cd shadowswap

# 1. Setup Frontend
cd frontend
npm install
npm run dev  # Starts on http://localhost:5173

# 2. Setup Backend (new terminal)
cd backend
npm install
# Set SOLVER_PRIVATE_KEY in .env
npm run server  # Starts on http://localhost:3000

# 3. Test a Swap!
# - Open http://localhost:5173 in two browser windows
# - Connect different wallets in each
# - User A: Swap 1 SHADOW → ETH
# - User B: Swap 0.001 ETH → SHADOW
# - Watch them match and settle on-chain!
```

### Environment Variables

**Backend (`backend/.env`):**
```bash
SOLVER_PRIVATE_KEY=0x...          # Backend solver wallet private key
ALCHEMY_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Deployment (For Redeployment)

```bash
cd contracts

# Set environment variables
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
export PRIVATE_KEY="your_deployer_private_key"
export SOLVER_ADDRESS="your_backend_solver_wallet_address"

# Deploy all contracts
forge script script/DeployAll.s.sol:DeployAll \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvvv

# Add liquidity
forge script script/DeployAndAddLiquidity.s.sol:DeployAndAddLiquidity \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  -vvvv
```
---

## 📋 Intent Format

```typescript
interface Intent {
    id: string;           // UUID v4
    userAddress: string;  // User's wallet address (0x...)
    tokenIn: string;      // Token to sell (address)
    tokenOut: string;     // Token to buy (address)
    amountIn: string;     // Amount to sell (wei, as string)
    minAmountOut: string; // Minimum amount to receive (wei, as string)
    status: 'PENDING' | 'MATCHED' | 'SETTLED';
}
```

### Example: Swap 1 SHADOW for ETH

```bash
curl -X POST http://localhost:3000/submit-intent \
  -H "Content-Type: application/json" \
  -d '{
    "id": "abc123",
    "userAddress": "0x97e6c2b90492155bFA552FE348A6192f4fB1F163",
    "tokenIn": "0xf4442339bA89BC5DA1Cf2304Af163D1b82CF0751",
    "tokenOut": "0x0000000000000000000000000000000000000000",
    "amountIn": "1000000000000000000",
    "minAmountOut": "0"
  }'
```

---

## 🛡️ Security Model

### MEV Protection Layers

| Layer | Protection Mechanism |
|-------|---------------------|
| **Intent Submission** | Private API, not public mempool |
| **Order Matching** | P2P matching in backend, no on-chain visibility |
| **State Coordination** | Yellow Network state channels (off-chain) |
| **Settlement** | Uniswap v4 Hook restricts swaps to Router only |
| **Fund Transfer** | Router uses transferFrom (users approve Router) |

### Trust Assumptions

1. **Solver Honesty**: Users trust the solver to execute matched intents fairly
2. **Yellow Network**: Clearnode acts as honest intermediary for state channels
3. **Hook Integrity**: Once deployed, the solver address is immutable
4. **Router Security**: Only the whitelisted solver wallet can call Router.executeMatch()

### Access Control Flow

```
Public User → PoolManager → ShadowHook._beforeSwap() → REVERT (OnlySolver)

Solver Wallet → ShadowRouter.executeMatch() → PoolManager → ShadowHook._beforeSwap() → SUCCESS ✓
```

---

## 🛠️ Development

### Running Tests

```bash
# Contract tests (with verbose output)
cd contracts && forge test -vvv

# Contract tests with gas report
cd contracts && forge test --gas-report
```

**Test Results (7/7 Passing):**
```
[PASS] test_Allow_Solver()
[PASS] test_HookPermissions()
[PASS] test_PoolManager()
[PASS] test_RevertIf_AnotherUser()
[PASS] test_RevertIf_PublicUser()
[PASS] test_SolverAddress()
[PASS] testFuzz_RevertIf_NotSolver(uint256)
```

### Foundry Configuration

```toml
# contracts/foundry.toml
[profile.default]
solc = "0.8.26"          # Required for Uniswap v4
via_ir = true            # Required for complex v4 contracts
evm_version = "cancun"   # Required for transient storage
optimizer = true
optimizer_runs = 200
```

### Yellow Network Endpoints

| Environment | WebSocket URL |
|------------|---------------|
| **Sandbox** | `wss://clearnet-sandbox.yellow.com/ws` |
| **Production** | `wss://clearnet.yellow.com/ws` |

---

## 📊 Development Progress

### Completed ✅

- [x] **Phase 1**: Yellow Network Research & Documentation
- [x] **Phase 2**: Yellow Network Auth + Channel Creation
- [x] **Phase 3**: Express Server & Matcher Core
- [x] **Phase 4**: Uniswap v4 Hook (ShadowHook.sol)
- [x] **Phase 5**: Comprehensive Foundry Tests (7/7 passing)
- [x] **Phase 5.5**: Sepolia Deployment Script with CREATE2 Salt Mining
- [x] **Phase 6**: Frontend Setup & Logic Layer
  - React + Vite + TypeScript scaffold
  - Wagmi v2 + React Query Web3 provider
  - Tailwind CSS styling
  - AES-GCM encryption utilities
- [x] **Phase 7**: Frontend UI Components
  - SwapCard component with token selection
  - Token balance & allowance hooks
  - Intent submission flow
- [x] **Phase 8**: ShadowRouter & Settlement System
  - ShadowRouter.sol with IUnlockCallback
  - AddLiquidity.s.sol script
  - DeployAll.s.sol master deployment
- [x] **Phase 9**: Full Integration & Testing
  - Deployed all contracts to Sepolia
  - Updated frontend to approve Router
  - Price-aware order matching (1 ETH = 1000 SHADOW)
  - On-chain settler engine
  - **End-to-end swaps working!** 🎉
- [x] **Phase 12**: ENS Integration (Audit Trail)
  - MockENSResolver contract & deployment
  - Backend integration to record settlements on-chain
- [x] **Phase 13**: UI Polish & Verification
  - "Verifiable Audit Trail" link in Success UI
  - Real-time Etherscan links for proof of settlement

### Future Roadmap 🗺️

- [ ] Production Yellow Network integration (mainnet Clearnode)
- [ ] Mainnet deployment
- [ ] Multi-token support
- [ ] Decentralized solver network
- [ ] Cross-chain intent support
- [ ] Mobile-responsive design
- [ ] Intent status tracking UI

---

## 📚 Technology Stack

### Frontend
- **Build Tool**: Vite 7.x
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS 4.x
- **Web3**: Wagmi v2 + viem
- **State**: @tanstack/react-query
- **Encryption**: Web Crypto API (native AES-GCM)

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Ethereum**: viem 2.45+ (wallet client, public client)
- **Yellow Network**: WebSocket client for Clearnode
- **Settlement**: ShadowRouter contract calls

### Smart Contracts
- **Language**: Solidity 0.8.26
- **Framework**: Foundry
- **DEX**: Uniswap v4 (v4-core + v4-periphery)
- **EVM Target**: Cancun (transient storage)
- **Deployment**: CREATE2 with HookMiner for address flags

---

## 📖 References

### Uniswap v4
- [Uniswap v4 Documentation](https://docs.uniswap.org/)
- [v4-core GitHub](https://github.com/Uniswap/v4-core)
- [v4-periphery GitHub](https://github.com/Uniswap/v4-periphery)

### Yellow Network
- [Yellow Network Docs](https://docs.yellow.org/)
- [Nitrolite Protocol Spec](./Yellow%20docs.md)
- [Quick Start Guide](./Quick%20Start%20Guide.md)

### MEV & Intent-Based Trading
- [Flashbots MEV Research](https://writings.flashbots.net/)
- [Intent-centric Architectures](https://www.paradigm.xyz/2023/06/intents)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

<p align="center">
  <strong>Built with 🌑 for a fairer DeFi</strong>
</p>
