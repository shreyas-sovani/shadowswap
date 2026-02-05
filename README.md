# 🌑 ShadowSwap

**MEV-Resistant Intent-Based Swaps powered by Yellow Network State Channels & Uniswap v4 Hooks**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.26-blue)](https://soliditylang.org/)
[![Uniswap v4](https://img.shields.io/badge/Uniswap-v4-ff007a)](https://docs.uniswap.org/)
[![Yellow Network](https://img.shields.io/badge/Yellow-Network-yellow)](https://yellow.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

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
│  │  │   PoolManager   │◄─────│           ShadowHook.sol              │  │ │
│  │  │   (v4-core)     │      │   - beforeSwap() validation          │  │ │
│  │  └─────────────────┘      │   - Only solver can execute swaps    │  │ │
│  │                           │   - Emits PrivateTradeSettled event  │  │ │
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
├── backend/                     # Node.js/TypeScript solver backend
│   ├── package.json             # Dependencies (express, viem, ws, nitrolite)
│   ├── tsconfig.json            # TypeScript configuration
│   └── src/
│       ├── server.ts            # Express API server (POST /submit-intent)
│       ├── matcher.ts           # OrderBook intent matching engine
│       ├── yellow-client.ts     # Yellow Network WebSocket client
│       ├── types.ts             # TypeScript type definitions
│       ├── verify-auth.ts       # Yellow authentication flow testing
│       └── check-conn.ts        # Connection verification utility
│
├── contracts/                   # Foundry Solidity project
│   ├── foundry.toml             # Foundry config (solc 0.8.26, via_ir, cancun)
│   ├── remappings.txt           # Import remappings
│   ├── src/
│   │   └── ShadowHook.sol       # Uniswap v4 Hook (solver-only swaps)
│   ├── test/
│   │   └── ShadowHook.t.sol     # Comprehensive Foundry tests (7/7 passing)
│   └── lib/                     # Dependencies (v4-periphery, forge-std)
│
└── docs/                        # Reference documentation
    ├── Learn yellow.md          # Yellow Network learning path
    ├── Quick Start Guide.md     # Yellow SDK quick start
    └── Yellow docs.md           # Nitrolite protocol specification
```

---

## 🔧 Components

### 1. ShadowHook (On-Chain)

The core MEV protection mechanism - a Uniswap v4 Hook that restricts swap execution to our whitelisted solver.

**File:** `contracts/src/ShadowHook.sol`

```solidity
contract ShadowHook is BaseHook {
    address public immutable solver;  // Whitelisted backend address
    
    error OnlySolver();
    event PrivateTradeSettled(bytes32 indexed key, int256 amountSpecified);
    
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

**Key Features:**
- ✅ Only `beforeSwap` hook enabled
- ✅ Reverts for any non-solver swap attempts
- ✅ Emits `PrivateTradeSettled` event for off-chain tracking
- ✅ Immutable solver address (set at deployment)

### 2. Intent Matcher (Backend)

A peer-to-peer order matching engine that finds compatible intents for atomic execution.

**File:** `backend/src/matcher.ts`

```typescript
export class OrderBook {
    addIntent(newIntent: Intent): [Intent, Intent] | null {
        // Match logic: Find inverse pair with compatible amounts
        // TokenA→TokenB paired with TokenB→TokenA
        // Exact match on amounts (simplified for v1)
    }
}
```

### 3. Yellow Network Client (Backend)

WebSocket client for off-chain state channel coordination via Yellow Network's Clearnode.

**File:** `backend/src/yellow-client.ts`

```typescript
export interface YellowClient {
    ws: WebSocket;
    account: Account;
    sessionKey: SessionKeyInfo;
    sendRequest: (method: string, params: object) => Promise<RpcResponse>;
    executeTrade: (intentA: Intent, intentB: Intent) => Promise<void>;
}
```

**Capabilities:**
- 🔐 Auth request/response with session keys
- 📡 Nitro RPC message signing
- ⚡ Instant off-chain transfers
- 🔗 EIP-712 typed data support

### 4. Express API Server (Backend)

REST API for intent submission and lifecycle management.

**File:** `backend/src/server.ts`

```typescript
app.post('/submit-intent', async (req, res) => {
    // 1. Validate intent fields
    // 2. Add to OrderBook
    // 3. If matched → Execute via Yellow Client
    // 4. Return status (PENDING | MATCHED)
});
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **Foundry** (for smart contracts)
- **Private Key** with Sepolia ETH (for Yellow Network auth)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and ALCHEMY_RPC_URL

# Run development server
npm run dev

# Verify Yellow Network connection
npm run auth
```

### Smart Contracts Setup

```bash
cd contracts

# Install Foundry (if not installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install

# Build contracts
forge build

# Run tests
forge test -vvv
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

---

## 📋 Intent Format

```typescript
interface Intent {
    id: string;           // UUID
    userAddress: string;  // User's wallet address
    tokenIn: string;      // Token to sell (address)
    tokenOut: string;     // Token to buy (address)
    amountIn: string;     // Amount to sell (BigInt string)
    minAmountOut: string; // Minimum amount to receive (BigInt string)
    status: 'PENDING' | 'MATCHED' | 'SETTLED';
}
```

### Example Intent Submission

```bash
curl -X POST http://localhost:3000/submit-intent \
  -H "Content-Type: application/json" \
  -d '{
    "id": "intent-001",
    "userAddress": "0x1234...",
    "tokenIn": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "tokenOut": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "amountIn": "1000000000",
    "minAmountOut": "500000000000000000"
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
| **Settlement** | Uniswap v4 Hook restricts to solver-only |

### Trust Assumptions

1. **Solver Honesty**: Users trust the solver to execute matched intents fairly
2. **Yellow Network**: Clearnode acts as honest intermediary for state channels
3. **Hook Integrity**: Once deployed, the solver address is immutable

### Hook Access Control

```
Public User → PoolManager → ShadowHook._beforeSwap() → REVERT (OnlySolver)
                              ↑
Solver → PoolManager → ShadowHook._beforeSwap() → SUCCESS ✓
```

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Contract tests (with verbose output)
cd contracts && forge test -vvv

# Contract tests with gas report
cd contracts && forge test --gas-report

# Fuzz testing with more runs
cd contracts && forge test --fuzz-runs 1000
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
- [x] **Phase 2**: Yellow Network Auth + Channel Creation (`7dfe590`)
- [x] **Phase 3**: Express Server & Matcher Core (`f919033`)
- [x] **Phase 4**: Uniswap v4 Hook (ShadowHook.sol)
- [x] **Phase 5**: Comprehensive Foundry Tests (7/7 passing)

### In Progress 🔄

- [ ] Production Yellow Network integration
- [ ] Multi-token support in matcher
- [ ] Partial fill support
- [ ] Gas-optimized batch settlements

### Future Roadmap 🗺️

- [ ] Frontend dApp (Next.js + wagmi)
- [ ] Mainnet deployment
- [ ] Decentralized solver network
- [ ] Cross-chain intent support

---

## 📚 Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js 5.x
- **Ethereum**: viem (wallet client, public client)
- **Yellow Network**: @erc7824/nitrolite SDK
- **WebSocket**: ws

### Smart Contracts
- **Language**: Solidity 0.8.26
- **Framework**: Foundry
- **DEX**: Uniswap v4 (v4-core + v4-periphery)
- **EVM Target**: Cancun (transient storage)

### Yellow Network (Nitrolite Protocol)
- **State Channels**: Off-chain transfers with on-chain settlement
- **Session Keys**: Ephemeral keys for secure, gasless operations
- **Clearnode**: Unified ledger for cross-chain abstraction

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
