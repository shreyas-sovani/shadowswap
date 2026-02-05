# Learn

Welcome to the Yellow Network learning path. This section builds your understanding from fundamentals to advanced concepts.

---

## Introduction

Start here to understand what Yellow Network solves and how it works.

[What Yellow Solves](https://docs.yellow.org/docs/learn/introduction/what-yellow-solves) — Understand the core problems: scaling, cost, and speed. Learn why state channels are the answer for high-frequency applications.

[Architecture at a Glance](https://docs.yellow.org/docs/learn/introduction/architecture-at-a-glance) — See how the three protocol layers (on-chain, off-chain, application) work together to enable fast, secure transactions.

---

## Getting Started

Get hands-on with Yellow Network in minutes.

[Quickstart: Your First Channel](https://docs.yellow.org/docs/learn/getting-started/quickstart) — Create a state channel, perform an off-chain transfer, and verify the transaction in under 10 minutes.

[Prerequisites & Environment](https://docs.yellow.org/docs/learn/getting-started/prerequisites) — Set up a complete development environment with Node.js, TypeScript, and the Nitrolite SDK.

[Key Terms & Mental Models](https://docs.yellow.org/docs/learn/getting-started/key-terms) — Build your vocabulary and conceptual framework for understanding state channels.

---

## Core Concepts

Deep dive into the technology powering Yellow Network.

[State Channels vs L1/L2](https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2) — Compare state channels with Layer 1 and Layer 2 solutions. Understand when each approach is the right choice.

[App Sessions](https://docs.yellow.org/docs/learn/core-concepts/app-sessions) — Multi-party application channels with custom governance and state management.

[Session Keys](https://docs.yellow.org/docs/learn/core-concepts/session-keys) — Delegated keys for secure, gasless interactions without repeated wallet prompts.

[Challenge-Response & Disputes](https://docs.yellow.org/docs/learn/core-concepts/challenge-response) — How Yellow Network handles disputes and ensures your funds are always recoverable.

[Message Envelope](https://docs.yellow.org/docs/learn/core-concepts/message-envelope) — Overview of the Nitro RPC message format and communication protocol.

---

## Next Steps

After completing the Learn section, continue to:

* [Build](https://docs.yellow.org/docs/build/quick-start) — Implement complete Yellow Applications  
* [Protocol Reference](https://docs.yellow.org/docs/protocol/introduction) — Authoritative protocol specification

---

## Quick Reference

| Topic | Time | Difficulty |
| ----- | ----- | ----- |
| [What Yellow Solves](https://docs.yellow.org/docs/learn/introduction/what-yellow-solves) | 5 min | Beginner |
| [Architecture at a Glance](https://docs.yellow.org/docs/learn/introduction/architecture-at-a-glance) | 8 min | Beginner |
| [Quickstart](https://docs.yellow.org/docs/learn/getting-started/quickstart) | 10 min | Beginner |
| [Key Terms](https://docs.yellow.org/docs/learn/getting-started/key-terms) | 10 min | Beginner |
| [State Channels vs L1/L2](https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2) | 12 min | Intermediate |
| [App Sessions](https://docs.yellow.org/docs/learn/core-concepts/app-sessions) | 8 min | Intermediate |
| [Session Keys](https://docs.yellow.org/docs/learn/core-concepts/session-keys) | 8 min | Intermediate |
| [Challenge-Response](https://docs.yellow.org/docs/learn/core-concepts/challenge-response) | 6 min | Intermediate |
| [Message Envelope](https://docs.yellow.org/docs/learn/core-concepts/message-envelope) | 5 min | Intermediate |

# What Yellow Solves

In this guide, you will learn why Yellow Network exists, what problems it addresses, and how it provides a faster, cheaper way to build Web3 applications.

---

## The Blockchain Scalability Problem

Every blockchain transaction requires global consensus. While this guarantees security and decentralization, it creates three fundamental limitations:

| Challenge | Impact on Users |
| ----- | ----- |
| High Latency | Transactions take 15 seconds to several minutes for confirmation |
| High Costs | Gas fees spike during network congestion, making microtransactions impractical |
| Limited Throughput | Networks like Ethereum process \~15-30 transactions per second |

For applications requiring real-time interactions—gaming, trading, micropayments—these constraints make traditional blockchain unusable as a backend.

---

## How Yellow Network Solves This

Yellow Network uses state channels to move high-frequency operations off-chain while preserving blockchain-level security guarantees.

### The Core Insight

Most interactions between parties don't need immediate on-chain settlement. Consider a chess game with a 10 USDC wager:

* On-chain approach: Every move requires a transaction → 40+ transactions → $100s in fees  
* State channel approach: Lock funds once, play off-chain, settle once → 2 transactions → minimal fees

State channels let you execute unlimited off-chain operations between on-chain checkpoints.

### What You Get

| Feature | Benefit |
| ----- | ----- |
| Instant Transactions | Sub-second finality (\< 1 second typical) |
| Zero Gas Costs | Off-chain operations incur no blockchain fees |
| Unlimited Throughput\* | No consensus bottleneck limiting operations |
| Blockchain Security | Funds are always recoverable via on-chain contracts |

*\*Theoretically unlimited—state channels have no blockchain consensus overhead. Real-world performance depends on signature generation speed, network latency between participants, and application complexity. We'll be publishing detailed benchmarks soon.*

---

## The Nitrolite Protocol

Yellow Network is built on Nitrolite, a state channel protocol designed for EVM-compatible chains. Nitrolite provides:

* Fund Custody: Smart contracts that securely lock and release assets  
* Dispute Resolution: Challenge-response mechanism ensuring fair outcomes  
* Final Settlement: Cryptographic guarantees that final allocations are honored

When to Use Yellow Network

Choose Yellow Network when your application needs:

* Real-time interactions between users  
* Microtransactions or streaming payments  
* High transaction volumes without gas costs  
* Multi-party coordination with instant settlement

---

## Chain Abstraction with Clearnode

A Clearnode serves as your entry point to Yellow Network. When you connect to a Clearnode:

1. Deposit tokens into the Custody Contract on any supported chain  
2. Resize your channel to move funds to your unified balance  
3. Transact instantly with any other user on the network  
4. Withdraw back through the Custody Contract to any supported chain

Fund Flow

Funds flow through the Custody Contract (on-chain) before reaching your unified balance (off-chain). The resize operation moves funds between your on-chain available balance and your off-chain unified balance. See [Architecture](https://docs.yellow.org/docs/learn/introduction/architecture-at-a-glance#how-funds-flow) for the complete flow.

For example, deposit 50 USDC on Polygon and 50 USDC on Base—after resizing, your unified balance shows 100 USDC. You can then withdraw all 100 USDC to Arbitrum if you choose.

Deposit on Polygon  
50 USDC  
Unified Balance  
100 USDC  
Deposit on Base  
50 USDC  
Withdraw to Arbitrum  
100 USDC  
---

## Real-World Applications

### Payment Applications

* Micropayments: Pay-per-article, API usage billing, content monetization  
* Streaming payments: Subscription services, hourly billing, real-time payroll  
* P2P transfers: Instant remittances without intermediaries

### Gaming Applications

* Turn-based games: Chess, poker, strategy games with wagers  
* Real-time multiplayer: In-game economies with instant transactions  
* Tournaments: Prize pools and automated payouts

### DeFi Applications

* High-frequency trading: Execute trades without MEV concerns  
* Prediction markets: Real-time betting with instant settlement  
* Escrow services: Multi-party coordination with dispute resolution

---

## Security Model

Yellow Network maintains blockchain-level security despite operating off-chain:

| Guarantee | How It's Achieved |
| ----- | ----- |
| Fund Safety | All funds locked in audited smart contracts |
| Dispute Resolution | Challenge period allows contesting incorrect states |
| Cryptographic Proof | Every state transition is signed by participants |
| Recovery Guarantee | Users can always recover funds via on-chain contracts |

If a Clearnode becomes unresponsive or malicious, you can submit your latest signed state to the blockchain and recover your funds after a challenge period.

---

## Next Steps

Now that you understand what Yellow solves, continue to:

* [Architecture at a Glance](https://docs.yellow.org/docs/learn/introduction/architecture-at-a-glance) — See how the protocol layers work together  
* [Quickstart](https://docs.yellow.org/docs/learn/getting-started/quickstart) — Create your first state channel in minutes

# Architecture at a Glance

In this guide, you will learn how Yellow Network's three protocol layers work together to enable fast, secure, off-chain transactions.

---

## The Three Layers

Yellow Network consists of three interconnected layers, each with a specific responsibility:

Blockchain Layer  
On-Chain Layer  
Off-Chain Layer  
Application Layer  
Nitro RPC Protocol  
On-chain operations  
Monitors events  
Your Application  
Games, Payments, DeFi  
Client SDK  
Clearnode  
Custody & Adjudicator Contracts  
Ethereum, Polygon, Base, etc.

| Layer | Purpose | Speed | Cost |
| ----- | ----- | ----- | ----- |
| Application | Your business logic and user interface | — | — |
| Off-Chain | Instant state updates via Nitro RPC | \< 1 second | Zero gas |
| On-Chain | Fund custody, disputes, final settlement | Block time | Gas fees |

---

## On-Chain Layer: Security Foundation

The on-chain layer provides cryptographic guarantees through smart contracts:

### Custody Contract

The Custody Contract is the core of Nitrolite's on-chain implementation. It handles:

* Channel Creation: Lock funds and establish participant relationships  
* Dispute Resolution: Process challenges and validate states  
* Final Settlement: Distribute funds according to signed final state  
* Fund Management: Deposit and withdrawal operations

### Adjudicator Contracts

Adjudicators validate state transitions according to application-specific rules:

* SimpleConsensus: Both participants must sign (default for payment channels)  
* Custom Adjudicators: Application-specific validation logic

On-Chain Operations

You only touch the blockchain for:

1. Opening a channel (lock funds)  
2. Resizing a channel (add or remove funds)  
3. Closing a channel (unlock and distribute funds)  
4. Disputing a state (if counterparty is uncooperative)

---

## Off-Chain Layer: Speed and Efficiency

The off-chain layer handles high-frequency operations without blockchain transactions.

### Clearnode

A Clearnode is the off-chain service that:

* Manages the Nitro RPC protocol for state channel operations  
* Provides a unified balance across multiple chains  
* Coordinates payment channels between users  
* Hosts app sessions for multi-party applications

### Nitro RPC Protocol

Nitro RPC is a lightweight protocol optimized for state channel communication:

* Compact format: JSON array structure reduces message size by \~30%  
* Signed messages: Every request and response is cryptographically signed  
* Real-time updates: Bidirectional communication via WebSocket

*// Compact Nitro RPC format*  
\[requestId, method, params, timestamp\]

*// Example: Transfer 50 USDC*  
\[42, "transfer", {"destination": "0x...", "amount": "50.0", "asset": "usdc"}, 1699123456789\]  
---

## How Funds Flow

This diagram shows how your tokens move through the system:

1\. deposit  
2\. resize  
3\. resize  
4\. open session  
5\. close session  
6\. resize/close  
7\. withdraw  
User Wallet  
(ERC-20)  
Available Balance  
(Custody Contract)  
Channel-Locked  
(Custody Contract)  
Unified Balance  
(Clearnode)  
App Sessions  
(Applications)

### Fund States

| State | Location | What It Means |
| ----- | ----- | ----- |
| User Wallet | Your EOA | Full control, on-chain |
| Available Balance | Custody Contract | Deposited, ready for channels |
| Channel-Locked | Custody Contract | Committed to a specific channel |
| Unified Balance | Clearnode | Available for off-chain operations |
| App Session | Application | Locked in a specific app session |

---

## Channel Lifecycle

A payment channel progresses through distinct states:

create() with both signatures  
resize() (add/remove funds)  
close() (cooperative)  
challenge() (if disagreement)  
checkpoint() (newer state)  
Timeout expires  
VOID  
ACTIVE  
FINAL  
DISPUTE  
This is where  
99% of activity happens  
Legacy Flow

The diagram above shows the recommended flow where both participants sign the initial state, creating the channel directly in ACTIVE status. A legacy flow also exists where only the creator signs initially (status becomes INITIAL), and other participants call join() separately. See [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle) for details.

### Typical Flow

1. Create: Both parties sign initial state → channel becomes ACTIVE  
2. Operate: Exchange signed states off-chain (unlimited, zero gas)  
3. Close: Both sign final state → funds distributed

### Dispute Path (Rare)

If your counterparty becomes unresponsive:

1. Challenge: Submit your latest signed state on-chain  
2. Wait: Challenge period (typically 24 hours) allows counterparty to respond  
3. Finalize: If no newer state is submitted, your state becomes final

---

## Communication Patterns

### Opening a Channel

BlockchainClearnodeClientBlockchainClearnodeClientcreate\_channel requestchannel config \+ Clearnode signatureSign statecreate() with BOTH signaturesVerify, lock funds, emit eventEvent detectedChannel now ACTIVE

### Off-Chain Transfer

ReceiverClearnodeSenderReceiverClearnodeSenderComplete in \< 1 second, zero gastransfer(destination, amount)Validate, update ledgerConfirmed ✓balance\_update notification  
---

## Key Takeaways

| Concept | What to Remember |
| ----- | ----- |
| On-Chain | Only for opening, closing, disputes—security layer |
| Off-Chain | Where all the action happens—speed layer |
| Clearnode | Your gateway to the network—coordination layer |
| State Channels | Lock once, transact unlimited times, settle once |

Security Guarantee

At every stage, funds remain cryptographically secured. You can always recover your funds according to the latest valid signed state, even if a Clearnode becomes unresponsive.

---

## Next Steps

Ready to start building? Continue to:

* [Quickstart](https://docs.yellow.org/docs/learn/getting-started/quickstart) — Create your first channel in minutes  
* [Prerequisites](https://docs.yellow.org/docs/learn/getting-started/prerequisites) — Set up your development environment  
* [Core Concepts](https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2) — Deep dive into state channels

# Quickstart Guide

This guide provides a step-by-step walkthrough of integrating with the Yellow Network using the Nitrolite SDK. We will build a script to connect to the network, authenticate, manage state channels, and transfer funds.

## Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher)  
* [npm](https://www.npmjs.com/)

## Setup

1. Install Dependencies  
2. npm install  
3. Environment Variables  
   Create a .env file in your project root:  
4. *\# .env*  
5. PRIVATE\_KEY\=your\_sepolia\_private\_key\_here  
   ALCHEMY\_RPC\_URL\=your\_alchemy\_rpc\_url\_here

## 1\. Getting Funds

Before we write code, you need test tokens (ytest.usd). In the Sandbox, these tokens land in your Unified Balance (Off-Chain), which sits in the Yellow Network's clearing layer.

Request tokens via the Faucet:

curl \-XPOST https://clearnet-sandbox.yellow.com/faucet/requestTokens \\  
 \-H "Content-Type: application/json" \\  
 \-d '{"userAddress":"\<your\_wallet\_address\>"}'

## 2\. Initialization

First, we setup the NitroliteClient with Viem. This client handles all communication with the Yellow Network nodes and smart contracts.

import { NitroliteClient, WalletStateSigner, createECDSAMessageSigner } from '@erc7824/nitrolite';  
import { createPublicClient, createWalletClient, http } from 'viem';  
import { sepolia } from 'viem/chains';  
import { privateKeyToAccount } from 'viem/accounts';  
import WebSocket from 'ws';  
import 'dotenv/config';

*// Setup Viem Clients*  
const account \= privateKeyToAccount(process.env.PRIVATE\_KEY as \`0x${string}\`);  
const publicClient \= createPublicClient({ chain: sepolia, transport: http(process.env.ALCHEMY\_RPC\_URL) });  
const walletClient \= createWalletClient({ chain: sepolia, transport: http(), account });

*// Initialize Nitrolite Client*  
const client \= new NitroliteClient({  
   publicClient,  
   walletClient,  
   stateSigner: new WalletStateSigner(walletClient),  
   addresses: {  
       custody: '0x019B65A265EB3363822f2752141b3dF16131b262',  
       adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',  
   },  
   chainId: sepolia.id,  
   challengeDuration: 3600n,  
});

*// Connect to Sandbox Node*  
const ws \= new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

## 3\. Authentication

Authentication involves generating a temporary Session Key and verifying your identity using your main wallet (EIP-712).

*// Generate temporary session key*  
const sessionPrivateKey \= generatePrivateKey();  
const sessionSigner \= createECDSAMessageSigner(sessionPrivateKey);  
const sessionAccount \= privateKeyToAccount(sessionPrivateKey);

*// Send auth request*  
const authRequestMsg \= await createAuthRequestMessage({  
   address: account.address,  
   application: 'Test app',  
   session\_key: sessionAccount.address,  
   allowances: \[{ asset: 'ytest.usd', amount: '1000000000' }\],  
   expires\_at: BigInt(Math.floor(Date.now() / 1000) \+ 3600), *// 1 hour*  
   scope: 'test.app',  
});  
ws.send(authRequestMsg);

*// Handle Challenge (in ws.onmessage)*  
if (type \=== 'auth\_challenge') {  
   const challenge \= response.res\[2\].challenge\_message;  
   *// Sign with MAIN wallet*  
   const signer \= createEIP712AuthMessageSigner(walletClient, authParams, { name: 'Test app' });  
   const verifyMsg \= await createAuthVerifyMessageFromChallenge(signer, challenge);  
   ws.send(verifyMsg);  
}

## 4\. Channel Lifecycle

### Creating a Channel

If no channel exists, we request the Node to open one.

const createChannelMsg \= await createCreateChannelMessage(  
   sessionSigner, *// Sign with session key*  
   {  
       chain\_id: 11155111, *// Sepolia*  
       token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', *// ytest.usd*  
   }  
);  
ws.send(createChannelMsg);

*// Listen for 'create\_channel' response, then submit to chain*  
const createResult \= await client.createChannel({  
   channel,  
   unsignedInitialState,  
   serverSignature,  
});

### Funding (Resizing)

To fund the channel, we perform a "Resize". Since your funds are in your Unified Balance (from the Faucet), we use allocate\_amount to move them into the Channel.

Important: Do NOT use resize\_amount unless you have deposited funds directly into the L1 Custody Contract.

const resizeMsg \= await createResizeChannelMessage(  
   sessionSigner,  
   {  
       channel\_id: channelId,  
       allocate\_amount: 20n, *// Moves 20 units from Unified Balance \-\> Channel*  
       funds\_destination: account.address,  
   }  
);  
ws.send(resizeMsg);

*// Submit resize proof to chain*  
await client.resizeChannel({ resizeState, proofStates });

### Closing & Withdrawing

Finally, we cooperatively close the channel. This settles the balance on the L1 Custody Contract, allowing you to withdraw.

*// Close Channel*  
const closeMsg \= await createCloseChannelMessage(sessionSigner, channelId, account.address);  
ws.send(closeMsg);

*// Submit close to chain*  
await client.closeChannel({ finalState, stateData });

*// Withdraw from Custody Contract to Wallet*  
const withdrawalTx \= await client.withdrawal(tokenAddress, withdrawableBalance);  
console.log('Funds withdrawn:', withdrawalTx);

## Troubleshooting

Here are common issues and solutions:

* InsufficientBalance:  
  * Cause: Trying to use resize\_amount (L1 funds) without depositing first.  
  * Fix: Use allocate\_amount to fund from your Off-chain Unified Balance (Faucet).  
* DepositAlreadyFulfilled:  
  * Cause: Double-submitting a funding request or channel creation.  
  * Fix: Check if the channel is already open or funded before sending requests.  
* InvalidState:  
  * Cause: Resizing a closed channel or version mismatch.  
  * Fix: Ensure you are using the latest channel state from the Node.  
* operation denied: non-zero allocation:  
  * Cause: Too many "stale" channels open.  
  * Fix: Run the cleanup script npx tsx close\_all.ts.  
* Timeout waiting for User to fund Custody:  
  * Cause: Re-running scripts without closing channels accumulates balance requirements.  
  * Fix: Run close\_all.ts to reset.

### Cleanup Script

If you get stuck, use this script to close all open channels:

npx tsx close\_all.ts

## Complete Code

### index.ts

Click to view full index.ts

import {

   NitroliteClient,

   WalletStateSigner,

   createTransferMessage,

   createGetConfigMessage,

   createECDSAMessageSigner,

   createEIP712AuthMessageSigner,

   createAuthVerifyMessageFromChallenge,

   createCreateChannelMessage,

   createResizeChannelMessage,

   createGetLedgerBalancesMessage,

   createAuthRequestMessage,

   createCloseChannelMessage

} from '@erc7824/nitrolite';

import type {

   RPCNetworkInfo,

   RPCAsset,

   RPCData

} from '@erc7824/nitrolite';

import { createPublicClient, createWalletClient, http } from 'viem';

import { sepolia } from 'viem/chains';

import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

import WebSocket from 'ws';

import 'dotenv/config';

import \* as readline from 'readline';

console.log('Starting script...');

*// Helper to prompt for input*

const askQuestion \= (query: string): Promise\<string\> \=\> {

   const rl \= readline.createInterface({

       input: process.stdin,

       output: process.stdout,

   });

   return new Promise(resolve \=\> rl.question(query, ans \=\> {

       rl.close();

       resolve(ans);

   }));

};

*// Your wallet private key (use environment variables in production\!)*

let PRIVATE\_KEY \= process.env.PRIVATE\_KEY as \`0x${string}\`;

if (\!PRIVATE\_KEY) {

   console.log('PRIVATE\_KEY not found in .env');

   const inputKey \= await askQuestion('Please enter your Private Key: ');

   if (\!inputKey) {

       throw new Error('Private Key is required');

   }

   PRIVATE\_KEY \= inputKey.startsWith('0x') ? inputKey as \`0x${string}\` : \`0x${inputKey}\` as \`0x${string}\`;

}

const account \= privateKeyToAccount(PRIVATE\_KEY);

*// Create viem clients*

const ALCHEMY\_RPC\_URL \= process.env.ALCHEMY\_RPC\_URL;

const FALLBACK\_RPC\_URL \= 'https://1rpc.io/sepolia'; *// Public fallback*

const publicClient \= createPublicClient({

   chain: sepolia,

   transport: http(ALCHEMY\_RPC\_URL || FALLBACK\_RPC\_URL),

});

const walletClient \= createWalletClient({

   chain: sepolia,

   transport: http(),

   account,

});

interface Config {

   assets?: RPCAsset\[\];

   networks?: RPCNetworkInfo\[\];

   \[key: string\]: any;

}

async function fetchConfig(): Promise\<Config\> {

   const signer \= createECDSAMessageSigner(PRIVATE\_KEY);

   const message \= await createGetConfigMessage(signer);

   const ws \= new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

   return new Promise((resolve, reject) \=\> {

       ws.onopen \= () \=\> {

           ws.send(message);

       };

       ws.onmessage \= (event) \=\> {

           try {

               const response \= JSON.parse(event.data.toString());

               *// Response format: \[requestId, method, result, timestamp\]*

               *// or NitroliteRPCMessage structure depending on implementation*

               *// Based on types: NitroliteRPCMessage { res: RPCData }*

               *// RPCData: \[RequestID, RPCMethod, object, Timestamp?\]*

               if (response.res && response.res\[2\]) {

                   resolve(response.res\[2\] as Config);

                   ws.close();

               } else if (response.error) {

                   reject(new Error(response.error.message || 'Unknown RPC error'));

                   ws.close();

               }

           } catch (err) {

               reject(err);

               ws.close();

           }

       };

       ws.onerror \= (error) \=\> {

           reject(error);

           ws.close();

       };

   });

}

*// Initialize Nitrolite client*

console.log('Fetching configuration...');

const config \= await fetchConfig();

console.log('Configuration fetched. Assets count:', config.assets?.length);

const client \= new NitroliteClient({

   publicClient,

   walletClient,

   *// Use WalletStateSigner for signing states*

   stateSigner: new WalletStateSigner(walletClient),

   *// Contract addresses*

   addresses: {

       custody: '0x019B65A265EB3363822f2752141b3dF16131b262',

       adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',

   },

   chainId: sepolia.id,

   challengeDuration: 3600n, *// 1 hour challenge period*

});

console.log('✓ Client initialized');

console.log('  Wallet Address:', account.address);

console.log('  (Please ensure this address has Sepolia ETH)');

*// Connect to Clearnode WebSocket (using sandbox for testing)*

const ws \= new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

*// Step 1: Generate session keypair locally*

const sessionPrivateKey \= generatePrivateKey();

const sessionAccount \= privateKeyToAccount(sessionPrivateKey);

const sessionAddress \= sessionAccount.address;

*// Helper: Create a signer for the session key*

const sessionSigner \= createECDSAMessageSigner(sessionPrivateKey);

*// Step 2: Send auth\_request*

const authParams \= {

   session\_key: sessionAddress,        *// Session key you generated*

   allowances: \[{                      *// Add allowance for ytest.usd*

       asset: 'ytest.usd',

       amount: '1000000000'            *// Large amount*

   }\],

   expires\_at: BigInt(Math.floor(Date.now() / 1000) \+ 3600), *// 1 hour in seconds*

   scope: 'test.app',

};

const authRequestMsg \= await createAuthRequestMessage({

   address: account.address,           *// Your main wallet address*

   application: 'Test app',            *// Match domain name*

   ...authParams

});

*// We need to capture channelId to close it.*

let activeChannelId: string | undefined;

*// Helper function to trigger resize*

const triggerResize \= async (channelId: string, token: string, skipResize: boolean \= false) \=\> {

   console.log('  Using existing channel:', channelId);

   *// Add delay to ensure Node indexes the channel*

   console.log('  Waiting 5s for Node to index channel...');

   await new Promise(resolve \=\> setTimeout(resolve, 5000));

   *// For withdrawal, we don't need to check user balance or allowance*

   *// because the Node (counterparty) is the one depositing funds.*

   *// For withdrawal, we don't deposit (we are withdrawing off-chain funds).*

   *// \-------------------------------------------------------------------*

   *// 3\. Fund Channel (Resize)*

   *// \-------------------------------------------------------------------*

   *// We use 'allocate\_amount' to move funds from the User's Unified Balance (off-chain)*

   *// into the Channel. This assumes the user has funds in their Unified Balance (e.g. from faucet).*

   const amountToFund \= 20n;

   if (\!skipResize) console.log('\\nRequesting resize to fund channel with 20 tokens...');

   if (\!skipResize) {

       const resizeMsg \= await createResizeChannelMessage(

           sessionSigner,

           {

               channel\_id: channelId as \`0x${string}\`,

               *// resize\_amount: 10n, // \<-- This requires L1 funds in Custody (which we don't have)*

               allocate\_amount: amountToFund,  *// \<-- This pulls from Unified Balance (Faucet) (Variable name adjusted)*

               funds\_destination: account.address,

           }

       );

       ws.send(resizeMsg);

       *// Wait for resize confirmation*

       console.log('  Waiting for resize confirmation...');

       await new Promise\<void\>((resolve, reject) \=\> {

           const timeout \= setTimeout(() \=\> reject(new Error('Resize timeout')), 30000);

           const handler \= (data: any) \=\> {

               const msg \= JSON.parse(data.toString());

               if (msg.res && msg.res\[1\] \=== 'resize\_channel') {

                   const payload \= msg.res\[2\];

                   if (payload.channel\_id \=== channelId) {

                       clearTimeout(timeout);

                       ws.off('message', handler);

                       resolve();

                   }

               }

           };

           ws.on('message', handler);

       });

       *// Wait for balance update*

       await new Promise(r \=\> setTimeout(r, 2000));

       console.log('✓ Resize complete.');

   } else {

       console.log('  Skipping resize step (already funded).');

   }

   *// Verify Channel Balance*

   const channelBalances \= await publicClient.readContract({

       address: client.addresses.custody,

       abi: \[{

           name: 'getChannelBalances',

           type: 'function',

           stateMutability: 'view',

           inputs: \[{ name: 'channelId', type: 'bytes32' }, { name: 'tokens', type: 'address\[\]' }\],

           outputs: \[{ name: 'balances', type: 'uint256\[\]' }\]

       }\],

       functionName: 'getChannelBalances',

       args: \[channelId as \`0x${string}\`, \[token as \`0x${string}\`\]\],

   }) as bigint\[\];

   console.log(\`✓ Channel funded with ${channelBalances\[0\]} USDC\`);

   *// Check User Balance again*

   let finalUserBalance \= 0n;

   try {

       const result \= await publicClient.readContract({

           address: client.addresses.custody,

           abi: \[{

               type: 'function',

               name: 'getAccountsBalances',

               inputs: \[{ name: 'users', type: 'address\[\]' }, { name: 'tokens', type: 'address\[\]' }\],

               outputs: \[{ type: 'uint256\[\]' }\],

               stateMutability: 'view'

           }\] as const,

           functionName: 'getAccountsBalances',

           args: \[\[client.account.address\], \[token as \`0x${string}\`\]\],

       }) as bigint\[\];

       finalUserBalance \= result\[0\];

       console.log(\`✓ User Custody Balance after resize: ${finalUserBalance}\`);

   } catch (e) {

       console.warn('    Error checking final user balance:', e);

   }

   *// \-------------------------------------------------------------------*

   *// 4\. Off-Chain Transfer*

   *// \-------------------------------------------------------------------*

};

*// State to prevent infinite auth loops*

let isAuthenticated \= false;

*// Step 3: Sign the challenge with your MAIN wallet (EIP-712)*

ws.onmessage \= async (event) \=\> {

   const response \= JSON.parse(event.data.toString());

   console.log('Received WS message:', JSON.stringify(response, null, 2));

   if (response.error) {

       console.error('RPC Error:', response.error);

       process.exit(1); *// Exit on error to prevent infinite loops*

   }

   if (response.res && response.res\[1\] \=== 'auth\_challenge') {

       if (isAuthenticated) {

           console.log('  Ignoring auth\_challenge (already authenticated)');

           return;

       }

       const challenge \= response.res\[2\].challenge\_message;

       *// Create EIP-712 typed data signature with main wallet*

       const signer \= createEIP712AuthMessageSigner(

           walletClient,

           authParams,

           { name: 'Test app' }

       );

       *// Send auth\_verify using builder*

       *// We sign with the MAIN wallet for the first verification*

       const verifyMsg \= await createAuthVerifyMessageFromChallenge(

           signer,

           challenge

       );

       ws.send(verifyMsg);

   }

   if (response.res && response.res\[1\] \=== 'auth\_verify') {

       console.log('✓ Authenticated successfully');

       isAuthenticated \= true; *// Mark as authenticated*

       const sessionKey \= response.res\[2\].session\_key;

       console.log('  Session key:', sessionKey);

       console.log('  JWT token received');

       *// Query Ledger Balances*

       const ledgerMsg \= await createGetLedgerBalancesMessage(

           sessionSigner,

           account.address,

           Date.now()

       );

       ws.send(ledgerMsg);

       console.log('  Sent get\_ledger\_balances request...');

       *// Wait for 'channels' message to proceed*

   }

   if (response.res && response.res\[1\] \=== 'channels') {

       const channels \= response.res\[2\].channels;

       const openChannel \= channels.find((c: any) \=\> c.status \=== 'open');

       *// Derive token*

       const chainId \= sepolia.id;

       const supportedAsset \= (config.assets as any)?.find((a: any) \=\> a.chain\_id \=== chainId);

       const token \= supportedAsset ? supportedAsset.token : '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

       if (openChannel) {

           console.log('✓ Found existing open channel');

           *// CORRECT: Check if channel is already funded*

           const currentAmount \= BigInt(openChannel.amount || 0); *// Need to parse amount*

           *// Wait, standard RPC returns strings. Let's rely on openChannel structure.*

           *// openChannel object from logs: { ..., amount: "40", ... }*

           if (BigInt(openChannel.amount) \>= 20n) {

               console.log(\`  Channel already funded with ${openChannel.amount} USDC.\`);

               console.log('  Skipping resize to avoid "Insufficient Balance" errors.');

               *// Call triggerResize but indicate skipping actual resize*

               await triggerResize(openChannel.channel\_id, token, true);

           } else {

               await triggerResize(openChannel.channel\_id, token, false);

           }

       } else {

           console.log('  No existing open channel found, creating new one...');

           console.log('  Using token:', token, 'for chain:', chainId);

           *// Request channel creation*

           const createChannelMsg \= await createCreateChannelMessage(

               sessionSigner,

               {

                   chain\_id: 11155111, *// Sepolia*

                   token: token,

               }

           );

           ws.send(createChannelMsg);

       }

   }

   if (response.res && response.res\[1\] \=== 'create\_channel') {

       const { channel\_id, channel, state, server\_signature } \= response.res\[2\];

       activeChannelId \= channel\_id;

       console.log('✓ Channel prepared:', channel\_id);

       console.log('  State object:', JSON.stringify(state, null, 2));

       *// Transform state object to match UnsignedState interface*

       const unsignedInitialState \= {

           intent: state.intent,

           version: BigInt(state.version),

           data: state.state\_data, *// Map state\_data to data*

           allocations: state.allocations.map((a: any) \=\> ({

               destination: a.destination,

               token: a.token,

               amount: BigInt(a.amount),

           })),

       };

       *// Submit to blockchain*

       const createResult \= await client.createChannel({

           channel,

           unsignedInitialState,

           serverSignature: server\_signature,

       });

       *// createChannel returns an object { txHash, ... } or just hash depending on version.*

       *// Based on logs: { channelId: ..., initialState: ..., txHash: ... }*

       *// We need to handle both or just the object.*

       const txHash \= typeof createResult \=== 'string' ? createResult : createResult.txHash;

       console.log('✓ Channel created on-chain:', txHash);

       console.log('  Waiting for transaction confirmation...');

       await publicClient.waitForTransactionReceipt({ hash: txHash });

       console.log('✓ Transaction confirmed');

       *// Retrieve token from allocations*

       const token \= state.allocations\[0\].token;

       await triggerResize(channel\_id, token, false);

   }

   if (response.res && response.res\[1\] \=== 'resize\_channel') {

       const { channel\_id, state, server\_signature } \= response.res\[2\];

       console.log('✓ Resize prepared');

       console.log('  Server returned allocations:', JSON.stringify(state.allocations, null, 2));

       *// Construct the resize state object expected by the SDK*

       const resizeState \= {

           intent: state.intent,

           version: BigInt(state.version),

           data: state.state\_data || state.data, *// Handle potential naming differences*

           allocations: state.allocations.map((a: any) \=\> ({

               destination: a.destination,

               token: a.token,

               amount: BigInt(a.amount),

           })),

           channelId: channel\_id,

           serverSignature: server\_signature,

       };

       console.log('DEBUG: resizeState:', JSON.stringify(resizeState, (key, value) \=\>

           typeof value \=== 'bigint' ? value.toString() : value, 2));

       let proofStates: any\[\] \= \[\];

       try {

           const onChainData \= await client.getChannelData(channel\_id as \`0x${string}\`);

           console.log('DEBUG: On-chain channel data:', JSON.stringify(onChainData, (key, value) \=\>

               typeof value \=== 'bigint' ? value.toString() : value, 2));

           if (onChainData.lastValidState) {

               proofStates \= \[onChainData.lastValidState\];

           }

       } catch (e) {

           console.log('DEBUG: Failed to fetch on-chain data:', e);

       }

       *// Calculate total required for the token*

       const token \= resizeState.allocations\[0\].token;

       const requiredAmount \= resizeState.allocations.reduce((sum: bigint, a: any) \=\> {

           if (a.token \=== token) return sum \+ BigInt(a.amount);

           return sum;

       }, 0n);

       console.log(\`  Waiting for channel funding (Required: ${requiredAmount})...\`);

       *// Poll for User's Custody Balance (since User allocation is increasing)*

       let userBalance \= 0n;

       let retries \= 0;

       const userAddress \= client.account.address;

       console.log(\`  Checking User Custody Balance for ${userAddress}... \[v2\]\`);

       *// Check initial balance first*

       try {

           const result \= await publicClient.readContract({

               address: client.addresses.custody,

               abi: \[

                   {

                       type: 'function',

                       name: 'getAccountsBalances',

                       inputs: \[

                           { name: 'users', type: 'address\[\]' },

                           { name: 'tokens', type: 'address\[\]' }

                       \],

                       outputs: \[{ type: 'uint256\[\]' }\],

                       stateMutability: 'view'

                   }

               \] as const,

               functionName: 'getAccountsBalances',

               args: \[\[userAddress\], \[token as \`0x${string}\`\]\],

           }) as bigint\[\];

           userBalance \= result\[0\];

       } catch (e) {

           console.warn('    Error checking initial user balance:', e);

       }

       console.log('  Skipping L1 deposit (using off-chain faucet funds)...');

       if (true) { *// Skip the wait loop as we just deposited*

           *// Define ABI fragment for getAccountsBalances*

           const custodyAbiFragment \= \[

               {

                   type: 'function',

                   name: 'getAccountsBalances',

                   inputs: \[

                       { name: 'users', type: 'address\[\]' },

                       { name: 'tokens', type: 'address\[\]' }

                   \],

                   outputs: \[{ type: 'uint256\[\]' }\],

                   stateMutability: 'view'

               }

           \] as const;

           while (retries \< 30) { *// Wait up to 60 seconds*

               try {

                   const result \= await publicClient.readContract({

                       address: client.addresses.custody,

                       abi: custodyAbiFragment,

                       functionName: 'getAccountsBalances',

                       args: \[\[userAddress\], \[token as \`0x${string}\`\]\],

                   }) as bigint\[\];

                   userBalance \= result\[0\];

               } catch (e) {

                   console.warn('    Error checking user balance:', e);

               }

               if (userBalance \>= requiredAmount) {

                   console.log(\`✓ User funded in Custody (Balance: ${userBalance})\`);

                   break;

               }

               await new Promise(r \=\> setTimeout(r, 2000));

               retries++;

               if (retries % 5 \=== 0) console.log(\`    User Custody Balance: ${userBalance}, Waiting...\`);

           }

           if (userBalance \< requiredAmount) {

               console.error('Timeout waiting for User to fund Custody account');

               console.warn('Proceeding with resize despite low user balance...');

           }

       } else {

           console.log(\`✓ User funded in Custody (Balance: ${userBalance})\`);

       }

       console.log('  Submitting resize to chain...');

       *// Submit to blockchain*

       const { txHash } \= await client.resizeChannel({

           resizeState,

           proofStates: proofStates,

       });

       console.log('✓ Channel resized on-chain:', txHash);

       console.log('✓ Channel funded with 20 USDC');

       *// Skip Transfer for debugging*

       console.log('  Skipping transfer to verify withdrawal amount...');

       console.log('  Debug: channel\_id \=', channel\_id);

       *// Wait for server to sync state*

       await new Promise(r \=\> setTimeout(r, 3000));

       if (channel\_id) {

           console.log('  Closing channel:', channel\_id);

           const closeMsg \= await createCloseChannelMessage(

               sessionSigner,

               channel\_id as \`0x${string}\`,

               account.address

           );

           ws.send(closeMsg);

       } else {

           console.log('  No channel ID available to close.');

       }

   }

   *// const secondaryAddress \= '0x7df1fef832b57e46de2e1541951289c04b2781aa';*

   *// console.log(\`  Attempting Transfer to Secondary Wallet: ${secondaryAddress}...\`);*

   *// const transferMsg \= await createTransferMessage(*

   *//     sessionSigner,*

   *//     {*

   *//         destination: secondaryAddress,*

   *//         allocations: \[{*

   *//             asset: 'ytest.usd',*

   *//             amount: '10'*

   *//         }\]*

   *//     },*

   *//     Date.now()*

   *// );*

   *// ws.send(transferMsg);*

   *// console.log('  Sent transfer request...');*

   *// if (response.res && response.res\[1\] \=== 'transfer') {*

   *//     console.log('✓ Transfer complete\!');*

   *//     console.log('  Amount: 10 USDC');*

   *//     if (activeChannelId) {*

   *//         console.log('  Closing channel:', activeChannelId);*

   *//         const closeMsg \= await createCloseChannelMessage(*

   *//             sessionSigner,*

   *//             activeChannelId as \`0x${string}\`,*

   *//             account.address*

   *//         );*

   *//         ws.send(closeMsg);*

   *//     } else {*

   *//         console.log('  No active channel ID to close.');*

   *//     }*

   *// }*

   if (response.res && response.res\[1\] \=== 'close\_channel') {

       const { channel\_id, state, server\_signature } \= response.res\[2\];

       console.log('✓ Close prepared');

       console.log('  Submitting close to chain...');

       *// Submit to blockchain*

       const txHash \= await client.closeChannel({

           finalState: {

               intent: state.intent,

               version: BigInt(state.version),

               data: state.state\_data || state.data,

               allocations: state.allocations.map((a: any) \=\> ({

                   destination: a.destination,

                   token: a.token,

                   amount: BigInt(a.amount),

               })),

               channelId: channel\_id,

               serverSignature: server\_signature,

           },

           stateData: state.state\_data || state.data || '0x',

       });

       console.log('✓ Channel closed on-chain:', txHash);

       *// Withdraw funds*

       console.log('  Withdrawing funds...');

       const token \= state.allocations\[0\].token;

       await new Promise(r \=\> setTimeout(r, 2000)); *// Wait for close to settle*

       let withdrawableBalance \= 0n;

       try {

           const result \= await publicClient.readContract({

               address: client.addresses.custody,

               abi: \[{

                   type: 'function',

                   name: 'getAccountsBalances',

                   inputs: \[{ name: 'users', type: 'address\[\]' }, { name: 'tokens', type: 'address\[\]' }\],

                   outputs: \[{ type: 'uint256\[\]' }\],

                   stateMutability: 'view'

               }\] as const,

               functionName: 'getAccountsBalances',

               args: \[\[client.account.address\], \[token as \`0x${string}\`\]\],

           }) as bigint\[\];

           withdrawableBalance \= result\[0\];

           console.log(\`✓ User Custody Balance (Withdrawable): ${withdrawableBalance}\`);

       } catch (e) {

           console.warn('    Error checking withdrawable balance:', e);

       }

       if (withdrawableBalance \> 0n) {

           console.log(\`  Withdrawing ${withdrawableBalance} of ${token}...\`);

           const withdrawalTx \= await client.withdrawal(token as \`0x${string}\`, withdrawableBalance);

           console.log('✓ Funds withdrawn:', withdrawalTx);

       } else {

           console.log('  No funds to withdraw.');

       }

       process.exit(0);

   }

};

*// Start the flow*

if (ws.readyState \=== WebSocket.OPEN) {

   ws.send(authRequestMsg);

} else {

   ws.on('open', () \=\> {

       ws.send(authRequestMsg);

   });

}

### close\_all.ts

Click to view full close\_all.ts

import {

   NitroliteClient,

   WalletStateSigner,

   createECDSAMessageSigner,

   createEIP712AuthMessageSigner,

   createAuthRequestMessage,

   createAuthVerifyMessageFromChallenge,

   createCloseChannelMessage,

} from '@erc7824/nitrolite';

import { createPublicClient, createWalletClient, http } from 'viem';

import { sepolia } from 'viem/chains';

import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

import WebSocket from 'ws';

import 'dotenv/config';

import \* as readline from 'readline';

*// Helper to prompt for input*

const askQuestion \= (query: string): Promise\<string\> \=\> {

   const rl \= readline.createInterface({

       input: process.stdin,

       output: process.stdout,

   });

   return new Promise(resolve \=\> rl.question(query, ans \=\> {

       rl.close();

       resolve(ans);

   }));

};

*// Configuration*

const WS\_URL \= 'wss://clearnet-sandbox.yellow.com/ws';

async function main() {

   console.log('Starting cleanup script...');

   *// Setup Viem Clients*

   let PRIVATE\_KEY \= process.env.PRIVATE\_KEY as \`0x${string}\`;

   if (\!PRIVATE\_KEY) {

       console.log('PRIVATE\_KEY not found in .env');

       const inputKey \= await askQuestion('Please enter your Private Key: ');

       if (\!inputKey) {

           throw new Error('Private Key is required');

       }

       PRIVATE\_KEY \= inputKey.startsWith('0x') ? inputKey as \`0x${string}\` : \`0x${inputKey}\` as \`0x${string}\`;

   }

   const account \= privateKeyToAccount(PRIVATE\_KEY);

   const ALCHEMY\_RPC\_URL \= process.env.ALCHEMY\_RPC\_URL;

   const FALLBACK\_RPC\_URL \= 'https://1rpc.io/sepolia'; *// Public fallback*

   const RPC\_URL \= ALCHEMY\_RPC\_URL || FALLBACK\_RPC\_URL;

   const publicClient \= createPublicClient({

       chain: sepolia,

       transport: http(RPC\_URL),

   });

   const walletClient \= createWalletClient({

       account,

       chain: sepolia,

       transport: http(RPC\_URL),

   });

   *// Initialize Nitrolite Client*

   const client \= new NitroliteClient({

       publicClient,

       walletClient,

       addresses: {

           custody: '0x019B65A265EB3363822f2752141b3dF16131b262',

           adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',

       },

       challengeDuration: 3600n,

       chainId: sepolia.id,

       stateSigner: new WalletStateSigner(walletClient),

   });

   *// Connect to WebSocket*

   const ws \= new WebSocket(WS\_URL);

   const sessionPrivateKey \= generatePrivateKey();

   const sessionSigner \= createECDSAMessageSigner(sessionPrivateKey);

   const sessionAccount \= privateKeyToAccount(sessionPrivateKey);

   await new Promise\<void\>((resolve, reject) \=\> {

       ws.on('open', () \=\> resolve());

       ws.on('error', (err) \=\> reject(err));

   });

   console.log('✓ Connected to WebSocket');

   *// Authenticate*

   const authParams \= {

       session\_key: sessionAccount.address,

       allowances: \[{ asset: 'ytest.usd', amount: '1000000000' }\],

       expires\_at: BigInt(Math.floor(Date.now() / 1000) \+ 3600),

       scope: 'test.app',

   };

   const authRequestMsg \= await createAuthRequestMessage({

       address: account.address,

       application: 'Test app',

       ...authParams

   });

   ws.send(authRequestMsg);

   ws.on('message', async (data) \=\> {

       const response \= JSON.parse(data.toString());

       if (response.res) {

           const type \= response.res\[1\];

           if (type \=== 'auth\_challenge') {

               const challenge \= response.res\[2\].challenge\_message;

               const signer \= createEIP712AuthMessageSigner(walletClient, authParams, { name: 'Test app' });

               const verifyMsg \= await createAuthVerifyMessageFromChallenge(signer, challenge);

               ws.send(verifyMsg);

           }

           if (type \=== 'auth\_verify') {

               console.log('✓ Authenticated');

               *// Fetch open channels from L1 Contract*

               console.log('Fetching open channels from L1...');

               try {

                   const openChannelsL1 \= await client.getOpenChannels();

                   console.log(\`Found ${openChannelsL1.length} open channels on L1.\`);

                   if (openChannelsL1.length \=== 0) {

                       console.log('No open channels on L1 to close.');

                       process.exit(0);

                   }

                   *// Iterate and close*

                   for (const channelId of openChannelsL1) {

                       console.log(\`Attempting to close channel ${channelId}...\`);

                       *// Send close request to Node*

                       const closeMsg \= await createCloseChannelMessage(

                           sessionSigner,

                           channelId,

                           account.address

                       );

                       ws.send(closeMsg);

                       *// Small delay to avoid rate limits*

                       await new Promise(r \=\> setTimeout(r, 500));

                   }

               } catch (e) {

                   console.error('Error fetching L1 channels:', e);

                   process.exit(1);

               }

           }

           if (type \=== 'close\_channel') {

               const { channel\_id, state, server\_signature } \= response.res\[2\];

               console.log(\`✓ Node signed close for ${channel\_id}\`);

               const finalState \= {

                   intent: state.intent,

                   version: BigInt(state.version),

                   data: state.state\_data,

                   allocations: state.allocations.map((a: any) \=\> ({

                       destination: a.destination,

                       token: a.token,

                       amount: BigInt(a.amount),

                   })),

                   channelId: channel\_id,

                   serverSignature: server\_signature,

               };

               try {

                   console.log(\`  Submitting close to L1 for ${channel\_id}...\`);

                   const txHash \= await client.closeChannel({

                       finalState,

                       stateData: finalState.data

                   });

                   console.log(\`✓ Closed on-chain: ${txHash}\`);

               } catch (e) {

                   *// If it fails (e.g. already closed or race condition), just log and continue*

                   console.error(\`Failed to close ${channel\_id} on-chain:\`, e);

               }

           }

           if (response.error) {

               console.error('WS Error:', response.error);

           }

       }

   });

}

main();

# Prerequisites & Environment

In this guide, you will set up a complete development environment for building applications on Yellow Network.

Goal: Have a working local environment ready for Yellow App development.

---

## System Requirements

| Requirement | Minimum | Recommended |
| ----- | ----- | ----- |
| Node.js | 18.x | 20.x or later |
| npm/yarn/pnpm | Latest stable | Latest stable |
| Operating System | macOS, Linux, Windows | macOS, Linux |

---

## Required Knowledge

Before building on Yellow Network, you should be comfortable with:

| Topic | Why It Matters |
| ----- | ----- |
| JavaScript/TypeScript | SDK and examples are in TypeScript |
| Async/await patterns | All network operations are asynchronous |
| Basic Web3 concepts | Wallets, transactions, signatures |
| ERC-20 tokens | Fund management involves token operations |

New to Web3?

If you're new to blockchain development, start with the [Ethereum Developer Documentation](https://ethereum.org/developers) to understand wallets, transactions, and smart contract basics.

---

## Step 1: Install Node.js

### macOS (using Homebrew)

*\# Install Homebrew if you don't have it*  
/bin/bash \-c "$(curl \-fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

*\# Install Node.js*  
brew install node@20

*\# Verify installation*  
node \--version  *\# Should show v20.x.x*  
npm \--version   *\# Should show 10.x.x*

### Linux (Ubuntu/Debian)

*\# Install Node.js via NodeSource*  
curl \-fsSL https://deb.nodesource.com/setup\_20.x | sudo \-E bash \-  
sudo apt-get install \-y nodejs

*\# Verify installation*  
node \--version  
npm \--version

### Windows

Download and run the installer from [nodejs.org](https://nodejs.org/).

---

## Step 2: Install Core Dependencies

Create a new project and install the required packages:

*\# Create project directory*  
mkdir yellow-app && cd yellow-app

*\# Initialize project*  
npm init \-y

*\# Install core dependencies*  
npm install @erc7824/nitrolite viem

*\# Install development dependencies*  
npm install \-D typescript @types/node tsx

### Package Overview

| Package | Purpose |
| ----- | ----- |
| @erc7824/nitrolite | Yellow Network SDK for state channel operations |
| viem | Modern Ethereum library for wallet and contract interactions |
| typescript | Type safety and better developer experience |
| tsx | Run TypeScript files directly |

---

## Step 3: Configure TypeScript

Create tsconfig.json:

{  
 "compilerOptions": {  
   "target": "ES2022",  
   "module": "ESNext",  
   "moduleResolution": "bundler",  
   "strict": true,  
   "esModuleInterop": true,  
   "skipLibCheck": true,  
   "outDir": "./dist",  
   "rootDir": "./src"  
 },  
 "include": \["src/\*\*/\*"\],  
 "exclude": \["node\_modules"\]  
}  
Update package.json:

{  
 "type": "module",  
 "scripts": {  
   "dev": "tsx watch src/index.ts",  
   "build": "tsc",  
   "start": "node dist/index.js"  
 }  
}  
---

## Step 4: Set Up Environment Variables

Create .env for sensitive configuration:

*\# .env \- Never commit this file\!*

*\# Your wallet private key (for development only)*  
PRIVATE\_KEY\=0x...

*\# RPC endpoints*  
SEPOLIA\_RPC\_URL\=https://sepolia.infura.io/v3/YOUR\_KEY  
BASE\_RPC\_URL\=https://base-sepolia.g.alchemy.com/v2/YOUR\_KEY

*\# Clearnode WebSocket endpoint*  
*\# Production: wss://clearnet.yellow.com/ws*  
*\# Sandbox: wss://clearnet-sandbox.yellow.com/ws*  
CLEARNODE\_WS\_URL\=wss://clearnet-sandbox.yellow.com/ws  
Add to .gitignore:

*\# .gitignore*  
.env  
.env.local  
node\_modules/  
dist/  
Install dotenv for loading environment variables:

npm install dotenv  
---

## Step 5: Wallet Setup

### Development Wallet

For development, create a dedicated wallet:

*// scripts/create-wallet.ts*  
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const privateKey \= generatePrivateKey();  
const account \= privateKeyToAccount(privateKey);

console.log('New Development Wallet');  
console.log('----------------------');  
console.log('Address:', account.address);  
console.log('Private Key:', privateKey);  
console.log('\\n⚠️  Save this private key securely and add to .env');  
Run it:

npx tsx scripts/create-wallet.ts

### Get Test Tokens

#### Yellow Network Sandbox Faucet (Recommended)

For testing on the Yellow Network Sandbox, you can request test tokens directly to your unified balance:

curl \-XPOST https://clearnet-sandbox.yellow.com/faucet/requestTokens \\  
 \-H "Content-Type: application/json" \\  
 \-d '{"userAddress":"\<your\_wallet\_address\>"}'  
Replace \<your\_wallet\_address\> with your actual wallet address.

No On-Chain Operations Needed

Test tokens (ytest.USD) are credited directly to your unified balance on the Sandbox Clearnode. No deposit or channel operations are required—you can start transacting immediately\!

#### Testnet Faucets (For On-Chain Testing)

If you need on-chain test tokens for Sepolia or Base Sepolia:

| Network | Faucet |
| ----- | ----- |
| Sepolia | [sepoliafaucet.com](https://sepoliafaucet.com/) |
| Base Sepolia | [base.org/faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet) |

Development Only

Never use your main wallet or real funds for development. Always create a separate development wallet with test tokens.

---

## Step 6: Verify Setup

Create src/index.ts to verify everything works:

import 'dotenv/config';  
import { createPublicClient, http } from 'viem';  
import { sepolia } from 'viem/chains';  
import { privateKeyToAccount } from 'viem/accounts';

async function main() {  
 *// Verify environment variables*  
 const privateKey \= process.env.PRIVATE\_KEY;  
 if (\!privateKey) {  
   throw new Error('PRIVATE\_KEY not set in .env');  
 }

 *// Create account from private key*  
 const account \= privateKeyToAccount(privateKey as \`0x${string}\`);  
 console.log('✓ Wallet loaded:', account.address);

 *// Create public client*  
 const client \= createPublicClient({  
   chain: sepolia,  
   transport: http(process.env.SEPOLIA\_RPC\_URL),  
 });

 *// Check connection*  
 const blockNumber \= await client.getBlockNumber();  
 console.log('✓ Connected to Sepolia, block:', blockNumber);

 *// Check balance*  
 const balance \= await client.getBalance({ address: account.address });  
 console.log('✓ ETH balance:', balance.toString(), 'wei');

 console.log('\\n🎉 Environment setup complete\!');  
}

main().catch(console.error);  
Run the verification:

npm run dev  
Expected output:

✓ Wallet loaded: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb  
✓ Connected to Sepolia, block: 12345678  
✓ ETH balance: 100000000000000000 wei

🎉 Environment setup complete\!  
---

## Project Structure

Recommended folder structure for Yellow Apps:

yellow-app/  
├── src/  
│   ├── index.ts          \# Entry point  
│   ├── config.ts         \# Configuration  
│   ├── client.ts         \# Nitrolite client setup  
│   ├── auth.ts           \# Authentication logic  
│   └── channels/  
│       ├── create.ts     \# Channel creation  
│       ├── transfer.ts   \# Transfer operations  
│       └── close.ts      \# Channel closure  
├── scripts/  
│   └── create-wallet.ts  \# Utility scripts  
├── .env                  \# Environment variables (git-ignored)  
├── .gitignore  
├── package.json  
└── tsconfig.json  
---

## Supported Networks

To get the current list of supported chains and contract addresses, query the Clearnode's get\_config endpoint:

*// Example: Fetch supported chains and contract addresses*  
const ws \= new WebSocket('wss://clearnet-sandbox.yellow.com/ws');

ws.onopen \= () \=\> {  
 const request \= {  
   req: \[1, 'get\_config', {}, Date.now()\],  
   sig: \[\] *// get\_config is a public endpoint, no signature required*  
 };  
 ws.send(JSON.stringify(request));  
};

ws.onmessage \= (event) \=\> {  
 const response \= JSON.parse(event.data);  
 console.log('Supported chains:', response.res\[2\].chains);  
 console.log('Contract addresses:', response.res\[2\].contracts);  
};  
Dynamic Configuration

The get\_config method returns real-time information about supported chains, contract addresses, and Clearnode capabilities. This ensures you always have the most up-to-date network information.

---

## Next Steps

Your environment is ready\! Continue to:

* [Key Terms & Mental Models](https://docs.yellow.org/docs/learn/getting-started/key-terms) — Understand the core concepts  
* [Quickstart](https://docs.yellow.org/docs/learn/getting-started/quickstart) — Build your first Yellow App  
* [State Channels vs L1/L2](https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2) — Deep dive into state channels

---

## Common Issues

### "Module not found" errors

Ensure you have "type": "module" in package.json and are using ESM imports.

### "Cannot find module 'viem'"

Run npm install to ensure all dependencies are installed.

### RPC rate limiting

Use a dedicated RPC provider (Infura, Alchemy) instead of public endpoints for production.

### TypeScript errors with viem

Ensure your tsconfig.json has "moduleResolution": "bundler" or "node16".

# Key Terms & Mental Models

In this guide, you will learn the essential vocabulary and mental models for understanding Yellow Network and state channel technology.

Goal: Build a solid conceptual foundation before diving into implementation.

---

## Core Mental Model: Off-Chain Execution

The fundamental insight behind Yellow Network is simple:

Most interactions don't need immediate on-chain settlement.

Think of it like a bar tab:

| Traditional (L1) | State Channels |
| ----- | ----- |
| Pay for each drink separately | Open a tab, pay once at the end |
| Wait for bartender each time | Instant service, settle later |
| Transaction per item | One transaction for the whole session |

State channels apply this pattern to blockchain: lock funds once, transact off-chain, settle once.

---

## Essential Vocabulary

### State Channel

A state channel is a secure pathway for exchanging cryptographically signed states between participants without touching the blockchain.

Key properties:

* Funds are locked in a smart contract  
* Participants exchange signed state updates off-chain  
* Only opening and closing require on-chain transactions  
* Either party can force on-chain settlement if needed

Analogy: Like a private Venmo between two parties, backed by a bank escrow.

---

### Channel

A Channel is the on-chain representation of a state channel. It defines:

{  
 participants: \['0xAlice', '0xBob'\],   *// Who can participate*  
 adjudicator: '0xContract',            *// Rules for state validation*  
 challenge: 86400,                     *// Dispute window (seconds)*  
 nonce: 1699123456789                  *// Unique identifier*  
}  
The channelId is computed deterministically from these parameters:

channelId \= keccak256(participants, adjudicator, challenge, nonce, chainId)  
---

### State

A State is a snapshot of the channel at a specific moment:

{  
 intent: 'OPERATE',           *// Purpose: INITIALIZE, OPERATE, RESIZE, FINALIZE*  
 version: 5,                  *// Incremental counter (higher \= newer)*  
 data: '0x...',               *// Application-specific data*  
 allocations: \[...\],          *// How funds are distributed*  
 sigs: \['0xSig1', '0xSig2'\]   *// Participant signatures*  
}  
Key rule: A higher version number always supersedes a lower one, regardless of allocations.

---

### Allocation

An Allocation specifies how funds should be distributed:

{  
 destination: '0xAlice',              *// Recipient address*  
 token: '0xUSDC\_CONTRACT',            *// Token contract*  
 amount: 50000000n                    *// Amount in smallest unit (6 decimals for USDC)*  
}  
The sum of allocations represents the total funds in the channel.

---

### Clearnode

A Clearnode is the off-chain service that:

1. Manages the Nitro RPC protocol for state channel operations  
2. Provides unified balance aggregated across multiple chains  
3. Coordinates channels between users  
4. Hosts app sessions for multi-party applications

Think of it as: A game server that acts as your entry point to Yellow Network—centralized for speed, but trustless because of on-chain guarantees.

---

### Unified Balance

Your unified balance is the aggregation of funds across all chains where you have deposits:

Polygon: 50 USDC  ┐  
Base:    30 USDC  ├─→ Unified Balance: 100 USDC  
Arbitrum: 20 USDC ┘  
You can:

* Transfer from unified balance instantly (off-chain)  
* Withdraw to any supported chain  
* Lock funds into app sessions

---

### App Session

An App Session is an off-chain channel built on top of the unified balance for multi-party applications:

{  
 protocol: 'NitroRPC/0.4',  
 participants: \['0xAlice', '0xBob', '0xJudge'\],  
 weights: \[40, 40, 50\],         *// Voting power*  
 quorum: 80,                    *// Required weight for state updates*  
 challenge: 3600,               *// Dispute window*  
 nonce: 1699123456789  
}  
Use cases: Games, prediction markets, escrow, any multi-party coordination.

---

### Session Key

A session key is a temporary cryptographic key that:

* Is generated locally on your device  
* Has limited permissions and spending caps  
* Expires after a specified time  
* Allows gasless signing without wallet prompts

Flow:

1. Generate session keypair locally  
2. Main wallet authorizes the session key (one-time EIP-712 signature)  
3. All subsequent operations use the session key  
4. Session expires or can be revoked

---

## Protocol Components

### Nitrolite

Nitrolite is the on-chain smart contract protocol:

* Defines channel data structures  
* Implements create, close, challenge, resize operations  
* Provides cryptographic verification  
* Currently version 0.5.0

---

### Nitro RPC

Nitro RPC is the off-chain communication protocol:

* Compact JSON array format for efficiency  
* Every message is cryptographically signed  
* Bidirectional real-time communication  
* Currently version 0.4

Message format:

\[requestId, method, params, timestamp\]

*// Example*  
\[42, "transfer", {"destination": "0x...", "amount": "50.0"}, 1699123456789\]  
---

### Custody Contract

The Custody Contract is the main on-chain entry point:

* Locks and unlocks participant funds  
* Tracks channel status (VOID → ACTIVE → FINAL)  
* Validates signatures and state transitions  
* Handles dispute resolution

---

### Adjudicator

An Adjudicator defines rules for valid state transitions:

| Type | Rule |
| ----- | ----- |
| SimpleConsensus | Both participants must sign (default) |
| Remittance | Only sender must sign |
| Custom | Application-specific logic |

---

## State Lifecycle

### Channel States

Channel doesn't exist  
create()  
Off-chain updates  
challenge()  
close()  
checkpoint()  
Timeout  
Deleted  
VOID  
ACTIVE  
DISPUTE  
FINAL

| Status | Meaning |
| ----- | ----- |
| VOID | Channel doesn't exist on-chain |
| INITIAL | Created, waiting for all participants (legacy) |
| ACTIVE | Fully operational, off-chain updates happening |
| DISPUTE | Challenge period active, parties can submit newer states |
| FINAL | Closed, funds distributed, metadata deleted |

---

### State Intents

| Intent | When Used | Purpose |
| ----- | ----- | ----- |
| INITIALIZE | create() | First state when opening channel |
| OPERATE | Off-chain updates | Normal operation, redistribution |
| RESIZE | resize() | Add or remove funds |
| FINALIZE | close() | Final state for cooperative closure |

---

## Security Concepts

### Challenge Period

When a dispute arises:

1. Party A submits their latest state via challenge()  
2. Challenge period starts (typically 24 hours)  
3. Party B can submit a newer valid state via checkpoint()  
4. If no newer state, Party A's state becomes final after timeout

Purpose: Gives honest parties time to respond to incorrect claims.

---

### Signatures

Two contexts for signatures:

| Context | Hash Method | Signed By |
| ----- | ----- | ----- |
| On-chain | Raw packedState (no prefix) | Main wallet |
| Off-chain RPC | JSON payload hash | Session key |

On-chain packedState:

keccak256(abi.encode(channelId, intent, version, data, allocations))  
---

### Quorum

For app sessions, quorum defines the minimum voting weight required for state updates:

Participants: \[Alice, Bob, Judge\]  
Weights:      \[40,    40,   50\]  
Quorum: 80

Valid combinations:  
\- Alice \+ Bob \= 80 ✓  
\- Alice \+ Judge \= 90 ✓  
\- Bob \+ Judge \= 90 ✓  
\- Alice alone \= 40 ✗  
---

## Quick Reference Table

| Term | One-Line Definition |
| ----- | ----- |
| State Channel | Off-chain execution backed by on-chain funds |
| Clearnode | Off-chain service coordinating state channels |
| Unified Balance | Aggregated funds across all chains |
| App Session | Multi-party application channel |
| Session Key | Temporary key with limited permissions |
| Challenge Period | Dispute resolution window |
| Quorum | Minimum signature weight for approval |
| Allocation | Fund distribution specification |
| packedState | Canonical payload for signing |

---

## Next Steps

Now that you understand the vocabulary, continue to:

* [State Channels vs L1/L2](https://docs.yellow.org/docs/learn/core-concepts/state-channels-vs-l1-l2) — Deep comparison with other scaling solutions  
* [App Sessions](https://docs.yellow.org/docs/learn/core-concepts/app-sessions) — Multi-party application patterns  
* [Session Keys](https://docs.yellow.org/docs/learn/core-concepts/session-keys) — Authentication and security

For complete definitions, see the [Glossary](https://docs.yellow.org/docs/protocol/glossary).

# State Channels vs L1/L2

In this guide, you will learn how state channels compare to Layer 1 and Layer 2 solutions, and when each approach is the right choice.

Goal: Understand where state channels fit in the blockchain scaling landscape.

---

## Solution Comparison

| Solution | Throughput | Latency | Cost per Op | Best For |
| ----- | ----- | ----- | ----- | ----- |
| Layer 1 | 15-65K TPS | 1-15 sec | $0.001-$50 | Settlement, contracts |
| Layer 2 | 2,000-4,000 TPS | 1-10 sec | $0.01-$0.50 | General dApps |
| State Channels | Unlimited\* | \< 1 sec | $0 | High-frequency, known parties |

*\*Theoretically unlimited—no consensus bottleneck. Real-world throughput depends on signature generation, network latency, and application logic. Benchmarking documentation coming soon.*

---

## How State Channels Work

State channels operate on a simple principle:

1. Lock funds in a smart contract (on-chain)  
2. Exchange signed states directly between participants (off-chain)  
3. Settle when done or if there's a dispute (on-chain)

The key insight: most interactions between parties don't need immediate on-chain settlement.

---

## State Channel Advantages

### Instant Finality

Unlike L2 solutions that still have block times, state channels provide sub-second finality:

| Solution | Transaction Flow |
| ----- | ----- |
| L1 | Transaction → Mempool → Block → Confirmation |
| L2 | Transaction → Sequencer → L2 Block → L1 Data |
| Channels | Signature → Validation → Done |

### Zero Operational Cost

| Operation | L1 Cost | L2 Cost | State Channel |
| ----- | ----- | ----- | ----- |
| 100 transfers | $500-5000 | $10-50 | $0 |
| 1000 transfers | $5000-50000 | $100-500 | $0 |

### Privacy

Off-chain transactions are only visible to participants. Only opening and final states appear on-chain.

---

## State Channel Limitations

### Known Participants

Channels work between specific participants. Yellow Network addresses this through Clearnodes—off-chain service providers that coordinate channels and provide a unified balance across multiple users and chains.

### Liquidity Requirements

Funds must be locked upfront. You can't spend more than what's locked in the channel.

### Liveness Requirements

Participants must respond to challenges within the challenge period. Users should ensure they can monitor for challenges or use services that provide this functionality.

---

## When to Use Each

| Choose | When |
| ----- | ----- |
| L1 | Deploying contracts, one-time large transfers, final settlement |
| L2 | General dApps, many unknown users, complex smart contracts |
| State Channels | Known parties, real-time speed, high frequency, zero gas needed |

---

## Decision Framework

No  
Yes  
Yes  
No  
Yes  
No  
Transaction  
Known counterparty?  
Use L1/L2  
High frequency?  
Use State Channel  
Large value?  
---

## How Yellow Network Addresses Limitations

| Limitation | Solution |
| ----- | ----- |
| Known participants | Clearnode coordination layer |
| Liquidity | Unified balance across chains |
| Liveness | Always-on Clearnode monitoring |

---

## Key Takeaways

State channels shine when you have identified participants who will interact frequently—like players in a game, counterparties in a trade, or parties in a payment relationship.

State Channel Sweet Spot

* Real-time interactions between known parties  
* High transaction volumes  
* Zero gas costs required  
* Instant finality needed

---

## Deep Dive

For technical details on channel implementation:

* [Architecture](https://docs.yellow.org/docs/protocol/architecture) — System design and fund flows  
* [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle) — State machine and operations  
* [Data Structures](https://docs.yellow.org/docs/protocol/on-chain/data-structures) — Channel and state formats

# App Sessions

App sessions are off-chain channels built on top of the unified balance that enable multi-party applications with custom governance rules.

Goal: Understand how app sessions work for building multi-party applications.

---

## What is an App Session?

An app session is a temporary shared account where multiple participants can:

* Lock funds from their unified balance  
* Execute application-specific logic (games, escrow, predictions)  
* Redistribute funds based on outcomes  
* Close and release funds back to unified balances

Think of it as a programmable escrow with custom voting rules.

---

## App Session vs Payment Channel

| Feature | Payment Channel | App Session |
| ----- | ----- | ----- |
| Participants | Always 2 | 2 or more |
| Governance | Both must sign | Quorum-based |
| Fund source | On-chain deposit | Unified balance |
| Mid-session changes | Via resize (on-chain) | Via intent (off-chain) |
| Use case | Transfers | Applications |

---

## App Session Definition

Every app session starts with a definition that specifies the rules:

| Field | Description |
| ----- | ----- |
| protocol | Version (NitroRPC/0.4 recommended) |
| participants | Wallet addresses (order matters for signatures) |
| weights | Voting power per participant |
| quorum | Minimum weight required for state updates |
| challenge | Dispute window in seconds |
| nonce | Unique identifier (typically timestamp) |

The app\_session\_id is computed deterministically from the definition using keccak256(JSON.stringify(definition)).

---

## Governance with Quorum

The quorum system enables flexible governance patterns.

### How It Works

1. Each participant has a weight (voting power)  
2. State updates require signatures with total weight ≥ quorum  
3. Not everyone needs to sign—just enough to meet quorum

### Common Patterns

| Pattern | Setup | Use Case |
| ----- | ----- | ----- |
| Unanimous | weights: \[50, 50\], quorum: 100 | Both must agree |
| Trusted Judge | weights: \[0, 0, 100\], quorum: 100 | App determines outcome |
| 2-of-3 Escrow | weights: \[40, 40, 50\], quorum: 80 | Any two can proceed |
| Weighted DAO | weights: \[20, 25, 30, 25\], quorum: 51 | Majority by stake |

---

## Session Lifecycle

create\_app\_session  
submit\_app\_state  
close\_app\_session  
Open  
Closed

### 1\. Creation

* Funds locked from participants' unified balances  
* All participants with non-zero allocations must sign  
* Status becomes open, version starts at 1

### 2\. State Updates

* Redistribute funds with submit\_app\_state  
* Version must increment by exactly 1  
* Quorum of signatures required

### 3\. Closure

* Final allocations distributed to unified balances  
* Session becomes closed (cannot reopen)  
* Quorum of signatures required

---

## Intent System (NitroRPC/0.4)

The intent system enables dynamic fund management during active sessions:

| Intent | Purpose | Rule |
| ----- | ----- | ----- |
| OPERATE | Redistribute existing funds | Sum unchanged |
| DEPOSIT | Add funds from unified balance | Sum increases |
| WITHDRAW | Remove funds to unified balance | Sum decreases |

Allocations Are Final State

Allocations always represent the final state, not the delta. The Clearnode computes deltas internally.

---

## Fund Flow

App Session  
Unified Balances  
create (lock)  
create (lock)  
close (release)  
close (release)  
Alice: 200 USDC  
Bob: 200 USDC  
Alice: 100 USDC  
Bob: 100 USDC  
---

## Protocol Versions

| Version | Status | Key Features |
| ----- | ----- | ----- |
| NitroRPC/0.2 | Legacy | Basic state updates only |
| NitroRPC/0.4 | Current | Intent system (OPERATE, DEPOSIT, WITHDRAW) |

Always use NitroRPC/0.4 for new applications. Protocol version is set at creation and cannot be changed.

---

## Best Practices

1. Set appropriate challenge periods: 1 hour minimum, 24 hours recommended  
2. Include commission participants: Apps often have a judge that takes a small fee  
3. Plan for disputes: Design allocations that can be verified by third parties  
4. Version carefully: Each state update must be exactly current \+ 1

---

## Deep Dive

For complete method specifications and implementation details:

* [App Session Methods](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) — Complete method specifications  
* [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows#app-session-lifecycle-flow) — Sequence diagrams  
* [Implementation Checklist](https://docs.yellow.org/docs/protocol/implementation-checklist#state-management) — Building app session support

# Session Keys

Session keys are delegated keys that enable applications to perform operations on behalf of a user's wallet with specified spending limits, permissions, and expiration times. They provide a secure way to grant limited access to applications without exposing the main wallet's private key.

important

Session keys are no longer used as on-chain channel participant addresses for new channels created after the v0.5.0 release. For all new channels, the wallet address is used directly as the participant address. However, session keys still function correctly for channels that were created before v0.5.0, ensuring backward compatibility.

Goal: Understand how session keys enable seamless UX while maintaining security.

---

## Why Session Keys Matter

Every blockchain operation traditionally requires a wallet signature popup. For high-frequency applications like games or trading, this creates terrible UX—imagine 40+ wallet prompts during a chess game.

Session keys solve this by allowing you to sign once, then operate seamlessly for the duration of the session.

---

## Core Concepts

### General Rules

important

When authenticating with an already registered session key, you must still provide all parameters in the auth\_request. However, the configuration values (application, allowances, scope, and expires\_at) from the request will be ignored, as the system uses the settings from the initial registration. You may provide arbitrary values for these fields, as they are required by the request format but will not be used.

### Applications

Each session key is associated with a specific application name, which identifies the application or service that will use the session key. The application name is also used to identify app sessions that are created using that session key.

This association serves several purposes:

* Application Isolation: Different applications get separate session keys, preventing one application from using another's delegated access  
* Access Control: Operations performed with a session key are validated against the application specified during registration  
* Single Active Key: Only one session key can be active per wallet+application combination. Registering a new session key for the same application automatically invalidates any existing session key for that application

important

Only one session key is allowed per wallet+application combination. If you register a new session key for the same application, the old one is automatically invalidated and removed from the database.

#### Special Application: "clearnode"

Session keys registered with the application name "clearnode" receive special treatment:

* Root Access: These session keys bypass spending allowance validation and application restrictions  
* Full Permissions: They can perform any operation the wallet itself could perform  
* Backward Compatibility: This special behavior facilitates migration from older versions  
* Expiration Still Applies: Even with root access, the session key expires according to its expires\_at timestamp

note

The "clearnode" application name is primarily for backward compatibility and will be deprecated after a migration period for developers.

### Expiration

All session keys must have an expiration timestamp (expires\_at) that defines when the session key becomes invalid:

* Future Timestamp Required: The expiration time must be set to a future date when registering a session key  
* Automatic Invalidation: Once the expiration time passes, the session key can no longer be used for any operations  
* No Re-registration: It is not possible to re-register an expired session key. You must create a new session key instead  
* Applies to All Keys: Even "clearnode" application session keys must respect the expiration timestamp

### Allowances

Allowances define spending limits for session keys, specifying which assets the session key can spend and how much:

{  
 "allowances": \[  
   {  
     "asset": "usdc",  
     "amount": "100.0"  
   },  
   {  
     "asset": "eth",  
     "amount": "0.5"  
   }  
 \]  
}

#### Allowance Validation

* Supported Assets Only: All assets specified in allowances must be supported by the system. Unsupported assets cause authentication to fail  
* Usage Tracking: The system tracks spending per session key by recording which session key was used for each ledger debit operation  
* Spending Limits: Once a session key reaches its spending cap for an asset, further operations requiring that asset are rejected with: "operation denied: insufficient session key allowance: X required, Y available"  
* Empty Allowances: Providing an empty allowances array (\[\]) means zero spending allowed for all assets—any operation attempting to spend funds will be rejected

#### Allowances for "clearnode" Application

Session keys with application: "clearnode" are exempt from allowance enforcement:

* No Spending Limits: Allowance checks are bypassed entirely  
* Full Financial Access: These keys can spend any amount of any supported asset  
* Expiration Still Matters: Even without allowance restrictions, the session key still expires according to its expires\_at timestamp

---

## Session Key Lifecycle

auth\_verify success  
Using session key  
expires\_at reached  
Allowance depleted  
Manual revocation  
Re-authenticate  
Re-authenticate  
Re-authenticate  
Unauthenticated  
Authenticated  
Expired  
Exhausted  
Revoked  
---

## Security Model

| Approach | Risk if Compromised | UX Impact |
| ----- | ----- | ----- |
| Main wallet always | Full wallet access | Constant prompts |
| Session key (limited) | Only allowance at risk | Seamless |
| Session key (unlimited) | Unified balance at risk | Seamless but risky |

Session Key Compromise

If a session key is compromised, attackers can only spend up to the configured allowance before expiration. This is why setting appropriate limits is critical.

---

## Best Practices

### For Users

1. Set reasonable allowances: Don't authorize more than you'll use  
2. Use short expirations: 24 hours is usually sufficient  
3. Different keys for different apps: Isolate risk per application  
4. Monitor spending: Use get\_session\_keys to check usage  
5. Revoke when done: Clean up unused sessions

### For Developers

1. Secure storage: Encrypt session keys at rest  
2. Never transmit private keys: Session key stays on device  
3. Handle expiration gracefully: Prompt re-authentication before expiry  
4. Verify Clearnode signatures: Always validate response signatures  
5. Clear on logout: Delete session keys when user logs out

---

## Alternative: Main Wallet as Root Signer

You can skip session keys entirely and sign every request with your main wallet. Use this approach for:

* Single operations  
* High-value transactions  
* Maximum security required  
* Non-interactive applications

---

## Next Steps

* [Managing Session Keys](https://docs.yellow.org/docs/learn/advanced/managing-session-keys) — Create, list, and revoke session keys with full API examples  
* [Authentication Flow](https://docs.yellow.org/docs/protocol/off-chain/authentication) — Full 3-step authentication protocol  
* [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows#authentication-flow) — Sequence diagrams for auth

# State Channels vs L1/L2

In this guide, you will learn how state channels compare to Layer 1 and Layer 2 solutions, and when each approach is the right choice.

Goal: Understand where state channels fit in the blockchain scaling landscape.

---

## Solution Comparison

| Solution | Throughput | Latency | Cost per Op | Best For |
| ----- | ----- | ----- | ----- | ----- |
| Layer 1 | 15-65K TPS | 1-15 sec | $0.001-$50 | Settlement, contracts |
| Layer 2 | 2,000-4,000 TPS | 1-10 sec | $0.01-$0.50 | General dApps |
| State Channels | Unlimited\* | \< 1 sec | $0 | High-frequency, known parties |

*\*Theoretically unlimited—no consensus bottleneck. Real-world throughput depends on signature generation, network latency, and application logic. Benchmarking documentation coming soon.*

---

## How State Channels Work

State channels operate on a simple principle:

1. Lock funds in a smart contract (on-chain)  
2. Exchange signed states directly between participants (off-chain)  
3. Settle when done or if there's a dispute (on-chain)

The key insight: most interactions between parties don't need immediate on-chain settlement.

---

## State Channel Advantages

### Instant Finality

Unlike L2 solutions that still have block times, state channels provide sub-second finality:

| Solution | Transaction Flow |
| ----- | ----- |
| L1 | Transaction → Mempool → Block → Confirmation |
| L2 | Transaction → Sequencer → L2 Block → L1 Data |
| Channels | Signature → Validation → Done |

### Zero Operational Cost

| Operation | L1 Cost | L2 Cost | State Channel |
| ----- | ----- | ----- | ----- |
| 100 transfers | $500-5000 | $10-50 | $0 |
| 1000 transfers | $5000-50000 | $100-500 | $0 |

### Privacy

Off-chain transactions are only visible to participants. Only opening and final states appear on-chain.

---

## State Channel Limitations

### Known Participants

Channels work between specific participants. Yellow Network addresses this through Clearnodes—off-chain service providers that coordinate channels and provide a unified balance across multiple users and chains.

### Liquidity Requirements

Funds must be locked upfront. You can't spend more than what's locked in the channel.

### Liveness Requirements

Participants must respond to challenges within the challenge period. Users should ensure they can monitor for challenges or use services that provide this functionality.

---

## When to Use Each

| Choose | When |
| ----- | ----- |
| L1 | Deploying contracts, one-time large transfers, final settlement |
| L2 | General dApps, many unknown users, complex smart contracts |
| State Channels | Known parties, real-time speed, high frequency, zero gas needed |

---

## Decision Framework

No  
Yes  
Yes  
No  
Yes  
No  
Transaction  
Known counterparty?  
Use L1/L2  
High frequency?  
Use State Channel  
Large value?  
---

## How Yellow Network Addresses Limitations

| Limitation | Solution |
| ----- | ----- |
| Known participants | Clearnode coordination layer |
| Liquidity | Unified balance across chains |
| Liveness | Always-on Clearnode monitoring |

---

## Key Takeaways

State channels shine when you have identified participants who will interact frequently—like players in a game, counterparties in a trade, or parties in a payment relationship.

State Channel Sweet Spot

* Real-time interactions between known parties  
* High transaction volumes  
* Zero gas costs required  
* Instant finality needed

---

## Deep Dive

For technical details on channel implementation:

* [Architecture](https://docs.yellow.org/docs/protocol/architecture) — System design and fund flows  
* [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle) — State machine and operations  
* [Data Structures](https://docs.yellow.org/docs/protocol/on-chain/data-structures) — Channel and state formats

# App Sessions

App sessions are off-chain channels built on top of the unified balance that enable multi-party applications with custom governance rules.

Goal: Understand how app sessions work for building multi-party applications.

---

## What is an App Session?

An app session is a temporary shared account where multiple participants can:

* Lock funds from their unified balance  
* Execute application-specific logic (games, escrow, predictions)  
* Redistribute funds based on outcomes  
* Close and release funds back to unified balances

Think of it as a programmable escrow with custom voting rules.

---

## App Session vs Payment Channel

| Feature | Payment Channel | App Session |
| ----- | ----- | ----- |
| Participants | Always 2 | 2 or more |
| Governance | Both must sign | Quorum-based |
| Fund source | On-chain deposit | Unified balance |
| Mid-session changes | Via resize (on-chain) | Via intent (off-chain) |
| Use case | Transfers | Applications |

---

## App Session Definition

Every app session starts with a definition that specifies the rules:

| Field | Description |
| ----- | ----- |
| protocol | Version (NitroRPC/0.4 recommended) |
| participants | Wallet addresses (order matters for signatures) |
| weights | Voting power per participant |
| quorum | Minimum weight required for state updates |
| challenge | Dispute window in seconds |
| nonce | Unique identifier (typically timestamp) |

The app\_session\_id is computed deterministically from the definition using keccak256(JSON.stringify(definition)).

---

## Governance with Quorum

The quorum system enables flexible governance patterns.

### How It Works

1. Each participant has a weight (voting power)  
2. State updates require signatures with total weight ≥ quorum  
3. Not everyone needs to sign—just enough to meet quorum

### Common Patterns

| Pattern | Setup | Use Case |
| ----- | ----- | ----- |
| Unanimous | weights: \[50, 50\], quorum: 100 | Both must agree |
| Trusted Judge | weights: \[0, 0, 100\], quorum: 100 | App determines outcome |
| 2-of-3 Escrow | weights: \[40, 40, 50\], quorum: 80 | Any two can proceed |
| Weighted DAO | weights: \[20, 25, 30, 25\], quorum: 51 | Majority by stake |

---

## Session Lifecycle

create\_app\_session  
submit\_app\_state  
close\_app\_session  
Open  
Closed

### 1\. Creation

* Funds locked from participants' unified balances  
* All participants with non-zero allocations must sign  
* Status becomes open, version starts at 1

### 2\. State Updates

* Redistribute funds with submit\_app\_state  
* Version must increment by exactly 1  
* Quorum of signatures required

### 3\. Closure

* Final allocations distributed to unified balances  
* Session becomes closed (cannot reopen)  
* Quorum of signatures required

---

## Intent System (NitroRPC/0.4)

The intent system enables dynamic fund management during active sessions:

| Intent | Purpose | Rule |
| ----- | ----- | ----- |
| OPERATE | Redistribute existing funds | Sum unchanged |
| DEPOSIT | Add funds from unified balance | Sum increases |
| WITHDRAW | Remove funds to unified balance | Sum decreases |

Allocations Are Final State

Allocations always represent the final state, not the delta. The Clearnode computes deltas internally.

---

## Fund Flow

App Session  
Unified Balances  
create (lock)  
create (lock)  
close (release)  
close (release)  
Alice: 200 USDC  
Bob: 200 USDC  
Alice: 100 USDC  
Bob: 100 USDC  
---

## Protocol Versions

| Version | Status | Key Features |
| ----- | ----- | ----- |
| NitroRPC/0.2 | Legacy | Basic state updates only |
| NitroRPC/0.4 | Current | Intent system (OPERATE, DEPOSIT, WITHDRAW) |

Always use NitroRPC/0.4 for new applications. Protocol version is set at creation and cannot be changed.

---

## Best Practices

1. Set appropriate challenge periods: 1 hour minimum, 24 hours recommended  
2. Include commission participants: Apps often have a judge that takes a small fee  
3. Plan for disputes: Design allocations that can be verified by third parties  
4. Version carefully: Each state update must be exactly current \+ 1

---

## Deep Dive

For complete method specifications and implementation details:

* [App Session Methods](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) — Complete method specifications  
* [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows#app-session-lifecycle-flow) — Sequence diagrams  
* [Implementation Checklist](https://docs.yellow.org/docs/protocol/implementation-checklist#state-management) — Building app session support

# Session Keys

Session keys are delegated keys that enable applications to perform operations on behalf of a user's wallet with specified spending limits, permissions, and expiration times. They provide a secure way to grant limited access to applications without exposing the main wallet's private key.

important

Session keys are no longer used as on-chain channel participant addresses for new channels created after the v0.5.0 release. For all new channels, the wallet address is used directly as the participant address. However, session keys still function correctly for channels that were created before v0.5.0, ensuring backward compatibility.

Goal: Understand how session keys enable seamless UX while maintaining security.

---

## Why Session Keys Matter

Every blockchain operation traditionally requires a wallet signature popup. For high-frequency applications like games or trading, this creates terrible UX—imagine 40+ wallet prompts during a chess game.

Session keys solve this by allowing you to sign once, then operate seamlessly for the duration of the session.

---

## Core Concepts

### General Rules

important

When authenticating with an already registered session key, you must still provide all parameters in the auth\_request. However, the configuration values (application, allowances, scope, and expires\_at) from the request will be ignored, as the system uses the settings from the initial registration. You may provide arbitrary values for these fields, as they are required by the request format but will not be used.

### Applications

Each session key is associated with a specific application name, which identifies the application or service that will use the session key. The application name is also used to identify app sessions that are created using that session key.

This association serves several purposes:

* Application Isolation: Different applications get separate session keys, preventing one application from using another's delegated access  
* Access Control: Operations performed with a session key are validated against the application specified during registration  
* Single Active Key: Only one session key can be active per wallet+application combination. Registering a new session key for the same application automatically invalidates any existing session key for that application

important

Only one session key is allowed per wallet+application combination. If you register a new session key for the same application, the old one is automatically invalidated and removed from the database.

#### Special Application: "clearnode"

Session keys registered with the application name "clearnode" receive special treatment:

* Root Access: These session keys bypass spending allowance validation and application restrictions  
* Full Permissions: They can perform any operation the wallet itself could perform  
* Backward Compatibility: This special behavior facilitates migration from older versions  
* Expiration Still Applies: Even with root access, the session key expires according to its expires\_at timestamp

note

The "clearnode" application name is primarily for backward compatibility and will be deprecated after a migration period for developers.

### Expiration

All session keys must have an expiration timestamp (expires\_at) that defines when the session key becomes invalid:

* Future Timestamp Required: The expiration time must be set to a future date when registering a session key  
* Automatic Invalidation: Once the expiration time passes, the session key can no longer be used for any operations  
* No Re-registration: It is not possible to re-register an expired session key. You must create a new session key instead  
* Applies to All Keys: Even "clearnode" application session keys must respect the expiration timestamp

### Allowances

Allowances define spending limits for session keys, specifying which assets the session key can spend and how much:

{  
 "allowances": \[  
   {  
     "asset": "usdc",  
     "amount": "100.0"  
   },  
   {  
     "asset": "eth",  
     "amount": "0.5"  
   }  
 \]  
}

#### Allowance Validation

* Supported Assets Only: All assets specified in allowances must be supported by the system. Unsupported assets cause authentication to fail  
* Usage Tracking: The system tracks spending per session key by recording which session key was used for each ledger debit operation  
* Spending Limits: Once a session key reaches its spending cap for an asset, further operations requiring that asset are rejected with: "operation denied: insufficient session key allowance: X required, Y available"  
* Empty Allowances: Providing an empty allowances array (\[\]) means zero spending allowed for all assets—any operation attempting to spend funds will be rejected

#### Allowances for "clearnode" Application

Session keys with application: "clearnode" are exempt from allowance enforcement:

* No Spending Limits: Allowance checks are bypassed entirely  
* Full Financial Access: These keys can spend any amount of any supported asset  
* Expiration Still Matters: Even without allowance restrictions, the session key still expires according to its expires\_at timestamp

---

## Session Key Lifecycle

auth\_verify success  
Using session key  
expires\_at reached  
Allowance depleted  
Manual revocation  
Re-authenticate  
Re-authenticate  
Re-authenticate  
Unauthenticated  
Authenticated  
Expired  
Exhausted  
Revoked  
---

## Security Model

| Approach | Risk if Compromised | UX Impact |
| ----- | ----- | ----- |
| Main wallet always | Full wallet access | Constant prompts |
| Session key (limited) | Only allowance at risk | Seamless |
| Session key (unlimited) | Unified balance at risk | Seamless but risky |

Session Key Compromise

If a session key is compromised, attackers can only spend up to the configured allowance before expiration. This is why setting appropriate limits is critical.

---

## Best Practices

### For Users

1. Set reasonable allowances: Don't authorize more than you'll use  
2. Use short expirations: 24 hours is usually sufficient  
3. Different keys for different apps: Isolate risk per application  
4. Monitor spending: Use get\_session\_keys to check usage  
5. Revoke when done: Clean up unused sessions

### For Developers

1. Secure storage: Encrypt session keys at rest  
2. Never transmit private keys: Session key stays on device  
3. Handle expiration gracefully: Prompt re-authentication before expiry  
4. Verify Clearnode signatures: Always validate response signatures  
5. Clear on logout: Delete session keys when user logs out

---

## Alternative: Main Wallet as Root Signer

You can skip session keys entirely and sign every request with your main wallet. Use this approach for:

* Single operations  
* High-value transactions  
* Maximum security required  
* Non-interactive applications

---

## Next Steps

* [Managing Session Keys](https://docs.yellow.org/docs/learn/advanced/managing-session-keys) — Create, list, and revoke session keys with full API examples  
* [Authentication Flow](https://docs.yellow.org/docs/protocol/off-chain/authentication) — Full 3-step authentication protocol  
* [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows#authentication-flow) — Sequence diagrams for auth

# Challenge-Response & Disputes

In this guide, you will learn how Yellow Network resolves disputes and ensures your funds are always recoverable.

Goal: Understand the security guarantees that make off-chain transactions safe.

---

## Why Challenge-Response Matters

In any off-chain system, a critical question arises: What if someone tries to cheat?

State channels solve this with a challenge-response mechanism:

1. Anyone can submit a state to the blockchain  
2. Counterparties have time to respond with a newer state  
3. The newest valid state always wins  
4. Funds are distributed according to that state

---

## The Trust Model

State channels are trustless because:

| Guarantee | How It's Achieved |
| ----- | ----- |
| Fund custody | Smart contract holds funds, not Clearnode |
| State validity | Only signed states are accepted |
| Dispute resolution | On-chain fallback if disagreement |
| Recovery | You can always get your funds back |

---

## Channel Dispute Flow

### Scenario: Clearnode Becomes Unresponsive

You have a channel with 100 USDC. The Clearnode stops responding.

Your options:

1. Wait for Clearnode to recover  
2. Force settlement on-chain via challenge

### The Process

1. Initiate Challenge: Submit your latest signed state to the blockchain  
2. Challenge Period: Contract sets a timer (e.g., 24 hours)  
3. Response Window: Counterparty can submit a newer state  
4. Resolution: After timeout, challenged state becomes final

challenge()  
checkpoint() with newer state  
Timeout expires  
ACTIVE  
DISPUTE  
FINAL  
Anyone can submit  
newer valid state  
---

## Why This Works

### States Are Ordered

Every state has a version number. A newer (higher version) state always supersedes older states.

### States Are Signed

With the default SimpleConsensus adjudicator, both parties must sign every state. If someone signed a state, they can't later claim they didn't agree.

Other Adjudicators

Different adjudicators may have different signing requirements. For example, a Remittance adjudicator may only require the sender's signature. The signing rules are defined by the channel's adjudicator contract.

### Challenge Period Provides Fairness

The waiting window ensures honest parties have time to respond. Network delays don't cause losses.

### On-Chain Contract is Neutral

The smart contract accepts any valid signed state, picks the highest version, and distributes funds exactly as specified.

---

## Challenge Period Selection

| Duration | Trade-offs |
| ----- | ----- |
| 1 hour | Fast resolution, tight response window |
| 24 hours | Balanced (recommended) |
| 7 days | Maximum safety, slow settlement |

The Custody Contract enforces a minimum of 1 hour.

---

## Checkpoint vs Challenge

| Operation | Purpose | Channel Status |
| ----- | ----- | ----- |
| checkpoint() | Record state without dispute | Stays ACTIVE |
| challenge() | Force dispute resolution | Changes to DISPUTE |

Use checkpoint for safety snapshots. Use challenge when you need to force settlement.

---

## What Happens If...

| Scenario | Outcome |
| ----- | ----- |
| Clearnode goes offline | Challenge with latest state, withdraw after timeout |
| You lose state history | Challenge with old state; counterparty submits newer if they have it |
| Counterparty submits wrong state | Submit your newer state via checkpoint |
| Block reorg occurs | Replay events from last confirmed block |

---

## Key Takeaways

| Concept | Remember |
| ----- | ----- |
| Challenge | Force on-chain dispute resolution |
| Response | Submit newer state to defeat challenge |
| Timeout | After period, challenged state becomes final |
| Checkpoint | Record state without dispute |

Security Guarantee

You can always recover your funds according to the latest mutually signed state, regardless of counterparty behavior.

---

## Deep Dive

For technical implementation details:

* [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle) — Full state machine  
* [Security Considerations](https://docs.yellow.org/docs/protocol/on-chain/security) — Threat model and best practices  
* [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows#challenge-response-closure-flow) — Sequence diagrams

# Message Envelope (RPC Protocol)

In this guide, you will learn the essentials of how messages are structured and transmitted in Yellow Network.

Goal: Understand the Nitro RPC protocol at a conceptual level.

---

## Protocol Overview

Nitro RPC is a lightweight RPC protocol optimized for state channel communication:

| Feature | Benefit |
| ----- | ----- |
| Compact format | \~30% smaller than traditional JSON-RPC |
| Signature-based auth | Every message is cryptographically verified |
| Bidirectional | Real-time updates via WebSocket |
| Ordered timestamps | Replay attack prevention |

---

## Message Structure

Every Nitro RPC message uses a compact JSON array format:

| Component | Type | Description |
| ----- | ----- | ----- |
| requestId | uint64 | Unique identifier for correlation |
| method | string | RPC method name (snake\_case) |
| params/result | object | Method-specific data |
| timestamp | uint64 | Unix milliseconds |

### Request Wrapper

{ "req": \[requestId, method, params, timestamp\], "sig": \[...\] }

### Response Wrapper

{ "res": \[requestId, method, result, timestamp\], "sig": \[...\] }

### Error Response

{ "res": \[requestId, "error", { "error": "description" }, timestamp\], "sig": \[...\] }  
---

## Signature Format

Each signature is a 65-byte ECDSA signature (r \+ s \+ v) represented as a 0x-prefixed hex string.

| Context | What's Signed | Who Signs |
| ----- | ----- | ----- |
| Requests | JSON payload hash | Session key (or main wallet) |
| Responses | JSON payload hash | Clearnode |

---

## Method Categories

| Category | Methods |
| ----- | ----- |
| Auth | auth\_request, auth\_verify |
| Channels | create\_channel, close\_channel, resize\_channel |
| Transfers | transfer |
| App Sessions | create\_app\_session, submit\_app\_state, close\_app\_session |
| Queries | get\_ledger\_balances, get\_channels, get\_app\_sessions, etc. |

---

## Notifications

The Clearnode pushes real-time updates:

| Notification | When Sent |
| ----- | ----- |
| bu (balance update) | Balance changed |
| cu (channel update) | Channel status changed |
| tr (transfer) | Incoming/outgoing transfer |
| asu (app session update) | App session state changed |

---

## Communication Flow

ClearnodeClientClearnodeClientRequest (signed)Verify signatureProcessResponse (signed)Verify signatureNotification (async)  
---

## Protocol Versions

| Version | Status | Key Features |
| ----- | ----- | ----- |
| NitroRPC/0.2 | Legacy | Basic state updates |
| NitroRPC/0.4 | Current | Intent system, enhanced validation |

Always use NitroRPC/0.4 for new implementations.

---

## Key Points

1. Compact arrays instead of verbose JSON objects  
2. Every message signed for authenticity  
3. Timestamps prevent replay attacks  
4. Bidirectional WebSocket for real-time updates

---

## Deep Dive

For complete technical specifications:

* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) — Full format specification  
* [Off-Chain Overview](https://docs.yellow.org/docs/protocol/off-chain/overview) — Protocol architecture  
* [Implementation Checklist](https://docs.yellow.org/docs/protocol/implementation-checklist#off-chain-rpc) — Building RPC support

# Managing Session Keys

This guide covers the operational details of creating, listing, and revoking session keys via the Clearnode API.

Prerequisites

Before diving into session key management, make sure you understand the core concepts: what session keys are, how applications and allowances work, and the expiration rules. See [Session Keys](https://docs.yellow.org/docs/learn/core-concepts/session-keys) for the conceptual foundation.

---

## How to Manage Session Keys

### Clearnode

#### Create and Configure

To create a session key, use the auth\_request method during authentication. This registers the session key with its configuration:

Request:

{  
 "req": \[  
   1,  
   "auth\_request",  
   {  
     "address": "0x1234567890abcdef...",  
     "session\_key": "0x9876543210fedcba...",  
     "application": "Chess Game",  
     "allowances": \[  
       {  
         "asset": "usdc",  
         "amount": "100.0"  
       },  
       {  
         "asset": "eth",  
         "amount": "0.5"  
       }  
     \],  
     "scope": "app.create",  
     "expires\_at": 1762417328  
   },  
   1619123456789  
 \],  
 "sig": \["0x5432abcdef..."\]  
}  
Parameters:

* address (required): The wallet address that owns this session key  
* session\_key (required): The address of the session key to register  
* application (optional): Name of the application using this session key (defaults to "clearnode" if not provided)  
* allowances (optional): Array of asset allowances specifying spending limits  
* scope (optional): Permission scope (e.g., "app.create", "ledger.readonly"). Note: This feature is not yet implemented  
* expires\_at (required): Unix timestamp (in seconds) when this session key expires

note

When authenticating with an already registered session key, you must still fill in all fields in the request, at least with arbitrary values. This is required by the request itself, however, the values will be ignored as the system uses the session key configuration stored during initial registration. This behavior will be improved in future versions.

#### List Active Session Keys

Use the get\_session\_keys method to retrieve all active (non-expired) session keys for the authenticated user:

Request:

{  
 "req": \[1, "get\_session\_keys", {}, 1619123456789\],  
 "sig": \["0x9876fedcba..."\]  
}  
Response:

{  
 "res": \[  
   1,  
   "get\_session\_keys",  
   {  
     "session\_keys": \[  
       {  
         "id": 1,  
         "session\_key": "0xabcdef1234567890...",  
         "application": "Chess Game",  
         "allowances": \[  
           {  
             "asset": "usdc",  
             "allowance": "100.0",  
             "used": "45.0"  
           },  
           {  
             "asset": "eth",  
             "allowance": "0.5",  
             "used": "0.0"  
           }  
         \],  
         "scope": "app.create",  
         "expires\_at": "2024-12-31T23:59:59Z",  
         "created\_at": "2024-01-01T00:00:00Z"  
       }  
     \]  
   },  
   1619123456789  
 \],  
 "sig": \["0xabcd1234..."\]  
}  
Response Fields:

* id: Unique identifier for the session key record  
* session\_key: The address of the session key  
* application: Application name this session key is authorized for  
* allowances: Array of allowances with usage tracking:  
  * asset: Symbol of the asset (e.g., "usdc", "eth")  
  * allowance: Maximum amount the session key can spend  
  * used: Amount already spent by this session key  
* scope: Permission scope (omitted if empty)  
* expires\_at: When this session key expires (ISO 8601 format)  
* created\_at: When the session key was created (ISO 8601 format)

#### Revoke a Session Key

To immediately invalidate a session key, use the revoke\_session\_key method:

Request:

{  
 "req": \[  
   1,  
   "revoke\_session\_key",  
   {  
     "session\_key": "0xabcdef1234567890..."  
   },  
   1619123456789  
 \],  
 "sig": \["0x9876fedcba..."\]  
}  
Response:

{  
 "res": \[  
   1,  
   "revoke\_session\_key",  
   {  
     "session\_key": "0xabcdef1234567890..."  
   },  
   1619123456789  
 \],  
 "sig": \["0xabcd1234..."\]  
}  
Permission Rules:

* A wallet can revoke any of its session keys  
* A session key can revoke itself  
* A session key with application: "clearnode" can revoke other session keys belonging to the same wallet  
* A non-"clearnode" session key cannot revoke other session keys (only itself)

Important Notes:

* Revocation is immediate and cannot be undone  
* After revocation, any operations attempted with the revoked session key will fail with a validation error  
* The revoked session key will no longer appear in the get\_session\_keys response  
* Revocation is useful for security purposes when a session key may have been compromised

Error Cases:

* Session key does not exist, belongs to another wallet, or is expired: "operation denied: provided address is not an active session key of this user"  
* Non-"clearnode" session key attempting to revoke another session key: "operation denied: insufficient permissions for the active session key"

### Nitrolite SDK

The Nitrolite SDK provides a higher-level abstraction for managing session keys. For detailed information on using session keys with the Nitrolite SDK, please refer to the SDK documentation.  
