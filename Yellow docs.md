# Introduction

## What is Nitrolite?

Nitrolite is a state channel protocol that enables off-chain interactions between participants with minimal on-chain operations. The protocol forms a unified virtual ledger (called "clearnet") for applications to escrow funds while being fully abstracted from the underlying blockchain.

The initial version of Nitrolite is EVM-compatible and designed for deployment on Layer 1 and Layer 2 Ethereum networks.

## Design Goals

Nitrolite is designed with the following objectives:

* Scalability: Move high-frequency operations off-chain  
* Cost Efficiency: Minimize gas fees by reducing on-chain transactions  
* Security: Maintain blockchain-level security guarantees  
* Interoperability: Support multiple blockchains and assets  
* Developer Experience: Provide clear, implementable specifications

## Protocol Layers

Nitrolite consists of three interconnected layers:

1. On-Chain Layer: Smart contracts that handle fund custody, dispute resolution, and final settlement  
2. Off-Chain Layer: RPC protocol for fast, gasless state updates between participants  
3. Application Layer: Arbitrary application logic built on top of the protocol

Application Layer  
Off-Chain RPC Layer  
On-Chain Smart Contract Layer  
Blockchain

## Specification Scope

This document defines the Nitrolite protocol in a programming language-agnostic manner. Implementers can use these specifications to build compliant implementations in any language (Go, Python, Rust, JavaScript, etc.).

Language Independence

Implementation-specific details are referenced but not mandated by this specification. The protocol description is abstract and can be implemented in any programming language.

## RFC 2119 Keywords

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119\.

# Terminology

## Core Concepts

Channel: A secure communication pathway between participants that locks funds in an on-chain smart contract while enabling off-chain state updates.

State: A snapshot of the channel at any point in time, including fund allocations and application-specific data.

Participant: An entity (identified by a wallet address) that is part of a channel.

Clearnode: A server implementing a virtual ledger layer that provides a unified ledger (through Nitro RPC), coordinates state channels (through Nitrolite), and enables chain abstraction for developers and users

Creator: The participant at index 0 in a channel who initiates channel creation.

App Sessions: Off-chain channels built on top of payment channels, intended to be used by app developers to enable application-specific interactions and transactions without touching the blockchain.

Unified Balance: An abstraction that aggregates users' funds across multiple blockchain networks, managed by a clearnode.

Session Key: A temporary cryptographic key delegated by a user's main wallet that provides a flexible way for the user to manage security of their funds by giving specific permissions and allowances for specific apps.

## Identifiers

channelId: A unique identifier for a channel, computed as the hash of the channel configuration, formatted as a 0x-prefixed hex string (32 bytes).

packedState: A specific encoding of a channelId, state.intent, state.version, state.data, state.allocations, used for signing and signature verification.

requestId: A unique identifier for an RPC request, used for correlating requests and responses formatted as a 0x-prefixed hex string (32 bytes).

appSessionId: A unique identifier for an app session, formatted as a 0x-prefixed hex string (32 bytes). Used for all subsequent operations on that specific app session.

accountId: An identifier for an account or app session within the unified ledger. Can be either a 0x-prefixed hex string or a wallet address.

chainId: A blockchain network identifier (uint64). Examples: 1 (Ethereum Mainnet), 137 (Polygon), 8453 (Base), 42161 (Arbitrum One), 10 (Optimism).

assetSymbol: A lowercase string identifier for a supported asset. Asset symbols are consistent across chains.

walletAddress: A user's blockchain address (0x-prefixed hex string, 20 bytes) that identifies their account and owns funds. Used to identify participants in channels and app sessions.

userId: Identifies a user after authentication to the Clearnode. Currently, this is always equivalent to the user's walletAddress.

## On-Chain Contracts

Custody Contract: The main on-chain contract implementing the Nitrolite protocol. It provides the functionality to lock and unlock funds; create, close and challenge a channel; track channel state, and coordinate with adjudicators to validate state transitions on state updates.

Adjudicator: A smart contract that defines the rules for validating state transitions during all channel lifecycle operations. The adjudicator's adjudicate(...) function is called by the Custody contract to verify whether a new state is valid based on previous states and application-specific logic. Examples include SimpleConsensus (requires both signatures) and Remittance (only sender must sign).

## Protocol Components

Nitrolite: The on-chain smart contract protocol.

Nitro RPC: The off-chain communication protocol.

Quick Reference

These terms are used throughout the protocol specification. Bookmark this page for easy reference while reading other sections.

# Architecture

## System Overview

The Nitrolite protocol architecture consists of multiple layers working together to enable scalable, secure state channel operations:

Blockchain Layer  
On-Chain Layer  
(Smart Contracts)  
Client SDK  
Off-Chain Layer  
(Fast Updates)  
Application Layer  
Communicate via RPC using NitroRPC protocol  
Operate on-chain state channels  
Observe events  
Chess, DEX, Gaming, Payments, Custom Logic  
Clearnode  
Client SDK  
Custody, Adjudicator contracts  
Ethereum, Polygon, etc.

## Communication Patterns

### On-Chain Channel Opening

The channel opening process follows a coordinated sequence between client and a clearnode:

1. Client requests channel creation from a clearnode via Nitro RPC  
2. The clearnode returns a channel struct and signed initial state (signature at index 1\)  
3. Client signs the initial state (signature at index 0\)  
4. Client calls the create(...) method of the Custody Smart Contract on the blockchain, providing the channel and initial state with both signatures  
5. Contract verifies signatures and emits Opened event  
6. Channel becomes ACTIVE immediately  
7. The clearnode monitors the Opened event and updates its internal state

BlockchainClearnodeClientBlockchainClearnodeClientcreate\_channel requestchannel struct \+ signed initial state (clearnode signature)Add own signaturecreate() with BOTH signaturesVerify signaturesSet status \= ACTIVEEmit Opened eventOpened event (monitored)channel\_update notification  
Cooperative Opening

Channel opening requires cooperation between both parties, ensuring mutual agreement before funds are locked.

### Off-Chain Updates

Off-Chain Updates:

1. Participants exchange signed state updates:  
   * For Payment Channels (User ↔ Clearnode): States are exchanged directly via Nitro RPC  
   * For App Sessions (Multi-party): State exchange is managed by the App itself (peer-to-peer). Once the state has enough signatures to satisfy quorum, a responsible party submits the signed state to the Clearnode  
2. No blockchain transactions required  
3. Latest valid state maintained off-chain  
4. Can be checkpointed on-chain at any time  
   * *Current Implementation Note*: While this is the ideal design goal, the current implementation does not store the state off-chain, so checkpointing is not currently supported. This functionality is under development and will be more enforced in the next version of the protocol.

Zero Gas Fees

Off-chain updates are instant (\< 1 second) and incur zero gas fees, enabling high-frequency operations.

### On-Chain Channel Closing

Channels can be closed in two ways:

Cooperative Closure:

1. All participants negotiate and agree on the final state  
2. Each participant signs the final state with intent \= FINALIZE  
3. Any participant submits the fully-signed final state to the Custody Contract via close()  
4. Contract verifies all signatures and distributes funds according to final allocations  
5. Channel status becomes FINAL

This is the preferred closure method. It requires only 1 transaction and is gas-efficient.

Non-Cooperative Closure:

1. A participant submits the latest known state to the Custody Contract via challenge()  
2. Contract verifies signatures and sets channel status to DISPUTE  
3. A challenge period begins (e.g., 24 hours), allowing the other party to respond  
4. If participants decides to cooperate again, they may produce a newer valid state, and any of them can submit it via checkpoint(), thus stopping the challenge period and moving the channel from DISPUTE back to ACTIVE status  
5. If not, after the challenge period expires, any participant calls close() to finalize with the latest submitted state  
6. Contract distributes funds according to the final state allocations

This mechanism resolves disputes when parties cannot cooperate. It requires a waiting period for security and is more expensive due to multiple transactions.

Yes  
No  
Active Channel  
Parties Agree?  
Cooperative Close  
Fast, Cheap  
Challenge-Response  
Slow, Secure

## Fund Flow

The following diagram illustrates how funds flow through the Nitrolite protocol:

deposit  
resize  
resize  
resize  
open/deposit  
withdraw / close session  
resize / close channel  
withdraw  
User Wallet  
(ERC-20)  
Available  
(Custody SC)  
Unified Balance  
(Clearnode)  
Channel-Locked  
(Custody SC)  
App Sessions  
(Application)  
Flow Explanation:

1. Deposit: User deposits ERC-20 tokens into the Available balance of the Custody Contract.  
2. Resize: Funds can be moved between Available balance and Unified Balance (managed off-chain by the clearnode).  
3. Channel Lock: Funds can also be moved between Available balance and Channel-Locked balance via resize operations, or between Channel-Locked and Unified Balance.  
4. App Sessions: Funds from the Unified Balance can be allocated to App Sessions.  
5. Release: When app sessions close or funds are withdrawn, they return to the Unified Balance.  
6. Unlock/Withdraw: Funds can be moved back to Available balance (via resize/close) and then withdrawn to the User Wallet.

Security Guarantee

At every stage, funds remain cryptographically secured. Users can always recover their funds according to the latest valid signed state, even if the clearnode becomes unresponsive.

# On-Chain Protocol Overview

The on-chain protocol defines the smart contract interfaces and data structures that form the foundation of Nitrolite's security guarantees. This layer operates on the blockchain and handles:

* Fund Custody: Secure locking and unlocking of participant assets  
* Dispute Resolution: Challenge-response mechanism for disagreements  
* Final Settlement: Distribution of funds according to validated states  
* Channel Lifecycle: State transitions from creation to closure

## Key Responsibilities

The on-chain layer MUST provide:

1. Deterministic channel identifiers computed from channel configuration  
2. Signature verification to authenticate state updates  
3. State validation through adjudicator contracts  
4. Challenge periods to ensure fair dispute resolution  
5. Fund safety guaranteeing users can always recover their assets

EVM Compatibility

The initial version of Nitrolite is designed for EVM-compatible blockchains including Ethereum, Polygon, Base, and other EVM chains. Support for additional networks is continuously expanding.

## Contract Interfaces

The protocol defines three primary contract interfaces:

* IChannel: Core channel lifecycle operations (create, join, challenge, close)  
* IDeposit: Token deposit and withdrawal management  
* IChannelReader: Read-only queries for channel state and status

These interfaces are implemented by the Custody Contract, which serves as the main entry point for on-chain operations.

## Next Steps

The following sections detail:

* [Data Structures](https://docs.yellow.org/docs/protocol/on-chain/data-structures): Core types and identifier computation  
* [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle): Complete state machine and operations  
* [Security Considerations](https://docs.yellow.org/docs/protocol/on-chain/security): Threat model and best practices

# Data Structures

## Channel

Represents the configuration of a state channel.

struct Channel {  
   address\[\] participants;  // List of participants in the channel  
   address adjudicator;     // Contract that validates state transitions  
   uint64 challenge;        // Duration in seconds for dispute resolution  
   uint64 nonce;           // Unique identifier for the channel  
}  
Fields:

* participants: An ordered array of participant addresses. Index 0 is typically the Creator, index 1 is the clearnode.  
* adjudicator: Address of the adjudicator contract responsible for validating state transitions.  
* challenge: Challenge period duration in seconds. Determines a time window when a challenge can be resolved by a counterparty. Otherwise, a channel is considered closed and funds can be withdrawn.  
* nonce: A unique number that, combined with other fields, creates a unique channel identifier.

Participant versus Caller Address

The first participant address is usually different from the caller (EOA or contract), thus enabling channel operation delegation. This can be fruitful as users can fund channels for other ones.

## State

Represents a snapshot of channel state at a point in time.

struct State {  
   StateIntent intent;       // Intent of the state (INITIALIZE, OPERATE, RESIZE, FINALIZE)  
   uint256 version;          // State version incremental number to compare most recent  
   bytes data;               // Application-specific data  
   Allocation\[\] allocations; // Asset allocation for each participant  
   bytes\[\] sigs;             // Participant signatures authorizing the packed state payload  
}  
Fields:

* intent: The intent of this state, indicating its purpose (see StateIntent enum).  
* version: Incremental version number used to compare and validate state freshness. Higher versions supersede lower versions.  
* data: Application-specific data which adjudicators can operate on. For a resize(...) state must contain allocationDeltas. For more information, please check the [resize operation docs](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle#resize-protocol).  
* allocations: Array of allocations defining how funds are distributed.  
* sigs: Array of participant signatures over the canonical packed state payload. Order corresponds to the Channel's participants array.

## Allocation

Specifies how a particular amount of a token should be allocated.

struct Allocation {  
   address destination;  // Recipient of funds  
   address token;        // ERC-20 token address  
   uint256 amount;       // Token amount in smallest unit  
}  
Fields:

* destination: Address that will receive the funds when channel closes.  
* token: Contract address of the ERC-20 token (or zero address for native currency).  
* amount: Amount in the token's smallest unit (wei for ETH, considering decimals for ERC-20).

## Signatures

Signatures in Nitrolite are stored as raw bytes so the protocol can validate multiple scheme formats.

struct Signature {  
   uint8 v;      // Recovery identifier  
   bytes32 r;    // First 32 bytes of signature  
   bytes32 s;    // Second 32 bytes of signature  
}  
At a minimum Nitrolite currently recognizes the following signature families (see the [Signature Formats](https://docs.yellow.org/docs/protocol/on-chain/signature-formats) reference for the full specification):

* Raw/Pre-EIP-191 ECDSA – Signs keccak256(packedState) without any prefix.  
* EIP-191 (version 0x45) – Signs a structured message that prefixes the packed state with the Ethereum signed message header and length.  
* EIP-712 Typed Data – Signs keccak256(abi.encode(domainSeparator, hashStruct(state))).  
* EIP-1271 Smart-Contract Signatures – Arbitrary bytes validated via isValidSignature on the signer contract.  
* EIP-6492 Counterfactual Signatures – Wraps deployment data to prove a not-yet-deployed ERC-4337 wallet authorized the state.

Refer to the dedicated page for verification order, payload layouts, and implementation guidance.

## Amount

Represents a quantity of a specific token.

struct Amount {  
   address token;    // ERC-20 token address  
   uint256 amount;   // Token amount  
}

## Channel Status

Enum representing the lifecycle stage of a channel.

enum Status {  
   VOID,      // Channel does not exist  
   INITIAL,   // Creation in progress, awaiting all participants  
   ACTIVE,    // Fully funded and operational  
   DISPUTE,   // Challenge period active  
   FINAL      // Ready to be closed and deleted  
}

## Protocol Constants

### Participant Indices

constant uint256 CLIENT\_IDX \= 0;   // Client/Creator participant index  
constant uint256 SERVER\_IDX \= 1;   // Server/Clearnode participant index  
constant uint256 PART\_NUM \= 2;     // Number of participants (always 2\)

### Challenge Period

uint256 public constant MIN\_CHALLENGE\_PERIOD \= 1 hours;  
The minimum challenge period enforced by the Custody Contract. Channel configurations must specify a challenge period of at least 1 hour.

### EIP-712 Type Hashes

The protocol uses EIP-712 structured data signing with the following domain parameters:

// EIP-712 Domain  
name: "Nitrolite:Custody"  
version: "0.3.0"  
Type hashes for state validation:

// State hash computation for signatures  
bytes32 constant STATE\_TYPEHASH \= keccak256(  
   "AllowStateHash(bytes32 channelId,uint8 intent,uint256 version,bytes data,Allocation\[\] allocations)Allocation(address destination,address token,uint256 amount)"  
);

// Challenge state hash computation  
bytes32 public constant CHALLENGE\_STATE\_TYPEHASH \= keccak256(  
   "AllowChallengeStateHash(bytes32 channelId,uint8 intent,uint256 version,bytes data,Allocation\[\] allocations)Allocation(address destination,address token,uint256 amount)"  
);  
These type hashes enable human-readable signature prompts in wallets and improve security by preventing signature replay attacks across different contexts.

## Identifier Computation

### Channel Identifier

The channelId MUST be computed as:

channelId \= keccak256(  
   abi.encode(  
       channel.participants,  
       channel.adjudicator,  
       channel.challenge,  
       channel.nonce,  
       chainId  
   )  
)  
This creates a deterministic, unique identifier for each channel.

App Session Identifiers

App sessions use a different computation: keccak256(JSON.stringify(definition)) where definition includes the app configuration but not chainId, since sessions are entirely off-chain. See [Off-chain › App Sessions › Session Identifier](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#session-identifier) for details.

Deterministic IDs

Channel IDs are deterministically computed from the channel configuration, ensuring the same configuration always produces the same identifier.

### Packed State

The legacy state hash concept was removed in v0.3.0 when non-ECDSA signatures were introduced. Instead, participants use the packed state payload for signing:

packedState \= abi.encode(  
   channelId,  
   state.intent,  
   state.version,  
   state.data,  
   state.allocations  
)  
The packed state is simply abi.encode(channelId, state.intent, state.version, state.data, state.allocations). This byte array is fed into the selected signing scheme (EIP-712 hashing, ERC-1271 contract checks, NO\_EIP712 fallback, etc.). Each scheme may wrap or hash packedState as needed, but the canonical payload MUST be the input.

Signature Verification

All state updates MUST be verified by checking signatures against the canonical packedState payload (after the signing method applies its required hashing/wrapping) before accepting them on-chain.

# Channel Lifecycle

## State Transitions Overview

The lifecycle of a channel moves through well-defined states depending on how participants interact with the custody contract.

create()  
create() (sigs from all participants)  
join() (all participants)  
checkpoint()  
challenge()  
close() (cooperative)  
checkpoint() (newer state)  
challenge period expires  
VOID  
INITIAL  
ACTIVE  
DISPUTE  
FINAL  
Operational state  
Off-chain updates occur here  
Challenge period active  
Parties can submit newer states  
Use the sections below for details on each phase.

## Creation Phase

Purpose: Initiate a new channel with specified participants and initial funding.

Process:

1. The Creator:  
   * Constructs a Channel configuration with participants, adjudicator, challenge period, and nonce  
   * Prepares an initial State with application-specific app data  
   * Defines expected token deposits for all participants in state.allocations  
   * Signs the computed packedState of this initial state  
   * Includes Creator's signature in state.sigs at position 0  
   * Calls either create(...) or depositAndCreate(...) function with the channel configuration and initial signed state

Implicit Join (Immediate Activation)

If the Creator obtains the second participant's signature on the initial state before calling create(), they can supply both signatures in state.sigs (positions 0 and 1). When the contract detects sigs.length \== 2:

* It verifies both signatures  
* Locks funds from both participants  
* Transitions directly to ACTIVE status (skipping INITIAL)  
* Emits both Joined and Opened events

This "implicit join" is the recommended approach for faster channel activation and reduced gas costs (single transaction instead of two).

2. The contract:  
   * Verifies the Creator's signature on the funding packedState  
   * Verifies Creator has sufficient balance to fund their allocation  
   * Locks the Creator's funds according to the allocation  
   * Sets the channel status to INITIAL  
   * Emits a Created event with channelId, channel configuration, and expected deposits

ContractCreatorContractCreatorStatus \= VOIDStatus \= INITIALConstruct Channel configCreate initial StateSign packedStatecreate(channel, state)Verify signatureLock Creator fundsSet status to INITIALEmit Created event  
Participant versus Caller address

The first participant address is usually different from the caller (EOA or contract), thus enabling channel operation delegation. This can be fruitful as users can fund channels for other ones.

## Joining Phase

Two Channel Opening Flows

There are two ways to open a channel:

1. Modern/Recommended: Provide ALL signatures in create() → channel immediately ACTIVE (see [Architecture](https://docs.yellow.org/docs/protocol/architecture#channel-opening))  
2. Legacy/Manual: Provide only creator's signature in create() → status INITIAL → separate join() calls → ACTIVE

This section documents flow \#2. Most implementations use flow \#1.

Purpose: Allow other participants to join and fund the channel (when using separate join flow).

Process:

1. Each non-Creator participant:  
   * Verifies the channelId and expected allocations  
   * Signs the same funding packedState  
   * Calls the join function with channelId, their participant index, and signature  
2. The contract:  
   * Verifies the participant's signature against the funding packedState  
   * Confirms the signer matches the expected participant at the given index  
   * Locks the participant's funds according to the allocation  
   * Tracks the actual deposit in the channel metadata  
   * Emits a Joined event with channelId and participant index  
3. When all participants have joined, the contract:  
   * Verifies that all expected deposits are fulfilled  
   * Sets the channel status to ACTIVE  
   * Emits an Opened event with channelId

SystemContractParticipantSystemContractParticipantStatus INITIALStatus ACTIVEalt\[All participants joined\]Sign funding packedStatejoin(channelId, index, signature)Verify signatureLock participant fundsEmit Joined eventSet status to ACTIVEEmit Opened event  
Channel Activation

The channel becomes operational only when ALL participants have successfully joined and funded their allocations.

## Active Phase

Purpose: Enable off-chain state updates while channel is operational.

### Off-Chain Updates

Participants:

* Exchange and sign state updates off-chain via the Nitro RPC protocol  
* Maintain a record of the latest valid state  
* Use application-specific data in the state.data field

Each new state:

* May update allocations when assets are transferred (though allocations can remain unchanged between states, e.g., game moves without fund transfers)  
* MUST be signed by the necessary participants according to adjudicator rules  
* MUST comply with the validation rules of the channel's adjudicator

The on-chain contract remains unchanged during the active phase unless participants choose to checkpoint a state.

Off-Chain Efficiency

During the active phase, state updates occur entirely off-chain with zero gas costs and sub-second latency.

## Checkpointing

Purpose: Record a state on-chain without entering dispute mode.

Process:

1. Any participant:  
   * Calls the checkpoint function with a valid state and required proofs  
2. The contract:  
   * Verifies the submitted state via the adjudicator  
   * If valid and more recent than the previously checkpointed state, stores it  
   * Emits a Checkpointed event with channelId

checkpoint  
Valid  
Active Channel  
Status: ACTIVE  
Verify State  
Store State  
Emit Event  
Remain Active  
Status: ACTIVE  
Optional Operation

Checkpointing is optional but recommended for long-lived channels or after significant value transfers.

## Closure \- Cooperative

Purpose: Close channel to distribute locked funds, after all participants have agreed on the final state.

Process:

1. Any participant:  
   * Prepare a final State with intent equal to FINALIZE.  
   * Collects signatures from all participants on this final state  
   * Calls the close function with channelId, final state, and any required proofs  
2. The contract:  
   * Verifies all participant signatures on the closing packedState  
   * Verifies the state has intent equal to FINALIZE.  
   * Distributes funds according to the final state's allocations  
   * Sets the channel status to FINAL  
   * Deletes the channel metadata  
   * Emits a Closed event

ContractUserContractUserStatus \= ACTIVEStatus \= FINALCreate final State (intent=FINALIZE)Collect all signaturesclose(channelId, state, proofs)Verify all signaturesVerify intent \= FINALIZEDistribute fundsSet status to FINALDelete metadataEmit Closed event  
Preferred Method

This is the preferred closure method as it is fast and gas-efficient. It requires only one transaction and completes immediately without a challenge period.

## Closure \- Challenge-Response

Purpose: Handle closure when participants disagree or one party is unresponsive.

### Challenge Process

1. To initiate a challenge, a participant:  
   * Calls the challenge function with their latest valid state and required proofs

Latest State Location

The participant's latest state may only exist off-chain and not be known on-chain yet. The challenge process brings this off-chain state on-chain for validation.

2. The contract:  
   * Verifies the submitted state via the adjudicator  
   * If valid, stores the state and starts the challenge period  
   * Sets a challenge expiration timestamp (current time \+ challenge duration)  
   * Sets the channel status to DISPUTE  
   * Emits a Challenged event with channelId and expiration time

TimerContractUserTimerContractUserStatus \= ACTIVEStatus \= DISPUTEchallenge(channelId, state, proofs)Verify stateStore stateSet status to DISPUTEStart challenge periodEmit Challenged event

### Resolving Challenge with Checkpoint

During the challenge period, any participant:

* Submits a more recent valid state by calling checkpoint()  
* If the new state is valid and more recent (as determined by the adjudicator or IComparable interface), the contract updates the stored state, resets the challenge period, and returns the channel to ACTIVE status

### Challenge Period Elapse

After the challenge period expires, any participant:

* Call close with an empty candidate and proof to distribute funds according to the last valid challenged state

The contract:

* Verifies the challenge period has elapsed  
* Distributes funds according to the challenged state's allocations  
* Sets channel status to FINAL  
* Deletes the channel metadata  
* Emits a Closed event

Key Principle

The challenge mechanism gives parties time to prove they have a newer state. If no one responds with a newer state, the challenged state is assumed correct.

Complete Challenge-Response Flow:

challenge()  
checkpoint() with newer state  
close() after timeout  
Active  
Dispute  
Final  
Challenge period active  
Parties can submit  
newer states

## Resize Protocol

Purpose: Adjust funds locked in the channel by locking or unlocking funds without closing the channel.

Process:

1. Any participant:  
   * Calls the resize function with:  
     * The channelId (remains unchanged)  
     * A candidate State with:  
       * intent \= StateIntent.RESIZE  
       * version \= precedingState.version \+ 1  
       * data \= ABI-encoded int256\[\] containing delta amounts (positive for deposit, negative for withdrawal) respectively for participants  
       * allocations \= Allocation\[\] after resize (absolute amounts)  
       * Signatures from ALL participants (consensus required)  
     * An array of proof states containing the previous state (version-1) first and its proof later in the array

Deposit Requirement

The participant depositing must have at least the corresponding amount in their Custody ledger account (available balance) to lock additional funds to the channel.

2. The contract:  
   * Verifies the channel is in ACTIVE status  
   * Verifies all participants have signed the resize state  
   * Decodes delta amounts from candidate.data  
   * Validates adjudicator approves the preceding state  
   * For positive deltas: Locks additional funds from custody account  
   * For negative deltas: Unlocks funds back to custody account  
   * Updates expected deposits to match new allocations  
   * Emits Resized(channelId, deltaAllocations) event  
3. The channel:  
   * channelId remains UNCHANGED (same channel persists)  
   * Status remains ACTIVE throughout  
   * Version increments by 1  
   * No new channel is created

ContractUserContractUserStatus \= ACTIVESame channelIdState version \+ 1Intent \= RESIZEStatus \= ACTIVESame channelIdChannel still ACTIVEresize(channelId, resizeState, proofs)Verify signatures (all participants)Decode delta amounts from state.dataLock funds (positive deltas)Unlock funds (negative deltas)Update expected depositsResized(channelId, deltas)  
Use Cases:

* Increasing funds locked in the channel (positive delta: adding funds)  
* Decreasing funds locked in the channel (negative delta: removing funds)  
* Adjusting fund distribution while maintaining channel continuity

In-Place Update

The resize operation updates the channel in place. The channelId stays the same, and the channel remains ACTIVE throughout. This differs from closing and reopening, which would create a new channel.

Implicit Transfer with Resize

It is possible to combine a transfer (change of allocations among participants) with a resize operation. For example:

* Previous state allocations: \[5, 10\]  
* Desired transfer: 2 tokens from second to first participant → \[7, 8\]  
* Additional changes: first participant withdraws all 7, second participant deposits 6  
* Delta amounts: \[-7, 6\]  
* Resize state allocations: \[0, 14\]

Rule: sum(allocations\_resize\_state) \= sum(allocations\_prev\_state) \+ sum(delta\_amounts)  
For this example: 14 \= 15 \+ (-1) ✓

## State Transition Summary

The complete channel lifecycle state machine:

Initial  
create()  
create() with all sigs  
join() all  
resize()  
challenge()  
close() cooperative  
checkpoint() newer  
close() after timeout  
Deleted  
VOID  
INITIAL  
ACTIVE  
DISPUTE  
FINAL  
Channel does not exist  
Awaiting participants  
Operational  
Off-chain updates  
Challenge active  
Response period  
Funds distributed  
Ready for deletion  
Valid Transitions:

| From | To | Trigger | Requirements |
| ----- | ----- | ----- | ----- |
| VOID | INITIAL | create() | Creator signature, sufficient balance, INITIALIZE intent |
| INITIAL | ACTIVE | join() | All participants joined and funded |
| ACTIVE | ACTIVE | checkpoint() | Valid newer state |
| ACTIVE | ACTIVE | resize() | All signatures, valid deltas, sufficient balance |
| ACTIVE | DISPUTE | challenge() | Valid state newer than latest known on-chain |
| ACTIVE | FINAL | close() | All signatures, FINALIZE intent |
| DISPUTE | ACTIVE | checkpoint() | Valid newer state |
| DISPUTE | FINAL | close() | Challenge period expired |
| FINAL | VOID | Automatic | Metadata deleted |

Channel Deletion

When a channel reaches FINAL status, the channel metadata is deleted from the chain and funds are distributed according to the final state allocations.

Signature Formats  
Nitrolite treats each signature inside State.sigs as an opaque bytes value. At verification time the Custody contract inspects that payload to detect which validation flow to run. This page captures the current formats the protocol accepts and how they are evaluated.

## Supported Formats

### Raw / Pre-EIP-191 ECDSA

* Signs the raw packedState with no prefix.  
* Produces the canonical (v, r, s) tuple encoded as 65 bytes.  
* Recommended for chain-agnostic clients or when hardware-wallet compatibility is required.

### EIP-191 (0x45) Ethereum Signed Message

* Payload: keccak256(\\"\\\\x19Ethereum Signed Message:\\\\n\\" \+ len(packedState) \+ packedState).  
* Matches the UX most wallets expose when calling eth\_sign.  
* Nitrolite stores the resulting (v, r, s) so adjudicators can re-create the prefixed hash for verification.

### EIP-712 Typed Data

* Payload: keccak256(\\"\\\\x19\\\\x01\\" \++ domainSeparator \++ hashStruct(state)).  
* Domain separator includes chain ID, verifying contract, and an application-specific salt to prevent replay.  
* Provides the strongest replay protection when both parties agree on the domain definition.

### EIP-1271 Smart-Contract Signatures

* Supports smart contract wallets (multi-sigs, modules, account abstraction).  
* The bytes payload is passed to the signer's isValidSignature(hash, bytes signature) function.  
* Implementations can encode arbitrary metadata (e.g., batched approvals, guardians).

### EIP-6492 Counterfactual Signatures

* Wraps an EIP-1271 signature with deployment bytecode and a detection suffix 0x6492649264926492649264926492649264926492649264926492649264926492.  
* Allows a not-yet-deployed ERC-4337 smart wallet to attest to a state.  
* During verification Nitrolite simulates or deploys the wallet, then forwards the inner signature to the regular EIP-1271 flow.

## Verification Order

The Custody contract attempts the following strategies in order:

1. EIP-6492 – If the detection suffix is present, unwrap and validate as counterfactual.  
2. EIP-1271 – If the signer currently has contract code, call isValidSignature.  
3. ECDSA / EIP-191 / EIP-712 – Otherwise treat it as an externally owned account signature and recover the signer using the appropriate hash for the advertised format.

Implementations should persist metadata about which scheme was used so that adjudicators and monitoring services can reproduce the expected hash locally.

## Implementation Notes

* bytes\[\] sigs preserves the ordering of channel participants, but each entry may come from a different signature family.  
* Wallets should expose the format they used when signing to aid debugging.  
* Future versions may extend this list; storing opaque bytes ensures backward compatibility.

# Security Considerations

## Current Limitations

The current Custody contract implementation has the following limitations:

* Two-participant channels only: Channels support exactly 2 participants  
* Participant role constraint: First participant must always be a client, while second must be a Clearnode  
* Single allocation per participant: Each participant can have only 1 allocation  
* Same-token allocations: Both allocations must be for the same token  
* Minimum challenge duration: Challenge duration is set to be no less than 1 hour  
* No re-challenge: It is not possible to challenge an already challenged channel  
* No direct EOA resize: It is not possible to resize directly from or to your EOA; you must deposit to or withdraw funds from the Custody contract first  
* Channel required for withdrawal: It is not possible to withdraw your funds from the Unified Balance on a chain with no open channel without opening a channel first. In a future major release, we plan to merge these steps in one operation  
* Separate resize and balance operations: It is not possible to top-up a Unified Balance from or withdraw to your EOA balance in the same resize(...) operation. You must deposit your funds prior to or withdraw after the resize(...) operation. In a future major release, we plan to merge these steps in one operation

Future Improvements

Many of these limitations are implementation-specific and are planned to be addressed in future major releases. They do not represent fundamental protocol constraints.

## Threat Model

### Assumptions

The protocol operates under the following security assumptions:

* At least one honest party per channel willing to enforce their rights  
* Blockchain is secure and censorship-resistant within reasonable bounds  
* Cryptographic primitives are secure (ECDSA, keccak256)  
* Participants have access to the blockchain to submit challenges within the challenge period

Trust Model

Nitrolite is designed as a trustless protocol \- no single party can steal funds or prevent others from recovering their legitimate share.

### Protected Against

The protocol provides protection against:

* Replay attacks via version number checking in Custody contract  
* State withholding via challenge mechanism  
* Unauthorized state transitions via signature verification  
* Funds theft \- all transitions require valid signatures from appropriate parties

### Not Protected Against

The protocol cannot protect against:

* All participants colluding to violate application rules  
* Blockchain-level attacks (51% attacks, MEV exploitation, etc.)  
* Denial of service by blockchain congestion \- may affect ability to respond to challenges

Blockchain Dependency

The security of Nitrolite channels depends on the underlying blockchain's liveness and security. Extended blockchain downtime during a challenge period could prevent parties from responding.

## Security Properties

### Funds Safety

Property: Participants can always recover their funds according to the latest valid signed state, even if other participants become unresponsive.

Mechanism: The challenge-response system ensures that:

1. Any party can initiate closure unilaterally  
2. Challenge period allows time for others to respond with newer states  
3. Newest valid state always wins  
4. Funds are distributed according to the final accepted state

Yes  
No  
No  
Yes  
User has latest  
signed state  
Other participant responsive?  
Cooperative close  
Fast & cheap  
Challenge with  
latest state  
Wait challenge  
period  
Communication continuation suggested?  
Close & recover funds  
Create and submit a  
newer state via checkpoint(...)

### State Validity

Property: Only states signed by the required participants (as determined by the adjudicator) can be accepted.

Mechanism:

* Every state update requires cryptographic signatures  
* Signatures are verified against the packedState  
* Adjudicator validates state transitions according to application rules  
* Invalid states are rejected on-chain

Cryptographic Security

State validity is enforced through [supported signatures](https://docs.yellow.org/docs/protocol/on-chain/signature-formats), all of which are supported by Ethereum itself.

#### EIP-712 Signature Support

Nitrolite supports EIP-712 (Typed Structured Data) signatures in addition to raw ECDSA and EIP-191. This provides significant security and user experience advantages:

Security Benefits:

* Domain Separation: Signatures are bound to a specific contract and chain, preventing replay attacks across different applications or networks  
* Type Safety: Structured data hashing ensures only valid state structures can be signed, preventing malformed data injection  
* Semantic Clarity: Each field's type and purpose is cryptographically enforced, reducing ambiguity attacks

User Experience Benefits:

* Human-Readable: Modern wallets (MetaMask, Ledger, etc.) display EIP-712 signatures as structured fields instead of opaque hex strings  
* Transparency: Users see exactly what channelId, intent, version, allocations, and data they're signing  
* Trust: Clear presentation reduces phishing risks and increases user confidence

Example Wallet Display:

Sign Typed Data:  
 channelId: 0xabcd1234...  
 intent: OPERATE (1)  
 version: 5  
 allocations:  
   \[0\] destination: 0x742d35Cc..., token: USDC, amount: 100.00  
   \[1\] destination: 0x123456Cc..., token: USDC, amount: 0.00  
Compared to EIP-191 which would show:

Sign Message:  
0x1ec5000000000000000000000000000000000000000000000000000000001234abcd...  
\[500\+ more hex characters\]  
Implementation Note: The protocol accepts all three formats (raw ECDSA, EIP-191, EIP-712) for maximum compatibility, but EIP-712 is strongly recommended for production applications due to its superior security and UX properties.

Supporting EIP-712 signatures also differentiates Nitrolite by keeping state channel operations wallet-friendly and lowering integration friction compared to protocols limited to raw message signing.

### Liveness

Property: As long as the blockchain is live and accepts transactions within the challenge period, honest participants can enforce their rights.

Requirements:

* Blockchain must be operational  
* Participant must be able to submit transactions  
* Challenge period must be sufficient for transaction confirmation

Recommended Challenge Periods:

* High-value channels: 24-48 hours (default: 24 hours / 86400 seconds)  
* Medium-value channels: 12-24 hours  
* Low-value rapid channels: 6-12 hours

Challenge Period Trade-offs

Longer challenge periods provide more security but slower dispute resolution. Shorter periods enable faster closure but require more vigilant monitoring.

### Censorship Resistance

Property: Since anyone can submit challenges and responses, censorship of a single participant does not prevent channel closure.

Mechanism:

* Any participant can initiate challenge  
* Any participant can respond to challenge  
* Multiple participants can attempt the same operation  
* As long as one honest party can transact, the channel can be resolved

## Attack Vectors and Mitigations

### Replay Attacks

Attack: Resubmitting old signed states to revert channel to a previous favorable allocation.

Mitigation:

* Adjudicators MUST implement version checking to verify that a supplied "candidate" is indeed supported by a supplied "proof".  
* Higher version numbers supersede lower versions  
* On-chain contract tracks the highest version seen  
* Old states are automatically rejected

v10 \> v5  
v10 \< v20  
State v10 submitted  
Compare versions  
Accept new state  
Reject old state  
Version Monotonicity

Always ensure state versions increase monotonically. Never sign two different states with the same version number.

### State Withholding

Attack: Refusing to cooperate in closing channel, holding funds hostage.

Mitigation:

* Challenge mechanism allows unilateral closure  
* Challenge period ensures fair dispute resolution  
* Latest signed state always prevails

Example Scenario:

1\. Alice and Bob have channel with $1000 each  
2\. After trading, valid state shows Alice: $1500, Bob: $500  
3\. Bob refuses to cooperate in cooperative close  
4\. Alice initiates challenge with latest signed state  
5\. Bob has access only to an older state, meaning he is unable to resolve the challenge  
6\. After challenge period elapses, Alice's state becomes the final one  
7\. Alice recovers her $1500

### Challenge Griefing

Attack: Repeatedly challenging with old states to delay closure and grief the counterparty.

Mitigation:

* Each valid newer state resets the challenge period  
* Attacker must pay gas for each challenge attempt  
* Eventually attacker runs out of old states  
* Newest state always wins regardless of challenge count  
* The party being griefed can checkpoint with the latest valid state, impeding the griefer from challenging with any intermediate state

Economic Disincentive

Challenge griefing is economically costly for the attacker (gas fees) while only causing time delay, not fund loss, for the victim.

### Front-Running

Attack: Observing pending challenge transaction and front-running with a newer state.

Mitigation:

* This is actually desired behavior in Nitrolite  
* The newest state should always win  
* Front-running helps ensure the most recent state is used  
* Both parties benefit from accurate state resolution

## Best Practices

### For Users

Essential Practices:

1. Never sign duplicate versions: Never sign two different states with the same version number  
2. Keep records: Maintain a record of the latest state you've signed  
3. Monitor events: Watch the blockchain for channel events (Challenged, Closed)  
4. Respond promptly: React to challenges within the challenge period  
5. Verify adjudicators: Only use adjudicator contracts from trusted sources

Critical Rule

NEVER sign two different states with the same version number. This creates ambiguity about the true latest state and can lead to disputes.

### For Implementers

Implementation Requirements:

1. Validate thoroughly: Check all inputs before submitting transactions  
2. Use adjudicators wisely: Leverage adjudicators to enforce application rules  
3. Set appropriate challenge periods: Balance security needs with user experience  
4. Implement proper key management: Secure storage for participant private keys  
5. Log state transitions: Maintain audit trail of all state updates

Sample Validation Checklist:

Before submitting state on-chain:  
☐ Verify all required signatures present  
☐ Verify signatures are valid for expected participants  
☐ Verify state version is sequential  
☐ Verify allocations sum correctly  
☐ Verify magic numbers (CHANOPEN/CHANCLOSE) if applicable  
☐ Verify channelId matches expected value  
☐ Test with small amounts first

### For Adjudicator Developers

Critical Requirements:

1. Implement strict version comparison: Ensure newer states always supersede older ones  
2. Validate state transitions: Enforce application-specific rules correctly  
3. Optimize for gas efficiency: Validation happens on-chain during disputes  
4. Consider edge cases: Handle all possible state transition scenarios  
5. Audit thoroughly: Security review before deployment is essential

Adjudicator Responsibility

Adjudicators are critical to channel security. A flawed adjudicator can undermine the entire channel's safety guarantees.

Before Implementing Your Own Adjudicator

The Adjudicator is an incredibly important part of the Nitrolite protocol. Yellow Network is built on top of a specific adjudicator, which if changed, will render interoperability and security guarantees impossible. Before starting to implement your own Adjudicator, please be sure to advise the Nitrolite developer team, so that your work is not left out.

## Security Guarantees Summary

| Property | Guarantee | Mechanism |
| ----- | ----- | ----- |
| Funds Safety | Cannot lose funds with valid signed state | Challenge-response \+ signatures |
| State Validity | Only properly signed states accepted | Signature verification |
| Liveness | Can always close if blockchain is live | Unilateral challenge mechanism |
| Censorship Resistance | Any party can enforce closure | Multiple submission paths |
| No Replay | Old states cannot be reused | Version number validation |

Strong Security Model

Nitrolite provides strong security guarantees built on top of Layer 1 blockchain security, while enabling Layer 2 scalability and efficiency.

## Emergency Procedures

### If a Clearnode Becomes Unresponsive

1. Retrieve latest signed state from local storage  
2. Initiate challenge on-chain with latest state  
3. Close the channel after challenge period expires  
4. Funds are recovered according to latest valid state

### If You Have Been Challenged

1. Check for the latest state \- make sure the channel was challenged with the latest state. If not, you should checkpoint it with one to avoid funds loss  
2. Ensure blockchain access \- check network connectivity  
3. Use appropriate gas prices \- ensure timely confirmation  
4. Have backup RPC endpoints \- don't rely on single provider

Monitoring Best Practice

Set up automated monitoring with alerts for channel events. This ensures you can respond quickly to challenges even if you're not actively watching.

Off-Chain RPC Protocol Overview  
The Off-Chain RPC Protocol defines how clients communicate with a clearnode to perform state channel operations without touching the blockchain.

---

## What is Nitro RPC?

Nitro RPC is a lightweight RPC protocol designed for state channel communication. It uses a compact JSON array format for efficiency and includes signature-based authentication.

Protocol Purpose

Nitro RPC enables clients to interact with a clearnode for channel management, fund transfers, and application-specific operations—all happening off-chain with instant finality and zero gas costs.

---

## Key Features

### 1\. Compact Message Format

Nitro RPC uses a streamlined JSON array format instead of verbose JSON objects, reducing message size and improving network efficiency.

*// Compact format: \[requestId, method, params, timestamp\]*  
\[1, "create\_channel", {"chain\_id": 137, "token": "0x...", "amount": "1000000"}, 1699123456789\]  
Efficiency Benefit

The compact array format reduces bandwidth usage by approximately 30% compared to traditional JSON-RPC, crucial for high-frequency state channel updates.

### 2\. Signature-Based Authentication

Every request and response is cryptographically signed, ensuring:

* Message authenticity: Verify sender identity  
* Message integrity: Detect tampering  
* Non-repudiation: Proof of communication

### 3\. Multi-Signature Support

Supports operations requiring multiple participants' signatures:

* Channel creation (user \+ a clearnode)  
* App session state updates (multiple participants based on quorum)  
* Cooperative channel closure

### 4\. Timestamp-Based Request Ordering

All messages include timestamps (client-provided on requests, server-provided on responses) enabling:

* Request ordering  
* Replay attack prevention  
* Audit trail for debugging

### 5\. Channel-Aware Message Structure

The protocol understands channel concepts natively:

* Packed states  
* Multi-party signatures  
* State versioning

---

## Protocol Versions

Nitro RPC has evolved to support advanced features while maintaining backward compatibility.

### Version Comparison

| Feature | NitroRPC/0.2 | NitroRPC/0.4 |
| ----- | ----- | ----- |
| Status | Legacy | Current |
| Basic State Updates | ✅ | ✅ |
| Intent System | ❌ | ✅ |
| DEPOSIT Intent | ❌ | ✅ (add funds to app sessions) |
| WITHDRAW Intent | ❌ | ✅ (remove funds from app sessions) |
| OPERATE Intent | Implicit only | ✅ Explicit |
| Recommended | No | Yes |

Version Recommendation

Always use NitroRPC/0.4 for new implementations. Version 0.2 is maintained for backward compatibility only and lacks the intent system required for flexible app session management.

### NitroRPC/0.2 (Legacy)

Features:

* Basic state updates for app sessions  
* All updates redistribute existing funds  
* Cannot add or remove funds from active sessions  
* Must close and recreate sessions to change total funds

Use Case: Maintained for existing applications, not recommended for new development.

### NitroRPC/0.4 (Current)

Features:

* Intent-based state updates: OPERATE, DEPOSIT, WITHDRAW  
* Add funds to active app sessions (DEPOSIT)  
* Remove funds from active sessions (WITHDRAW)  
* Better error handling and validation  
* Enhanced security checks

Use Case: All new implementations should use this version.

---

## Communication Architecture

Nitro RPC enables bidirectional real-time communication between clients and a clearnode.

RPC Connection  
Event Monitoring  
State Management  
1\. RPC Request  
(signed)  
2\. Process & Validate  
3\. RPC Response  
(signed)  
Async Notifications  
Blockchain Events  
Client Application  
Clearnode  
Blockchain  
Database

### Connection Flow

1. Client Establishes Connection: Open persistent connection to a clearnode  
2. Authentication: Complete 3-step auth flow (auth\_request → auth\_challenge → auth\_verify)  
3. RPC Communication: Send requests, receive responses  
4. Notifications: Receive real-time updates (balance changes, channel events)  
5. Keep-Alive: Periodic ping/pong to maintain connection (optional, depends upon the implementation chosen)

---

## Message Categories

Nitro RPC methods are organized into functional categories:

### 1\. Authentication Methods

Establish and manage authenticated sessions:

* auth\_request \- Initiate authentication (response: auth\_challenge)  
* auth\_verify \- Complete authentication with challenge response

### 2\. Channel Management Methods

Create and manage payment channels:

* create\_channel \- Open new channel  
* close\_channel \- Cooperatively close channel  
* resize\_channel \- Adjust channel allocations

### 3\. Transfer Methods

Move funds between users:

* transfer \- Send funds off-chain with instant settlement

### 4\. App Session Methods

Manage multi-party application channels:

* create\_app\_session \- Create new app session  
* submit\_app\_state \- Update session state (with intents)  
* close\_app\_session \- Finalize and distribute funds

### 5\. Query Methods

Read state and configuration:

* Public: get\_config, get\_assets, get\_app\_definition, get\_channels, get\_app\_sessions, get\_ledger\_entries, get\_ledger\_transactions, ping  
* Private (auth required): get\_ledger\_balances, get\_rpc\_history, get\_user\_tag, get\_session\_keys

### 6\. Notifications (Server-to-Client)

Real-time updates:

* bu (balance update) \- Balance changed  
* cu (channel update) \- Channel status changed  
* tr (transfer) \- Incoming/outgoing transfer  
* asu (app session update) \- App session state changed

---

## Security Model

The Off-Chain RPC Protocol provides multiple layers of security:

### Cryptographic Security

* ECDSA Signatures: Every message signed with secp256k1  
* Keccak256 Hashing: Message integrity verification  
* Challenge-Response Auth: Prove key ownership without exposing private keys

### Protocol-Level Security

* Request Ordering: Timestamps prevent replay attacks  
* Session Expiration: Session keys have time limits  
* Spending Allowances: Limit session key spending power  
* Signature Verification: All operations require valid signatures

### Network Security

* TLS Encrypted Communication: Encrypted communication channel  
* Origin Validation: Prevent unauthorized connections

Strong Security Model

The combination of cryptographic signatures, challenge-response authentication, and spending allowances ensures that even if a session key is compromised, damage is limited by spending caps and expiration times.

---

## Next Steps

Explore the detailed specifications for each part of the protocol:

* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) \- Learn the request/response structure  
* [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication) \- Implement secure session management  
* [Channel Methods](https://docs.yellow.org/docs/protocol/off-chain/channel-methods) \- Create and manage payment channels  
* [Transfers](https://docs.yellow.org/docs/protocol/off-chain/transfers) \- Enable instant off-chain payments  
* [App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) \- Build multi-party applications  
* [Queries & Notifications](https://docs.yellow.org/docs/protocol/off-chain/queries) \- Read state and receive updates

---

## Key Concepts

Before diving into specific methods, ensure you understand these core concepts from the protocol foundation:

* Channel \- Payment channel locking funds on-chain  
* State \- Snapshot of channel at a point in time  
* Participant \- Entity in a channel (user, a clearnode)  
* Unified Balance \- Aggregated balance across chains  
* Session Key \- Temporary key with spending limits

# Message Format

The Nitro RPC protocol uses a compact, efficient message format for all communication between clients and a clearnode.

---

## General Structure

Every Nitro RPC message consists of a compact JSON array format:

\[requestId, method, params, timestamp\]  
Compact Format

This array-based format reduces message overhead by approximately 30% compared to traditional JSON-RPC, making it ideal for high-frequency state channel operations.

### Components

| Component | Type | Description |
| ----- | ----- | ----- |
| requestId | uint64 | Unique identifier for the request, used to correlate responses |
| method | string | Remote method name to be invoked |
| params | object | Method-specific parameters as a JSON object |
| timestamp | uint64 | Server-provided timestamp in milliseconds |

#### requestId

* Purpose: Correlate requests with their responses  
* Type: Unsigned 64-bit integer  
* Generation: Client-generated, must be unique per connection  
* Range: 0 to 2^64-1  
* Example: 1, 42, 9876543210

#### method

* Purpose: Specify which RPC method to invoke  
* Type: String  
* Format: snake\_case (e.g., create\_channel, not createChannel)  
* Examples: auth\_request, transfer, create\_app\_session

#### params

* Purpose: Provide method-specific parameters  
* Type: JSON object  
* Content: Varies by method  
* Example: {"chain\_id": 137, "token": "0x...", "amount": "100000000"}  
* Reference: See [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication), [Channel Methods](https://docs.yellow.org/docs/protocol/off-chain/channel-methods), [Transfers](https://docs.yellow.org/docs/protocol/off-chain/transfers), [App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions), and [Queries](https://docs.yellow.org/docs/protocol/off-chain/queries) for parameter specifications

#### timestamp

* Purpose: Request ordering and replay attack prevention  
* Type: Unsigned 64-bit integer (Unix milliseconds)  
* Generation: Client-provided on requests; server-provided on responses  
* Example: 1699123456789 (November 5, 2023, 01:57:36 UTC)

---

## Request Message

A complete request message wraps the payload array and includes signatures.

### Structure

{  
 "req": \[requestId, method, params, timestamp\],  
 "sig": \[signature1, signature2, ...\]  
}

### Fields

#### req

The request payload as a 4-element array containing:

* Request ID  
* Method name  
* Parameters object  
* Timestamp

#### sig

Array of ECDSA signatures, one or more depending on the operation:

* Single signature: Most operations (signed by client's session key)  
* Multiple signatures: Multi-party operations (e.g., app session creation)

### Signature Format

Each signature is:

* Format: 0x-prefixed hex string  
* Length: 65 bytes (130 hex characters \+ "0x" prefix)  
* Components: r (32 bytes) \+ s (32 bytes) \+ v (1 byte)  
* Algorithm: ECDSA over secp256k1 curve  
* Hash: keccak256 of the exact req array bytes

Example Signature:

0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01  
EVM-Specific Format

This signature format (ECDSA over secp256k1 with keccak256 hashing) is specific to EVM-compatible chains. If the protocol extends to support non-EVM chains in the future, signature formats may need to be adapted to match those chains' native cryptographic primitives.

Signature Security

Signatures are computed over the keccak256 hash of the JSON-encoded req array. The JSON encoding MUST be consistent (same key ordering, no extra whitespace) to ensure signature validity.

### Complete Example

{  
 "req": \[  
   1,  
   "auth\_request",  
   {  
     "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",  
     "session\_key": "0x9876543210fedcba9876543210fedcba98765432",  
     "application": "trading-dex",  
     "allowances": \[  
       {"asset": "usdc", "amount": "1000.0"},  
       {"asset": "eth", "amount": "0.5"}  
     \],  
     "scope": "transfer,app.create",  
     "expires\_at": 1762417328123  
   },  
   1699123456789  
 \],  
 "sig": \[  
   "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef01"  
 \]  
}  
---

## Response Message

The clearnode sends response messages with the same structure, replacing params with result.

### Structure

{  
 "res": \[requestId, method, result, timestamp\],  
 "sig": \[signature1, ...\]  
}

### Fields

#### res

The response payload as a 4-element array:

* Same requestId (to correlate with request)  
* method (response method name)  
  * Usually matches the request method  
  * Exception: auth\_request → response has auth\_challenge method  
  * Exception: Errors → response has error method  
* result (method-specific response data, replaces params)  
* timestamp (server response time)

#### sig

The clearnode's signature(s) over the response:

* Proves response authenticity  
* Verifies response hasn't been tampered with  
* Enables non-repudiation

### Complete Example

{  
 "res": \[  
   1,  
   "auth\_challenge",  
   {  
     "challenge\_message": "550e8400-e29b-41d4-a716-446655440000"  
   },  
   1699123457000  
 \],  
 "sig": \[  
   "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab"  
 \]  
}  
---

## Error Response

When an error occurs, the clearnode sends an error response with method set to "error".

### Structure

{  
 "res": \[  
   requestId,  
   "error",  
   {  
     "error": "Error description message"  
   },  
   timestamp  
 \],  
 "sig": \["0xServerSignature..."\]  
}  
The result object at position 2 contains a single "error" field with a descriptive error message string.

### Error Examples

Authentication Required:

{  
 "res": \[  
   5,  
   "error",  
   {  
     "error": "Authentication required: session not established"  
   },  
   1699123456789  
 \],  
 "sig": \["0xServerSignature..."\]  
}  
Insufficient Balance:

{  
 "res": \[  
   12,  
   "error",  
   {  
     "error": "Insufficient balance: required 100 USDC, available 75 USDC"  
   },  
   1699123456790  
 \],  
 "sig": \["0xServerSignature..."\]  
}  
Method Not Found:

{  
 "res": \[  
   8,  
   "error",  
   {  
     "error": "Method not found: 'invalid\_method'"  
   },  
   1699123456791  
 \],  
 "sig": \["0xServerSignature..."\]  
}  
Error Handling

Check the response method field (position 1 in res array). If it equals "error", extract the error message from the result object's error field. The error message provides human-readable context about what went wrong.

---

## Payload Hash Computation

Every RPC message (request or response) is signed over the exact serialized req or res array bytes.

### What is Signed

* Requests: The req array \[requestId, method, params, timestamp\] exactly as sent  
* Responses: The res array \[requestId, method, result, timestamp\] exactly as received

### Hash Formula

payloadHash \= keccak256(\<exact JSON bytes of req or res\>)  
Use the same bytes you transmit (or receive) when computing/verifying the hash; do not re-serialize with different spacing or key ordering.

### Example

Request Payload:

\[42,"create\_app\_session",{"definition":{...},"allocations":\[...\]},1699123456789\]  
Hash that exact byte string, then sign it (client for requests, clearnode for responses).

---

## Message Flow Diagram

The following diagram illustrates the complete request-response cycle:

ClearnodeClientClearnodeClientClearnodeClientGenerate RequestProcess RequestGenerate ResponseProcess ResponseCreate payload: \[request\_id, method, params, 0\]Sign payload with session keySend Request {req, sig}Verify signatureValidate parametersExecute method logicGenerate resultCreate response: \[request\_id, method, result, timestamp\]Sign responseSend Response {res, sig}Verify Clearnode signatureCorrelate by request\_idHandle result  
---

## Signature Verification Process

Both clients and a clearnode MUST verify signatures on all messages.

### Client Verifying a Clearnode Response

1. Extract Response: Get res array from response  
2. Compute Hash: hash \= keccak256(\<exact res bytes\>)  
3. Recover Address: Use sig to recover signer address  
4. Verify: Confirm recovered address matches the clearnode's known address

### A Clearnode Verifying Client Request

1. Extract Request: Get req array from request  
2. Compute Hash: hash \= keccak256(\<exact req bytes\>)  
3. Recover Address: Use sig to recover signer address  
4. Verify: Confirm recovered address matches authenticated user or registered session key

Signature Verification Requirements

Most messages MUST be cryptographically signed and verified. All state-changing operations (channel creation/closure, transfers, app sessions) and authenticated methods require valid signatures. However, some query methods (such as get\_config) may be accessed without signatures. Refer to individual method specifications for signature requirements.

---

## JSON Encoding Consistency

To ensure signature validity, JSON encoding MUST be consistent across all implementations.

### Requirements

1. Key Ordering: Object keys MUST be in a deterministic order  
2. No Whitespace: Remove all unnecessary whitespace  
3. No Trailing Commas: Standard JSON (no trailing commas)  
4. UTF-8 Encoding: Use UTF-8 character encoding  
5. Number Format: Numbers as strings for large integers (avoid precision loss)

### Canonical Example

Consistent (valid for signing):

\[1,"transfer",{"amount":"100","asset":"usdc","destination":"0x..."},1699123456\]  
Inconsistent (would produce different hash):

\[  1,  "transfer",  { "destination": "0x...", "amount": "100", "asset": "usdc" },  1699123456  \]  
Implementation Note

Use a JSON library that supports canonical JSON serialization, or implement strict key ordering and whitespace removal before computing hashes.

---

## Next Steps

Now that you understand the message format, explore how it's used in practice:

* [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication) \- Learn the 3-step authentication flow  
* [Channel Methods](https://docs.yellow.org/docs/protocol/off-chain/channel-methods) \- See request/response examples for channel operations  
* [Transfers](https://docs.yellow.org/docs/protocol/off-chain/transfers) \- Understand transfer message structure  
* [App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) \- Explore multi-signature app session messages

For a high-level overview, return to [Off-Chain RPC Overview](https://docs.yellow.org/docs/protocol/off-chain/overview).

# Authentication

Authentication with Clearnode can be done in two ways: using your main wallet as a root signer for all requests, or delegating to session keys via a secure 3-step challenge-response protocol.

---

## Overview

There are two authentication approaches:

1. Main Wallet (Root Signer): Sign every request with your main wallet. Simple but requires user interaction for each operation.  
2. Session Keys (Delegated): Establish an authenticated session once, then use a session key for subsequent operations without repeatedly prompting the main wallet.

Main Wallet as Root Signer

You can skip the session key flow entirely and use your main wallet to sign all requests. This provides maximum security but requires wallet interaction for every operation. Simply sign each request with your main wallet's private key instead of creating a session key.

### Why Session Keys?

Session keys provide flexible security management:

* Granular Permissions: Specify which operations the session key can perform  
* Spending Allowances: Set maximum spending limits per asset  
* Time-Bounded: Automatic expiration reduces risk of key compromise  
* Application-Scoped: Different keys for different apps  
* User Experience: No repeated wallet prompts during active session

Flexible Security Management

Session keys give users a flexible way to manage security of their funds by providing specific permissions and allowances for specific apps, balancing convenience with security.

### Choosing Your Approach

| Aspect | Main Wallet (Root Signer) | Session Keys (Delegated) |
| ----- | ----- | ----- |
| Setup | None \- use immediately | One-time 3-step flow |
| UX | Wallet prompt for every operation | Sign once, use for duration |
| Security | Maximum \- full control always | Balanced \- limited by allowances |
| Use Case | Single operations, high-value transactions | Interactive apps, frequent operations |
| Revocation | Not needed | Can be revoked anytime |
| Best For | One-time actions, security-critical operations | Gaming, trading bots, dApps with frequent interactions |

When to Use Each

* Use Main Wallet: For single channel creation, large transfers, or when maximum security is required  
* Use Session Keys: For interactive applications, gaming, automated operations, or when user experience matters

### Session Key Authentication Flow

The 3-step process ensures both security and usability:

ClearnodeClientUser WalletClearnodeClientUser WalletClearnodeClientUser WalletStep 1: Register Session KeyStep 2: ChallengeStep 3: Verify Session KeyCompleteAll subsequent requests signed with session keyGenerate session keypair (locally)Prepare auth parameters (address, session\_key, application, allowances, expires\_at)auth\_request (public endpoint, no signature)Validate parametersGenerate challenge UUIDauth\_challenge (challenge\_message)Create EIP-712 typed data with challengeRequest EIP-712 signatureSign with main walletauth\_verify (EIP-712 signature by main wallet)Recover address from EIP-712 signatureValidate signature matches main walletCreate session (with allowances)Generate JWT tokenSession established (address, session\_key, jwt\_token, success)  
Challenge-Response Pattern

This pattern ensures that:

1. User owns the main wallet (EIP-712 signature in Step 3\)  
2. Challenge is unique and cannot be replayed  
3. No private keys are ever transmitted  
4. Session key is authorized by the main wallet

---

## Step 1: auth\_request

### Name

auth\_request

### Usage

Initiates authentication with Clearnode by registering a session key. The client sends authentication parameters to register a session key that can act on their behalf. The session key can have restricted permissions including spending limits (allowances), operation scope, and expiration time.

Important: auth\_request is a public endpoint and does not require a signature. The client simply needs to prepare and send the authentication parameters.

### When to Use

Optional: Use this when you want to delegate signing to a session key instead of using your main wallet for every request. This is the first step in establishing an authenticated session with Clearnode.

If you prefer to use your main wallet as a root signer for all operations, you can skip this entire authentication flow.

### Prerequisites

* User has a wallet with funds  
* Client can generate a keypair (e.g., secp256k1)  
* Client can prepare authentication parameters locally

### Request

| Parameter | Type | Required | Description | Default | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| address | string (wallet address) | Yes | User's main wallet address that owns the funds | \- | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | \- |
| session\_key | string (wallet address) | Yes | Wallet address of the locally-generated session keypair | \- | "0x9876543210fedcba9876543210fedcba98765432" | The private key never leaves the client |
| application | string | No | Application identifier for analytics and session management | "clearnode" | "chess-game-app" | Helps track which app is using which session |
| allowances | Array\<Allowance\> | No | Spending limits for this session key Structure (per allowance): • asset (string) \- Asset identifier (e.g., "usdc", "eth") • amount (string) \- Maximum amount this session can spend | Unrestricted if omitted/empty | \[{"asset": "usdc", "amount": "100.0"}\] | If empty/omitted, no spending cap is enforced |
| scope | string | No | Comma-separated list of permitted operations | All operations permitted | "app.create,app.submit,transfer" | Future feature, not fully enforced yet |
| expires\_at | number | Yes | Unix timestamp (milliseconds) when the session key expires | — | 1762417328000 | Provide a 13-digit Unix ms timestamp; no server default is applied |

Spending Allowances

If you omit allowances the session key is unrestricted. Specify explicit allowances to bound risk if a session key is compromised.

Allowances are validated against the broker’s supported assets. Unsupported symbols will cause authentication to fail.

### Response

| Parameter | Type | Description | Format | Example | Purpose |
| ----- | ----- | ----- | ----- | ----- | ----- |
| challenge\_message | string | UUID that client must sign with session key to prove ownership | UUID v4 | "550e8400-e29b-41d4-a716-446655440000" | Proves client controls session key without exposing private key |

### Signature

Request does NOT require a signature as auth\_request is a public endpoint.

Process:

1. Client prepares authentication parameters (address, session\_key, application, allowances, expires\_at)  
2. Client stores these parameters locally for use in Step 3 (auth\_verify)  
3. Client sends request to Clearnode  
4. Clearnode validates all parameters before generating a challenge

Parameter Storage

Keep the authentication parameters (especially address, session\_key, application, allowances, scope, and expires\_at) stored locally until Step 3, as you'll need them to create the EIP-712 signature.

### Next Step

Upon receiving the challenge\_message, client must prepare an EIP-712 signature (or reuse a previously issued jwt) and call auth\_verify.

### Error Cases

Error Codes

Currently, the protocol does not use standardized error codes. Errors are returned as descriptive messages.

Common error scenarios:

| Error | Description | Recovery |
| ----- | ----- | ----- |
| Invalid address format | Main wallet address is malformed | Verify address format (0x \+ 40 hex chars) |
| Invalid session key format | Session key address is malformed | Verify session key format |
| Invalid parameters | One or more parameters are invalid or missing | Check all required parameters |
| Session key already registered | This session key is already in use | Generate a new session keypair |

---

## Step 2: auth\_challenge

### Name

auth\_challenge

### Usage

Server-generated response to auth\_request containing a challenge that the client must sign to prove control of the session key. This implements a challenge-response authentication pattern to prevent replay attacks and verify the client controls the private key of the session key they registered.

### When to Use

Automatically sent by Clearnode in response to valid auth\_request. Client does not explicitly call this; it's part of the authentication flow.

### Request

N/A (server-initiated response to auth\_request)

### Response

| Parameter | Type | Description | Format | Purpose | Example | Generation | Lifetime |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| challenge\_message | string | Randomly generated UUID that client must sign | UUID v4 | Prevents replay attacks, proves session key ownership | "550e8400-e29b-41d4-a716-446655440000" | Cryptographically secure random UUID | Single use, expires after 5 minutes if not verified |

### Signature

The challenge is returned as a normal RPC response (server signs the envelope like any other RPC response).

### Next Step

Client signs the challenge with session key private key and calls auth\_verify.

Challenge Uniqueness

Each challenge is unique and single-use. It expires after 5 minutes if not verified. This prevents replay attacks where an attacker might try to reuse a captured challenge signature.

---

## Step 3: auth\_verify

### Name

auth\_verify

### Usage

Completes the authentication flow by submitting the signed challenge from auth\_challenge. If the signature is valid and matches the registered session key, the authentication is complete and the session key can be used to sign subsequent requests. This proves the client controls the private key without ever transmitting it.

### When to Use

Immediately after receiving auth\_challenge response. This is the final step in authentication.

### Prerequisites

* Completed auth\_request and received auth\_challenge  
* Have the challenge\_message  
* Have the session key private key (client-side only)

### Request

| Parameter | Type | Required | Description | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| challenge | string | Yes | The challenge\_message received from auth\_challenge | "550e8400-e29b-41d4-a716-446655440000" | Must be the exact challenge from Step 2 |
| jwt | string | No | Existing JWT for re-login without signature | "eyJhbGciOi..." | If provided, signature is not required |

### Response

| Parameter | Type | Description | Example | Notes |
| ----- | ----- | ----- | ----- | ----- |
| address | string (wallet address) | Authenticated user's main wallet address | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | Confirms which account is authenticated |
| session\_key | string (wallet address) | Confirmed session key wallet address | "0x9876543210fedcba9876543210fedcba98765432" | The authorized session key |
| jwt\_token | string | JWT token for authenticated API calls | "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | Store securely; validity follows the provided expires\_at |
| success | boolean | Authentication success indicator | true | Indicates if authentication completed successfully |

### Signature

If jwt is omitted, the request MUST include an EIP-712 signature signed by the main wallet (NOT the session key). If jwt is present, no signature is required.

EIP-712 Typed Data Structure:

{  
 types: {  
   EIP712Domain: \[  
     { name: "name", type: "string" }  
   \],  
   Policy: \[  
     { name: "challenge", type: "string" },  
     { name: "scope", type: "string" },  
     { name: "wallet", type: "address" },  
     { name: "session\_key", type: "address" },  
     { name: "expires\_at", type: "uint64" },  
     { name: "allowances", type: "Allowance\[\]" }  
   \],  
   Allowance: \[  
     { name: "asset", type: "string" },  
     { name: "amount", type: "string" }  
   \]  
 },  
 primaryType: "Policy",  
 domain: {  
   name: \<application\_name\>  *// From auth\_request*  
 },  
 message: {  
   challenge: \<challenge\_message\>,  *// From auth\_challenge*  
   scope: \<scope\>,                  *// From auth\_request*  
   wallet: \<address\>,               *// From auth\_request*  
   session\_key: \<session\_key\>,      *// From auth\_request*  
   expires\_at: \<expires\_at\>,        *// From auth\_request (13-digit Unix ms)*  
   allowances: \<allowances\>         *// From auth\_request*  
 }  
}  
Signing Process:

1. Client creates EIP-712 typed data with challenge and all parameters from Step 1  
2. User's wallet signs the typed data: signature \= signTypedData(typedData, mainWalletPrivateKey)  
3. Client sends request with EIP-712 signature in sig array

Critical Security Requirement

The auth\_verify signature MUST be an EIP-712 signature signed by the main wallet, not the session key. This proves the main wallet owner authorizes the session key to act on their behalf. The signature binds the challenge to the session key authorization.

### Next Step

Session is authenticated. All subsequent private method calls should be signed with the session key. You may also re-authenticate later by sending auth\_verify with the previously issued jwt (no signature required).

### Error Cases

Error Codes

Currently, the protocol does not use standardized error codes. Errors are returned as descriptive messages.

Common error scenarios:

| Error | Description | Recovery |
| ----- | ----- | ----- |
| Invalid signature | EIP-712 signature doesn't match main wallet or is malformed | Verify main wallet private key used for signing, check EIP-712 structure |
| Challenge expired | Challenge older than 5 minutes | Restart auth flow from auth\_request |
| Challenge already used | Challenge has been verified already | Generate new session or use existing if still valid |
| Invalid challenge | Challenge not found in pending auths | Ensure auth\_request succeeded first |
| Challenge mismatch | Challenge doesn't match pending auth | Use exact challenge from auth\_challenge |

---

## Complete Authentication Flow Example

Putting it all together:

Generate session keypair  
auth\_request  
(public, no signature)  
Receive challenge\_message  
Create EIP-712 typed data  
auth\_verify  
(EIP-712 sig by main wallet)  
Session \+ JWT established  
Use session key for requests  
Timeout (expires\_at reached)  
Spending limit exceeded  
Manual revocation  
Must re-authenticate  
Must re-authenticate  
Must re-authenticate  
Error (retry)  
Timeout (5 min)  
Error (retry)  
Error (retry)  
Unauthenticated  
PreparingAuth  
WaitingForChallenge  
CreatingEIP712  
SigningWithWallet  
WaitingForConfirmation  
Authenticated  
SessionExpired  
SessionInvalidated  
SessionRevoked  
---

## Session Management

### Session Lifecycle

1. Creation: After successful auth\_verify  
2. Active: Can perform operations until expiration or allowance exceeded  
3. Expiration: Automatic after specified duration  
4. Invalidation: When spending allowances exhausted  
5. Revocation: User or the clearnode can revoke manually

### Checking Session Status

Use get\_session\_keys to view active sessions and their remaining allowances. The response includes session details with current allowance usage and respects the expires\_at provided during auth\_request.

### Session Expiration Handling

When a session expires according to the expires\_at you provided, the clearnode will return an error response:

{  
 "res": \[  
   \<requestId\>,  
   "error",  
   {  
     "error": "session expired, please re-authenticate"  
   },  
   \<timestamp\>  
 \],  
 "sig": \[\<clearnode\_signature\>\]  
}  
Error Format

The protocol does not use numeric error codes. Errors are returned as method "error" with a descriptive message in the params.

Recovery: Re-authenticate by running the 3-step flow again.

### Spending Allowance Tracking

The clearnode tracks spending by monitoring all ledger debit operations:

Initial state:  
 allowance \= specified\_limit  
 used \= 0  
 remaining \= specified\_limit

After operations:  
 allowance \= specified\_limit (unchanged)  
 used \= sum\_of\_all\_debits  
 remaining \= allowance \- used

When operation exceeds remaining (for assets with an allowance):  
 Error: "Session key allowance exceeded: amount\_required, remaining\_available"  
Allowance Enforcement

When a session key reaches its spending cap, all further operations are rejected. The user must create a new session with fresh allowances or use their main wallet directly.

---

## Security Best Practices

### For Users

1. Set Spending Limits: Always specify allowances when creating sessions  
2. Short Expirations: Use shorter expiration times for sensitive operations  
3. Application Scoping: Use different session keys for different applications  
4. Monitor Usage: Regularly check session key spending via get\_session\_keys  
5. Revoke When Done: Revoke sessions when application use is complete

### For Developers

1. Secure Storage: Store session key private keys securely (encrypted storage, secure enclaves)  
2. Never Transmit: Never send session key private keys over network  
3. Handle Expiration: Implement automatic re-authentication on session expiry  
4. Clear on Logout: Delete session keys when user logs out  
5. Verify Signatures: Always verify the clearnode's signatures on responses

---

## Next Steps

Now that you're authenticated, you can:

* [Create Channels](https://docs.yellow.org/docs/protocol/off-chain/channel-methods) \- Open payment channels and deposit funds  
* [Transfer Funds](https://docs.yellow.org/docs/protocol/off-chain/transfers) \- Send instant off-chain payments  
* [Manage App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) \- Create multi-party application channels  
* [Query Data](https://docs.yellow.org/docs/protocol/off-chain/queries) \- Check balances, transactions, and channel status

For protocol fundamentals, see:

* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) \- Understand request/response structure  
* [Off-Chain RPC Overview](https://docs.yellow.org/docs/protocol/off-chain/overview) \- High-level protocol overview

# Channel Management Methods

Channel management methods enable clients to create, modify, and close payment channels with a clearnode on various blockchain networks.

---

## Overview

Payment channels are the foundation of the Nitrolite protocol. They lock funds on-chain while enabling instant off-chain operations within a unified balance.

### Channel Lifecycle Summary

create\_channel (off-chain)  
User submits create() transaction  
Contract locks user funds (status \= open)  
resize\_channel (optional)  
User submits resize() transaction  
close\_channel (cooperative)  
Funds distributed  
challenge() (non-cooperative)  
Challenge period then close()  
Requesting  
OnChain  
ACTIVE  
Resizing  
Closing  
Disputing  
---

## create\_channel

### Name

create\_channel

### Usage

Initiates the creation of a payment channel between user and a clearnode on a specific blockchain. The clearnode validates the request, generates a channel configuration with a unique nonce, prepares the initial funding state, and signs it. The user receives the complete channel data and the clearnode's signature, which they must then submit to the blockchain's Custody contract via the create() function to finalize channel creation and lock funds on-chain. This two-step process (off-chain preparation, on-chain execution) ensures the clearnode has agreed on channel creation and received an on-chain confirmation that it was created.

### When to Use

When a user wants to establish a payment channel on a specific blockchain network. This is the first operation after authentication if the user doesn't have an open channel yet. On subsequent connections, users won't need to create a channel again unless they closed it.

Two-Step Process

Channel creation is intentionally split into two steps:

1. Off-chain preparation: The clearnode prepares and signs the initial state  
2. On-chain execution: User submits transaction to create the channel

This ensures the clearnode has committed to the channel before the user submits the on-chain transaction.

### Prerequisites

* User must be [authenticated](https://docs.yellow.org/docs/protocol/off-chain/authentication)  
* Target blockchain and token must be supported by the clearnode  
* User must have native currency for gas fees

### Request

| Parameter | Type | Required | Description | Default | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| chain\_id | uint32 | Yes | Blockchain network identifier Examples: • 1: Ethereum Mainnet • 137: Polygon • 8453: Base • 42161: Arbitrum One • 10: Optimism | — | 137 | Use get\_config to see supported chains |
| token | string (wallet address) | Yes | ERC-20 token contract address on the specified chain Format: 0x-prefixed hex (20 bytes) | — | "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" | Must be supported; see get\_assets |

Initial Channel State

Channels are created with zero initial balance for both participants. To add funds to the channel, use the resize\_channel method after creation. The challenge period is set to 1 hour (3600 seconds) by default.

### Response

Quick Reference

Structures: [Channel](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#channel-structure) • [State](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#state-structure) • [StateAllocation](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#stateallocation)

| Parameter | Type | Description | See Also |
| ----- | ----- | ----- | ----- |
| channel\_id | string | Computed channel identifier (0x-prefixed hex, 32 bytes) | — |
| channel | Channel | On-chain channel params | [↓ Structure](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#channel-structure) |
| state | State | Initial state (intent INITIALIZE, version 0, empty data, zero allocations) | [↓ Structure](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#state-structure) |
| server\_signature | string | Clearnode signature over packed state (hex string) | — |

#### Channel Structure

| Field | Type | Description | Notes |
| ----- | ----- | ----- | ----- |
| participants | wallet address\[\] | Array of two wallet addresses: \[User, Clearnode\] | Order: Index 0 \= User, Index 1 \= Clearnode Order is critical for signature verification |
| adjudicator | wallet address | Adjudicator contract address for this channel | Typically SimpleConsensus for payment channels Validates state transitions during disputes |
| challenge | uint64 | Challenge period in seconds | Default: 3600 seconds (1 hour) |
| nonce | uint64 | Unique identifier for this channel | Ensures channelId uniqueness even with same participants Server-generated timestamp or counter |

Example:

{  
 "participants": \["0x742d35Cc...", "0x123456Cc..."\],  
 "adjudicator": "0xAdjudicator123...",  
 "challenge": 86400,  
 "nonce": 1699123456  
}

#### State Structure

| Field | Type | Description | Notes |
| ----- | ----- | ----- | ----- |
| intent | StateIntent | State purpose indicator | For creation: INITIALIZE (1) |
| version | uint64 | State sequence number | For creation: 0 |
| state\_data | string | State data (hex) | For creation: "0x" |
| allocations | StateAllocation\[\] | Fund allocations (raw units) | Order matches participants array; both 0 on creation |

Example:

{  
 "intent": 1,  
 "version": 0,  
 "state\_data": "0x",  
 "allocations": \[  
   {"participant": "0x742d35Cc...", "token": "0x2791Bca1...", "amount": "0"},  
   {"participant": "0x123456Cc...", "token": "0x2791Bca1...", "amount": "0"}  
 \]  
}

#### StateAllocation Structure

| Field | Type | Description |
| ----- | ----- | ----- |
| participant | string (wallet address) | Participant's wallet address |
| token | string (wallet address) | Token contract address |
| amount | string | Amount in smallest unit (e.g., "100000000" for 100 USDC with 6 decimals) |

Clearnode Signature First

The clearnode provides its signature BEFORE the user commits funds on-chain. This ensures both parties have committed to the channel before any on-chain transaction occurs.

### Next Steps After Receiving Response

1. Verify Channel Data  
   * Recompute channelId \= keccak256(abi.encode(channel))  
   * Verify computed ID matches response channel\_id  
   * Check participants\[0\] is your wallet address  
   * Verify token matches your request  
2. Verify the Clearnode's Signature  
   * Compute packedState \= abi.encode(channelId, state.intent, state.version, state.data, state.allocations)  
   * Recover signer from server\_signature  
   * Verify signer is the clearnode's known wallet address  
3. Sign State with Your Key  
   * Sign packedState with your participant key  
   * Include your signature when submitting to blockchain  
4. Submit On-Chain Transaction  
   * Call Custody.create(channel, state, yourSignature, clearnodeSignature)  
   * Wait for transaction confirmation  
5. Monitor for Channel Creation  
   * Listen for Opened event (emitted right after transaction is mined)  
   * Or poll get\_channels until channel appears with status "open"  
6. Channel Active  
   * Channel appears in get\_channels with status "open"  
   * Channel starts with zero balance  
   * Use resize\_channel to add funds to the channel

### Error Cases

Error Format

The protocol does not use numeric error codes. Errors are returned as method "error" with descriptive messages.

Common error scenarios:

| Error | Description | Recovery |
| ----- | ----- | ----- |
| Authentication required | Not authenticated | Complete [authentication flow](https://docs.yellow.org/docs/protocol/off-chain/authentication) |
| Unsupported chain | chain\_id not supported | Use get\_config |
| Token not supported | Token not in asset config for chain | Use get\_assets |
| Invalid signature | Caller did not sign request | Sign with channel participant wallet |
| Channel already exists | Open channel with broker already exists | Use existing channel or close it first |
| Failed to prepare state | Internal packing/signing issue | Retry or contact support |

### Implementation Notes

* The nonce is generated by the clearnode to ensure uniqueness  
* The channelId can be computed client-side: keccak256(abi.encode(channel))  
* The packedState should be verified: abi.encode(channelId, state.intent, state.version, state.data, state.allocations)  
* Users should verify the clearnode's signature before proceeding  
* The challenge period can be customized but most users should use defaults

### Sequence Diagram

BlockchainClearnodeUserBlockchainClearnodeUser1. Request Channel Creation2. Prepare Channel3. Verify & Sign4. Submit On-Chain5. Create Channel (Status: ACTIVE)Use resize\_channel to add fundscreate\_channel(chain\_id, token)Generate unique nonceCreate channel configCreate initial state (intent: INITIALIZE, version: 0)Sign state{channel, state, server\_signature, channel\_id}Verify Clearnode signatureSign state with participant keyCustody.create(channel, state, signatures)Verify signaturesCreate channel with status ACTIVEEmit Opened eventChannel Active (zero balance)Channel Active (zero balance)  
---

## close\_channel

### Name

close\_channel

### Usage

Initiates cooperative closure of an active payment channel. The clearnode signs a final state with StateIntent.FINALIZE reflecting the current balance distribution. The user receives this clearnode-signed final state which they must submit to the blockchain's Custody contract via the close() function. This is the preferred and most efficient way to close a channel as it requires only one on-chain transaction and completes immediately without a challenge period. Both parties must agree on the final allocation for cooperative closure to work.

### When to Use

When a user wants to withdraw funds from an active channel and both user and the clearnode agree on the final balance distribution. This should be the default closure method when both parties are online and cooperative.

Preferred Closure Method

Cooperative closure is fast (1 transaction), cheap (low gas), and immediate (no waiting period). Always use this method when possible. Challenge-response closure should only be used when the clearnode is unresponsive or disputes the final state.

### Prerequisites

* Channel must exist and be in ACTIVE status  
* User must be authenticated  
* User must have native currency for gas fees  
* Both parties must agree on final allocations (implicitly, by the clearnode signing)

### Request

| Parameter | Type | Required | Description | Default | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| channel\_id | string | Yes | Identifier of the channel to close | \- | "0xabcdef1234567890..." | From get\_channels or stored after creation |
| funds\_destination | string (wallet address) | Yes | Address where your share of channel funds should be sent | \- | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | Typically your wallet address |

### Response

| Parameter | Type | Description | Example | Notes |
| ----- | ----- | ----- | ----- | ----- |
| channel\_id | string | Channel identifier | "0xabcdef1234..." | — |
| state | State | Final state with intent FINALIZE and version \= current+1 state\_data: "0x" allocations: final fund distribution (raw units) | See [State structure](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#state-structure) | channel field is omitted in close responses |
| server\_signature | string | Clearnode signature over packed state | "0xabcdef987654..." | Hex string |

### Next Steps After Receiving Response

1. Verify Final Allocations  
   * Check allocations match expectations  
   * Verify total matches total locked funds  
   * Ensure your allocation is correct  
2. Verify the Clearnode's Signature  
   * Compute packedState \= abi.encode(channelId, state.intent, state.version, state.data, state.allocations)  
   * Verify signature is from the clearnode  
3. Sign Final State  
   * Sign packedState with your participant key  
   * Include your signature when submitting to blockchain  
4. Submit On-Chain  
   * Call Custody.close(channelId, state, yourSignature, clearnodeSignature) on blockchain  
   * Both signatures must be present  
5. Wait for Confirmation  
   * Transaction confirms  
   * Funds distributed according to allocations  
6. Channel Closed  
   * Channel deleted from chain  
   * Funds in your wallet or custody available balance  
7. Withdraw if Needed  
   * If funds in custody, call withdraw() to move to wallet

### Error Cases

Error Format

The protocol does not use numeric error codes. Errors are returned as method "error" with descriptive messages.

Common error scenarios:

| Error | Description | Recovery |
| ----- | ----- | ----- |
| Authentication required | Not authenticated | Re-authenticate |
| Channel not found | Invalid channel\_id | Verify with get\_channels |
| Channel challenged | Participant has challenged channels | Resolve challenges first |
| Channel not open/resizing | Status not open or resizing | Only open/resizing channels can close |
| Invalid signature | Caller did not sign request | Sign with channel participant wallet |
| Token/asset not found | Asset config missing | Ensure channel token is supported |
| Insufficient/negative balance | Ledger balance retrieval or negative balance | Ensure balances are non-negative; retry |
| Failed to pack/sign state | Internal packing/signing issue | Retry or contact support |

### Comparison: Cooperative vs Challenge Closure

| Aspect | Cooperative (this method) | Challenge |
| ----- | ----- | ----- |
| Speed | Fast (1 transaction) | Slow (challenge period \+ 1 transaction) |
| Gas Cost | Low (\~100k gas) | High (\~200k+ gas, 2+ transactions) |
| Requirements | Both parties online & agree | Works if other party unresponsive |
| Waiting Period | None (immediate) | 24+ hours (challenge duration) |
| Use When | Normal operations | Disputes or unresponsiveness |

When to Use Challenge Closure

Only use challenge closure (on-chain challenge() function) when:

* Clearnode is unresponsive  
* Clearnode disputes the final allocation  
* Cooperative closure fails repeatedly

Challenge closure requires waiting for the challenge period to expire before funds are released.

### Implementation Notes

* The StateIntent.FINALIZE (3) signals this is a final state  
* All participants must sign the final state for it to be accepted on-chain  
* The allocations determine where funds go when channel closes  
* Clearnode will only sign if the allocations match the current state of the unified balance  
* After closing, funds are distributed according to the allocations specified  
* Users may need to call withdraw() separately to move funds from custody ledger to their wallet

---

## resize\_channel

### Name

resize\_channel

### Usage

Adjusts the allocations of an existing channel by locking or unlocking funds without closing the channel. Unlike older implementations, this uses the resize() function on the Custody contract to perform an in-place update of the channel's allocations. The same channelId persists throughout the operation, and the channel remains in ACTIVE status. Clearnode prepares a resize state with delta amounts (positive for deposit, negative for withdrawal) that all participants must sign before submitting on-chain.

### When to Use

When a user wants to adjust channel allocations while keeping the same channel active. This is more efficient than closing and reopening, and maintains the channel's history and state version continuity.

In-Place Update

The resize operation updates the channel in place. The channelId stays the same, and the channel remains ACTIVE throughout. This is the current implementation of channel allocation adjustment.

### Prerequisites

* Channel must exist and be in ACTIVE status  
* User must be authenticated  
* Positive deltas require enough available unified balance  
* Negative deltas require sufficient channel balance  
* All participants must sign the resize state (consensus required)  
* User must have native currency for gas fees

### Request

| Parameter | Type | Required | Description | Default | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| channel\_id | string | Yes | Identifier of the channel to resize (stays the same) | \- | "0xabcdef1234567890..." | 0x-prefixed hex string (32 bytes) This channel\_id will NOT change after resize |
| allocate\_amount | string (decimal) | No | Amount to add/remove between unified balance and the channel before resize | 0 | "50.0" | Decimal string; can be used together with resize\_amount; at least one of the two must be non-zero |
| resize\_amount | string (decimal) | No | Delta to apply to the channel: positive to deposit, negative to withdraw | 0 | "75.0" or "-100.0" | Decimal string; can be used together with allocate\_amount; at least one of the two must be non-zero |
| funds\_destination | string (wallet address) | Yes | Destination for the user's allocation in the resize state | \- | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" | 0x-prefixed hex string (20 bytes) |

### Response

| Parameter | Type | Description | Example | Notes |
| ----- | ----- | ----- | ----- | ----- |
| channel\_id | string | Same channel identifier (unchanged) | "0xabcdef1234567890..." | This does NOT change (in-place update) |
| state | State | Resize state to be submitted on-chain • intent \= RESIZE (2) • version \= current+1 • state\_data \= ABI-encoded int256\[2\] of \[resize\_amount, allocate\_amount\] (raw units) • allocations \= final absolute allocations after resize | See [State structure](https://docs.yellow.org/docs/protocol/off-chain/channel-methods#state-structure) | channel field is omitted in resize responses |
| server\_signature | string | Clearnode signature over packed state | "0x9876fedcba..." | Hex string |

### Next Steps After Receiving Response

The client must submit the resize state to the blockchain:

1. Verify the resize state  
   * Check channel\_id matches (should be unchanged)  
   * Verify intent is RESIZE (2)  
   * Confirm version is current \+ 1  
   * Check allocations reflect the requested change  
2. Sign the resize state  
3. packedState \= abi.encode(  
4.  channel\_id,  
     state.intent,      *// StateIntent.RESIZE (2)*  
     state.version,     *// Incremented version*  
     state.data,        *// ABI-encoded int256\[\] deltas*  
     state.allocations  *// Final allocations*  
   )  
   user\_signature \= sign(packedState, participant\_private\_key)

5. Ensure sufficient balance  
   * Positive deltas require enough available unified balance to cover allocate\_amount \+ resize\_amount (after decimals conversion)  
   * Negative deltas require the channel to have sufficient funds being deallocated  
6. Call Custody.resize() on-chain  
7. custody.resize(  
8.  channel\_id,    *// Same channel\_id*  
     state,         *// Resize state*  
     yourSignature,  
     clearnodeSignature  
   )

9. Wait for transaction confirmation  
   * Channel remains ACTIVE (no status change)  
   * Funds locked or unlocked based on delta  
   * Expected deposits updated to new amounts  
10. Monitor for Resized event  
11. event Resized(bytes32 indexed channelId, int256\[\] deltaAllocations)  
    * Emitted when resize completes  
    * Contains the delta amounts applied  
    * Confirms operation success  
12. Update local state  
    * Channel\_id remains the same (no replacement needed)  
    * Unified balance automatically updated  
    * Version incremented

### Error Cases

| Error | Cause | Resolution |
| ----- | ----- | ----- |
| Authentication required | Not authenticated | Complete authentication flow |
| Channel not found | Invalid channel\_id | Verify with get\_channels |
| Channel challenged | Participant has challenged channels | Resolve challenged channels first |
| Operation denied: resize already ongoing | Channel status is resizing | Wait for existing resize to complete |
| Operation denied: channel is not open | Status not open | Only open channels can resize |
| Invalid signature | Caller not among channel signers | Sign request with channel participant |
| Token/asset not found for channel | Asset config missing for channel token/chain | Ensure channel token is supported |
| Resize operation requires non-zero amounts | Both resize\_amount and allocate\_amount are zero | Provide a non-zero value |
| Insufficient unified balance | New channel amount would exceed available balance | Reduce amounts or add funds |
| New channel amount must be positive | Resize would make channel balance negative | Reduce withdrawal |
| Failed to pack resize amounts/state | Internal packing/signing error | Retry; contact support if persistent |

### Resize Scenarios

#### Scenario 1: Depositing Additional Funds

Initial State:

Channel (on Polygon): 20 USDC  
Channel (on Celo): 5 USDC  
Unified balance: 25 USDC total  
Operation:

resize\_channel({  
 channel\_id: "0xCelo\_Channel\_Id",  *// Resize Celo channel*  
 allocate\_amount: "0",  
 resize\_amount: "75.0",  *// Deposit 75 USDC*  
 funds\_destination: "0x742d35Cc..."  *// Required, even for deposits*  
})  
Result:

Channel (on Polygon): 20 USDC (unchanged)  
Channel (on Celo): 80 USDC (5 \+ 75 \= 80)  
Unified balance: 100 USDC total (reduced available balance to fund deposit)  
Same channel\_id on Celo (unchanged)  
---

#### Scenario 2: Withdrawing Funds

Initial State:

Channel (on Polygon): 100 USDC  
Unified balance: 100 USDC total (all locked in channel)  
Operation:

resize\_channel({  
 channel\_id: "0xPolygon\_Channel\_Id",  
 allocate\_amount: "0",  
 resize\_amount: "-100.0",  *// Withdraw all 100 USDC*  
 funds\_destination: "0x742d35Cc..."  *// User's wallet*  
})  
Result:

Channel (on Polygon): 0 USDC (100 \- 100 \= 0)  
Unified balance: 0 USDC  
100 USDC returned to available balance (unified)  
Same channel\_id (unchanged)  
Channel still ACTIVE (can be used again or closed)  
---

#### Scenario 3: Complex Multi-Chain Rebalancing

Initial State:

Channel (on Polygon): 20 USDC  
Channel (on Celo): 80 USDC  
Unified balance: 100 USDC total  
Want to withdraw all on Polygon (100 USDC)  
Operation:

*// First, allocate Celo funds to Polygon channel*  
resize\_channel({  
 channel\_id: "0xPolygon\_Channel\_Id",  
 allocate\_amount: "80.0",  *// Allocate from Celo*  
 resize\_amount: "-100.0",  *// Withdraw 100 total*  
 funds\_destination: "0x742d35Cc..."  
})  
Result:

Channel (on Polygon): 0 USDC  
Channel (on Celo): 0 USDC (deallocated)  
100 USDC withdrawn to user's wallet  
Complex Rebalancing

Multi-chain rebalancing with allocate\_amount is an advanced feature. For simple deposit/withdrawal on a single channel, use only resize\_amount with allocate\_amount \= "0".

### Implementation Notes

* The resize() function operates in place on the same channel  
* channelId never changes (no new channel created)  
* Channel remains in ACTIVE status throughout  
* State version increments like any state update  
* Delta amounts are encoded as int256\[\] in state.data  
* Positive deltas increase channel balance (and reduce available unified balance)  
* Negative deltas decrease channel balance (and increase available unified balance)  
* All participants must sign the resize state (consensus required)  
* More gas-efficient than close \+ reopen  
* Unified balance automatically updated by clearnode  
* Channel history and state continuity preserved

---

## Next Steps

Explore other off-chain operations:

* [Transfers](https://docs.yellow.org/docs/protocol/off-chain/transfers) \- Send instant off-chain payments using unified balance  
* [App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) \- Create multi-party application channels  
* [Queries](https://docs.yellow.org/docs/protocol/off-chain/queries) \- Check channel status, balances, and history

For protocol fundamentals:

* [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication) \- Understand authorization and session management  
* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) \- Learn request/response structure  
* [On-Chain Protocol](https://docs.yellow.org/docs/protocol/on-chain/overview) \- Deep dive into smart contracts

# Transfer Method

Transfer method enable instant, off-chain fund movement between users.

---

## Overview

The transfer system allows users to send funds to each other instantly using their unified balance, without any on-chain transactions. Transfers are backed by the security of underlying payment channels and use double-entry bookkeeping for accounting accuracy.

### Why Use Transfer?

Instant Settlement: Transfers complete immediately with instant finality.

No Blockchain Fees: No blockchain transactions means no gas costs for both sender and recipient.

Cross-Chain Unified: Send from your unified balance across multiple chains.

Auditable: Complete transaction history with double-entry ledger tracking.

Instant Off-Chain Payments

Transfers provide the speed and convenience of traditional payment networks while maintaining the security guarantees of blockchain-backed channels.

---

## transfer

### Name

transfer

### Usage

Transfer funds from the authenticated user's unified balance to another user's unified balance within the Yellow Network. This is a purely off-chain operation, which results in instant settlement. The transfer updates internal ledger entries using double-entry bookkeeping principles and creates a transaction record for both parties. The security guarantee comes from the underlying on-chain channels that back the unified balance.

### When to Use

When sending funds to another Yellow Network user. Common use cases include peer-to-peer payments, merchant payments, tipping.

### Prerequisites

* Sender must be [authenticated](https://docs.yellow.org/docs/protocol/off-chain/authentication)  
* Sender must have sufficient available balance in unified account  
* Recipient must be identified by valid wallet address or user tag

Recipient Requirements

The recipient does not need to have an existing balance or account on the clearnode. Transfers can be sent to any valid wallet address, and the recipient's account will be created automatically on the first login if it doesn't exist.

### Request

| Parameter | Type | Required | Description | Format | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| destination | string (wallet address) | Yes (if destination\_user\_tag not provided) | Recipient's wallet address | 0x-prefixed hex string (20 bytes) | "0x8B3192f2F7b1b34f2e4e7B8C9D1E0F2A3B4C5D6E" | \- |
| destination\_user\_tag | string | Yes (if destination not provided) | Recipient's randomly generated user identifier | Alphanumeric string | "UX123D" | Alternative to address; internal feature, may change |
| allocations | TransferAllocation\[\] | Yes (minimum: 1\) | Assets and amounts to transfer | Array of allocation objects | \[{"asset": "usdc", "amount": "50.0"}\] | See structure below |

#### TransferAllocation Structure

Each allocation in the allocations array specifies an asset and amount to transfer:

| Field | Type | Required | Description | Format | Example |
| ----- | ----- | ----- | ----- | ----- | ----- |
| asset | string | Yes | Asset symbol identifier | Lowercase string | "usdc", "eth", "weth", "btc" |
| amount | string | Yes | Amount to transfer in human-readable format | Decimal string | "50.0", "0.01" |

Notes:

* Asset symbols must be lowercase  
* Use get\_assets method to see all supported assets  
* Amounts are in human-readable format (e.g., "50.0" for 50 USDC)  
* Clearnode handles conversion to smallest unit internally  
* Multiple assets can be transferred in a single operation

Example:

{  
 "allocations": \[  
   {  
     "asset": "usdc",  
     "amount": "50.0"  
   },  
   {  
     "asset": "eth",  
     "amount": "0.01"  
   }  
 \]  
}

### Response

The response contains an array of transactions, with one transaction for each asset being transferred:

| Parameter | Type | Description | Example | Notes |
| ----- | ----- | ----- | ----- | ----- |
| transactions | LedgerTransaction\[\] | Array of transaction objects for each asset | See below | One transaction per asset transferred |

LedgerTransaction Structure (per transaction):

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| id | number | Numeric transaction identifier | 1 |
| tx\_type | string | Transaction type | "transfer" |
| from\_account | string | Sender account identifier (wallet/app session/channel) | "0x1234567890abcdef..." |
| from\_account\_tag | string | Sender's user tag (if exists) | "NQKO7C" |
| to\_account | string | Recipient account identifier | "0x9876543210abcdef..." |
| to\_account\_tag | string | Recipient's user tag (if exists) | "UX123D" |
| asset | string | Asset symbol that was transferred | "usdc" |
| amount | string | Amount transferred for this asset (decimal string) | "50.0" |
| created\_at | string | ISO 8601 timestamp | "2023-05-01T12:00:00Z" |

Example Response:

{  
 "transactions": \[  
   {  
     "id": 1,  
     "tx\_type": "transfer",  
     "from\_account": "0x1234567890abcdef...",  
     "from\_account\_tag": "NQKO7C",  
     "to\_account": "0x9876543210abcdef...",  
     "to\_account\_tag": "UX123D",  
     "asset": "usdc",  
     "amount": "50.0",  
     "created\_at": "2023-05-01T12:00:00Z"  
   },  
   {  
     "id": 2,  
     "tx\_type": "transfer",  
     "from\_account": "0x1234567890abcdef...",  
     "from\_account\_tag": "NQKO7C",  
     "to\_account": "0x9876543210abcdef...",  
     "to\_account\_tag": "UX123D",  
     "asset": "eth",  
     "amount": "0.1",  
     "created\_at": "2023-05-01T12:00:00Z"  
   }  
 \]  
}  
---

## Off-Chain Processing

When a transfer is executed, the clearnode performs the following operations:

Client BServiceClient AClient B (Recipient)ClearnodeClient A (Sender)Client B (Recipient)ClearnodeClient A (Sender)1. Send Transfer Request2. Validate3. Update Ledger4. Send Responses & Notifications5. Balance Updatedtransfer({ destination, allocations })Verify authenticationCheck available balanceValidate allocationsCreate debit entry (Alice \-50 USDC)Create credit entry (Bob \+50 USDC)Record transactionBalance \+50 USDCtr (transfer) notificationbu (balance update) notificationtr (transfer) notificationbu (balance update) notificationresponse

### Step-by-Step Process

#### 1\. Validates Request

The clearnode performs comprehensive validation:

* Verifies authentication and signature  
* Checks sender has sufficient available balance in unified account  
* Validates allocations format and asset support

#### 2\. Updates Ledger (Double-Entry Bookkeeping)

Every transfer creates two ledger entries \- one for the sender and one for the recipient. The ledger uses double-entry bookkeeping principles where each entry has both credit and debit fields, with amounts always recorded as positive values.

Double-Entry Bookkeeping

The double-entry system ensures that the total of all debits always equals the total of all credits, providing mathematical proof of accounting accuracy. Every transfer is recorded twice \- once as a debit to the sender's account and once as a credit to the recipient's account.

#### 3\. Records Transaction

A user-facing transaction record is created for each asset being transferred, containing information about the sender, recipient, asset, and amount.

#### 4\. Sends Notifications

* Both parties receive tr (transfer) notification with transaction details  
* Both parties receive bu (balance update) notification with updated balances

#### 5\. Response

* Sender receives response with transaction details

---

## Unified Balance Mechanics

The unified balance aggregates funds from all chains.

### Example: Multi-Chain Aggregation

User deposited:  
 $10 USDC on Ethereum  
 $5 USDC on Polygon  
 $3 USDC on Base

Unified Balance: $18 USDC total

User can transfer: Any amount up to $18 USDC

### Account Types

The ledger system maintains three types of accounts:

1. Unified Account: Main account identified by wallet address. This is where user funds are stored and can be transferred or withdrawn.  
2. App Session Account: Identified by app session ID. Participant wallets are beneficiaries of this account. Funds in app sessions are locked for the duration of the session.  
3. Channel Escrow Account: Temporary account that locks funds when user requests blockchain operations like resize. Funds remain in this account until the transaction is confirmed on-chain.

---

## Transaction History Query Methods

Users can query their transfer history using two methods for different levels of detail.

---

### get\_ledger\_transactions

Retrieves user-facing transaction log with sender, recipient, amount, and type. This endpoint provides a view of transactions where the specified account appears as either the sender or receiver.

Public Endpoint

This is a public endpoint \- authentication is not required.

#### Request

| Parameter | Type | Required | Description | Format | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| account\_id | string | No | Filter by account ID (wallet, app session, or channel) | Hex string or ID | "0x1234567890abcdef..." | Returns transactions for this account |
| asset | string | No | Filter by asset symbol | Lowercase string | "usdc" | Returns transactions for this asset only |
| tx\_type | string | No | Filter by transaction type | transfer, deposit, withdrawal, app\_deposit, app\_withdrawal, escrow\_lock, escrow\_unlock | "transfer" | Returns only this type of transaction |
| offset | number | No | Pagination offset | 0 | 42 | Defaults to 0 |
| limit | number | No | Number of transactions to return | 10 (max 100\) | 10 | Defaults to 10 if omitted |
| sort | string | No | Sort order by created\_at | "asc" or "desc" | "desc" | Default: "desc" |

#### Response

| Parameter | Type | Description |
| ----- | ----- | ----- |
| ledger\_transactions | LedgerTransaction\[\] | Array of transaction objects |

LedgerTransaction Structure:

| Field | Type | Description |
| ----- | ----- | ----- |
| id | number | Unique transaction reference |
| tx\_type | string | Transaction type |
| from\_account | string | Sender account identifier |
| from\_account\_tag | string | Sender's user tag (empty if none) |
| to\_account | string | Recipient account identifier |
| to\_account\_tag | string | Recipient's user tag (empty if none) |
| asset | string | Asset symbol |
| amount | string | Transaction amount (decimal string) |
| created\_at | string | ISO 8601 timestamp |

---

### get\_ledger\_entries

Retrieves detailed accounting entries showing all debits and credits. This endpoint provides double-entry bookkeeping records for detailed reconciliation and audit trails.

Public Endpoint

This is a public endpoint \- authentication is not required.

#### Request

| Parameter | Type | Required | Description | Format | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| account\_id | string | No | Filter by account ID (wallet/app session/channel) | Hex string or ID | "0x1234567890abcdef..." | Returns entries for this account |
| wallet | string | No | Filter by participant wallet | 0x-prefixed hex string (20 bytes) | "0x1234567890abcdef..." | Returns entries for this participant |
| asset | string | No | Filter by asset symbol | Lowercase string | "usdc" | Returns entries for this asset only |
| offset | number | No | Pagination offset | 0 | 42 | Defaults to 0 |
| limit | number | No | Number of entries to return | 10 (max 100\) | 10 | Defaults to 10 if omitted |
| sort | string | No | Sort order by created\_at | "asc" or "desc" | "desc" | Default: "desc" |

#### Response

| Parameter | Type | Description |
| ----- | ----- | ----- |
| ledger\_entries | LedgerEntry\[\] | Array of ledger entry objects |

LedgerEntry Structure:

| Field | Type | Description |
| ----- | ----- | ----- |
| id | number | Unique entry ID |
| account\_id | string | Account identifier |
| account\_type | number | Account type (1000\=asset, 2000\=liability, etc.) |
| asset | string | Asset symbol |
| participant | string | Participant wallet address |
| credit | string | Credit amount (positive value or "0.0") |
| debit | string | Debit amount (positive value or "0.0") |
| created\_at | string | ISO 8601 timestamp |

---

## Implementation Notes

Performance:

* Transfers are instant (\< 1 second) and atomic  
* No blockchain transaction required  
* No blockchain fees

Features:

* Unified balance is updated immediately  
* Transfer can include multiple assets in one operation  
* Transaction IDs can be used to track and query transfer status via get\_ledger\_transactions

Audit Trail:

* Clearnode maintains complete audit trail of all transfers  
* Double-entry bookkeeping ensures mathematical accuracy  
* All records queryable via get\_ledger\_\* methods

---

## Next Steps

Explore other off-chain operations:

* [App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) \- Create multi-party application channels  
* [Queries & Notifications](https://docs.yellow.org/docs/protocol/off-chain/queries) \- Check balances, transactions, and receive updates  
* [Channel Methods](https://docs.yellow.org/docs/protocol/off-chain/channel-methods) \- Manage payment channels

For protocol fundamentals:

* [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication) \- Understand authorization and session management  
* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) \- Learn request/response structure

# App Session Methods

App sessions enable multi-party applications with custom governance rules, allowing complex interactions on top of payment channels.

---

## Overview

App sessions are off-chain channels built on top of the unified balance, intended for app developers to create application-specific interactions. They act as a "box" or shared account where multiple participants can transfer funds and execute custom logic with governance rules.

### Key Features

Multi-Party Governance: Define custom voting weights and quorum rules for state updates.

Application-Specific State: Store arbitrary application data (game state, escrow conditions, etc.).

Flexible Fund Management: Transfer, redistribute, add, or withdraw funds during session lifecycle.

Instant Updates: All state changes happen off-chain with zero gas fees.

For App Developers

App sessions are specifically designed for app developers building trustless multi-party applications like games, prediction markets, escrow, and collaborative finance.

---

## Protocol Versions

App sessions support multiple protocol versions for backward compatibility.

### Version Comparison

| Feature | NitroRPC/0.2 (Legacy) | NitroRPC/0.4 (Current) |
| ----- | ----- | ----- |
| State Updates | Basic only | Intent-based (OPERATE, DEPOSIT, WITHDRAW) |
| Add Funds to Active Session | ❌ No | ✅ Yes (DEPOSIT intent) |
| Remove Funds from Active Session | ❌ No | ✅ Yes (WITHDRAW intent) |
| Fund Redistribution | ✅ Yes | ✅ Yes (OPERATE intent) |
| Error Handling | Basic | Enhanced validation |
| Modify Total Funds | Must close & recreate | Can update during session |
| Recommended For | Legacy support only | All new implementations |

Protocol Version Selection

The protocol version is specified in the app definition during creation and cannot be changed for an existing session. Always use NitroRPC/0.4 for new app sessions.

---

## create\_app\_session

### Name

create\_app\_session

### Usage

Creates a new virtual application session on top of the unified balance. An app session is a "box" or shared account where multiple participants can transfer funds and execute application-specific logic with custom governance rules. The app definition specifies participants, their voting weights, quorum requirements for state updates, and the protocol version. Funds are transferred from participants' unified balance accounts to a dedicated App Session Account for the duration of the session. App sessions enable complex multi-party applications like games, prediction markets, escrow, and collaborative finance—all operating off-chain with instant state updates and zero gas fees.

### When to Use

When multiple participants need to interact with shared funds and application state in a trustless manner. Examples include turn-based games, betting pools, escrow arrangements, DAOs, prediction markets, and any application requiring multi-signature state management.

### Prerequisites

* All participants with non-zero initial allocations must be [authenticated](https://docs.yellow.org/docs/protocol/off-chain/authentication)  
* All such participants must have sufficient available balance  
* All such participants must sign the creation request  
* Protocol version must be supported (NitroRPC/0.2 or NitroRPC/0.4)

### Request

Quick Reference

Common structures: [AppDefinition](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#appdefinition) • [Allocation](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#allocation)

| Parameter | Type | Required | Description | See Also |
| ----- | ----- | ----- | ----- | ----- |
| definition | AppDefinition | Yes | Configuration defining the app session rules and participants | [↓ Structure](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#appdefinition) |
| allocations | Allocation\[\] | Yes | Initial funds to transfer from participants' unified balance accounts | [↓ Structure](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#allocation) |
| session\_data | string | No | Application-specific initial state (JSON string, max 64KB recommended) This is application-specific; protocol doesn't validate content | — |

#### Session Identifier

app\_session\_id is derived deterministically from the entire App definition:

appSessionId \= keccak256(JSON.stringify({  
 application: "...",  
 protocol: "NitroRPC/0.4",  
 participants: \[...\],  
 weights: \[...\],  
 quorum: 100,  
 challenge: 86400,  
 nonce: 123456  
}))

* Includes application, protocol, participants, weights, quorum, challenge, and nonce  
* Does not include chainId because sessions live entirely off-chain  
* Client can recompute locally to verify clearnode responses  
* nonce uniqueness is critical: same definition ⇒ same ID

Implementation reference: clearnode/app\_session\_service.go.

#### AppDefinition

| Field | Type | Required | Description | Default | Allowed Values | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| protocol | string | Yes | Protocol version for this app session | — | "NitroRPC/0.2" | "NitroRPC/0.4" | Version cannot be changed after creation; use 0.4 for new sessions |
| participants | address\[\] | Yes | Array of all participant wallet addresses | — | Min: 2 participants | Order is important \- indices used for signatures and weights Last participant often represents the application/judge |
| weights | int64\[\] | Yes | Voting power for each participant | — | — | Length must match participants array Order corresponds to participants array Absolute values matter for quorum; don't need to sum to 100 |
| quorum | uint64 | Yes | Minimum total weight required to approve state updates | — | — | Sum of signers' weights must be ≥ quorum |
| challenge | uint64 | No | Challenge period in seconds for disputes | 86400 (24 hours) | — | Only relevant if app session state is ever checkpointed on-chain |
| nonce | uint64 | Yes | Unique identifier | — | — | Typically timestamp; ensures uniqueness |

Example:

{  
 "protocol": "NitroRPC/0.4",  
 "participants": \["0x742d35Cc...", "0x8B3192f2...", "0x456789ab..."\],  
 "weights": \[50, 50, 100\],  
 "quorum": 100,  
 "challenge": 3600,  
 "nonce": 1699123456789  
}

#### Allocation

| Field | Type | Required | Description |
| ----- | ----- | ----- | ----- |
| participant | address | Yes | Participant wallet address (must be in definition.participants) |
| asset | string | Yes | Asset identifier (e.g., "usdc") |
| amount | string | Yes | Amount in human-readable format (e.g., "100.0") |

Example:

\[  
     {"participant": "0x742d35Cc...", "asset": "usdc", "amount": "100.0"},  
     {"participant": "0x8B3192f2...", "asset": "usdc", "amount": "100.0"},  
     {"participant": "0x456789ab...", "asset": "usdc", "amount": "0.0"}  
   \]  
Note: Participants with zero allocation don't need to sign creation.

### Response

| Parameter | Type | Description | Format/Structure | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| app\_session\_id | string | Unique identifier for the created app session | 0x-prefixed hex string (32 bytes) | "0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba" | Use this for all subsequent operations on this session |
| status | string | App session status | "open" | "open" | Values: "open" or "closed" |
| version | number | Current state version | 1 | 1 | Always starts at 1 |

The Go service returns only these fields on creation. To fetch full metadata (application, participants, quorum, weights, session\_data, protocol, challenge, nonce, timestamps), call [get\_app\_sessions](https://docs.yellow.org/docs/protocol/off-chain/queries#get_app_sessions) after creation.

---

## Governance Models

App sessions support flexible governance through custom weights and quorum configurations.

### Example 1: Simple Two-Player Game

Participants: \[Alice, Bob\]  
Weights: \[1, 1\]  
Quorum: 2

Result: Both players must sign every state update  
Use case: Chess, poker, betting between two parties  
Governance: Cooperative \- both parties must agree to all changes.

### Example 2: Game with Judge

Participants: \[Alice, Bob, Judge\]  
Weights: \[0, 0, 100\]  
Quorum: 100

Result: Only judge can update state  
Use case: Games where application determines outcome  
Governance: Authoritative \- application/judge has full control.

### Example 3: Multi-Party Escrow

Participants: \[Buyer, Seller, Arbiter\]  
Weights: \[40, 40, 50\]  
Quorum: 80

Result: Any 2 parties can approve  
 \- Buyer \+ Seller (80)  
 \- Buyer \+ Arbiter (90)  
 \- Seller \+ Arbiter (90)  
Use case: Escrowed transactions with dispute resolution  
Governance: Flexible 2-of-3 \- any two can proceed, preventing single-party blocking.

### Example 4: DAO-like Voting

Participants: \[User1, User2, User3, User4, Contract\]  
Weights: \[20, 25, 30, 25, 0\]  
Quorum: 51

Result: Majority of weighted votes required (51 out of 100)  
Use case: Collaborative funds management  
Governance: Weighted majority \- decisions require majority approval by stake.

### Example 5: Watch Tower

Participants: \[Alice, Bob, WatchTower\]  
Weights: \[40, 40, 100\]  
Quorum: 80

Result:  
 \- Normal operation: Alice \+ Bob (80)  
 \- Emergency: WatchTower alone (100)  
Use case: Automated monitoring and intervention  
Governance: Dual-mode \- normal requires cooperation, emergency allows automated action.

Governance Flexibility

By adjusting weights and quorum, you can implement any governance model from fully cooperative (all must sign) to fully authoritative (single party controls) to complex weighted voting systems.

---

## Fund Transfer Mechanics

When an app session is created, funds are transferred from the unified balance account to a dedicated App Session Account:

create\_app\_session  
Alice's Unified Account  
Balance: 200 USDC  
Create App Session  
Alice transfers 100 USDC  
Alice's Unified Account  
Balance: 100 USDC  
App Session Account  
Balance: 100 USDC  
(Beneficiary: Alice)  
Balance State Changes:

Before Creation:  
 Alice's Unified Account:  
   Balance: 200 USDC

After Creating Session with 100 USDC:  
 Alice's Unified Account:  
   Balance: 100 USDC

 App Session Account:  
   Balance: 100 USDC (Beneficiary: Alice)

### Signature Requirements

All participants with non-zero initial allocations MUST sign the create\_app\_session request. The clearnode validates that:

1. All required signatures are present  
2. Signatures are valid for respective participants  
3. Total weight of signers \>= quorum (must be met for creation)

---

## submit\_app\_state

### Name

submit\_app\_state

### Usage

Submits a state update for an active app session. State updates can redistribute funds between participants (OPERATE intent), add funds to the session (DEPOSIT intent), or remove funds from the session (WITHDRAW intent). The intent system is only available in NitroRPC/0.4; version 0.2 sessions only support fund redistribution without explicit intent. Each state update increments the version number, and must be signed by participants whose combined weights meet the quorum requirement. The allocations field always represents the FINAL state after the operation, not the delta.

### When to Use

During app session lifecycle to update the state based on application logic. Examples include recording game moves, updating scores, reallocating funds based on outcomes, adding stakes, or partially withdrawing winnings.

### Prerequisites

* App session must exist and be in "open" status  
* Signers must meet quorum requirement  
* For DEPOSIT intent: Depositing participant must sign (in addition to quorum)  
* For DEPOSIT intent: Depositing participant must have sufficient available balance  
* For WITHDRAW intent: Session must have sufficient funds to withdraw  
* NitroRPC/0.4: version must be exactly current\_version \+ 1  
* NitroRPC/0.2: omit intent and version (service rejects them); only OPERATE-style redistribution is supported  
* If using a session key, spending allowances for that key are enforced

### Request

| Parameter | Type | Required | Description | Format | Example | Notes / See Also |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| app\_session\_id | string | Yes | Identifier of the app session to update | 0x-prefixed hex string (32 bytes) | "0x9876543210fedcba..." | \- |
| intent | string | Yes for v0.4, No for v0.2 | Type of operation (NitroRPC/0.4 only) | Allowed: "operate" | "deposit" | "withdraw" | "operate" | Omit for NitroRPC/0.2 sessions (treated as operate) |
| version | number | Yes | Expected next version number | \- | 2 | Must be exactly currentVersion \+ 1; prevents conflicts |
| allocations | Allocation\[\] | Yes | FINAL allocation state after this update ⚠️ IMPORTANT: This is the target state, NOT the delta | See [Allocation](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#allocation) above | After operate from \[100, 100\] where Alice loses 25 to Bob: \[{"participant": "0xAlice", "asset": "usdc", "amount": "75.0"}, {"participant": "0xBob", "asset": "usdc", "amount": "125.0"}\] | Clearnode validates based on intent rules (see below) |
| session\_data | string | No | Updated application-specific state | JSON string | "{\\"currentMove\\":\\"e2e4\\",\\"turn\\":\\"black\\"}" | Can be updated independently of allocations |

### Response

| Parameter | Type | Description | Format/Structure | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| app\_session\_id | string | Session identifier (echoed) | \- | \- | \- |
| version | number | Confirmed new version number | \- | 2 | \- |
| status | string | Updated session status | "open" | "open" | Minimal response (no metadata echoed) |

The Go handler returns an AppSessionResponse type, but for state submissions it only includes app\_session\_id, version, and status (and does not echo session metadata). Use [get\_app\_sessions](https://docs.yellow.org/docs/protocol/off-chain/queries#get_app_sessions) to read the full session record.

---

## Intent System (NitroRPC/0.4)

The intent system defines the type of operation being performed. Each intent has specific validation rules.

### Intent: OPERATE (Redistribute Existing Funds)

Purpose: Move funds between participants without changing total amount in session.

Rules:

* Sum of allocations MUST equal sum before operation  
* No funds added or removed from session  
* Quorum requirement MUST be met  
* Depositing participant signature NOT required

Example:

Current state (version 1):  
 Alice: 100 USDC  
 Bob: 100 USDC  
 Total: 200 USDC

Update (version 2, intent: "operate"):  
 Allocations: \[  
   {"participant": "0xAlice", "asset": "usdc", "amount": "75.0"},  
   {"participant": "0xBob", "asset": "usdc", "amount": "125.0"}  
 \]

Result:  
 Alice: 75 USDC (-25)  
 Bob: 125 USDC (+25)  
 Total: 200 USDC (unchanged) ✓

Validation: Sum before (200) \== Sum after (200) ✓  
Use Cases:

* Record game outcome (winner gets opponent's stake)  
* Update prediction market positions  
* Rebalance shared pool  
* Penalize or reward participants

OPERATE Intent

Use OPERATE for simple fund redistributions within the session. The total amount remains constant—funds just move between participants.

---

### Intent: DEPOSIT (Add Funds to Session)

Purpose: Add funds from a participant's unified balance into the session.

Rules:

* Sum of allocations MUST be greater or equal to sum before operation  
* Increase MUST come from available balance of depositing participant  
* Depositing participant MUST sign (even if quorum is met without them)  
* Quorum requirement MUST still be met  
* Allocations show FINAL amounts (not delta)  
* If signed via a session key, spending caps for that key are enforced

Example:

Current state (version 1):  
 Alice: 100 USDC  
 Bob: 100 USDC  
 Total: 200 USDC

Alice's Unified Balance:  
 Available: 50 USDC

Update (version 2, intent: "deposit"):  
 Allocations: \[  
   {"participant": "0xAlice", "asset": "usdc", "amount": "150.0"},  
   {"participant": "0xBob", "asset": "usdc", "amount": "100.0"}  
 \]  
 Signatures: \[AliceSig, QuorumSigs...\]

Calculation:  
 Alice deposit amount \= 150 (new) \- 100 (old) \= 50 USDC

Result:  
 Alice: 150 USDC (100 \+ 50 deposited)  
 Bob: 100 USDC (unchanged)  
 Total: 250 USDC (+50) ✓

Alice's Unified Balance After:  
 Available: 0 USDC (50 transferred to App Session Account)

App Session Account After:  
 Balance: 250 USDC (increased by 50)

Validation:  
 \- Sum after (250) \> Sum before (200) ✓  
 \- Alice signed ✓  
 \- Alice had 50 available ✓  
Use Cases:

* Top up game stake mid-game  
* Add collateral to escrow  
* Increase position in prediction market  
* Buy into ongoing game

DEPOSIT Intent

Critical Understanding: The allocations array shows FINAL amounts, not the deposit amount. The clearnode calculates the deposit by comparing previous and new allocations for each participant.

---

### Intent: WITHDRAW (Remove Funds from Session)

Purpose: Remove funds from session back to a participant's unified balance.

Rules:

* Sum of allocations MUST be less or equal to sum before operation  
* Decrease is returned to participant's available balance  
* Withdrawing participant signature NOT specifically required (quorum sufficient)  
* Quorum requirement MUST be met  
* Allocations show FINAL amounts (not delta)

Example:

Current state (version 1):  
 Alice: 150 USDC  
 Bob: 100 USDC  
 Total: 250 USDC

Update (version 2, intent: "withdraw"):  
 Allocations: \[  
   {"participant": "0xAlice", "asset": "usdc", "amount": "150.0"},  
   {"participant": "0xBob", "asset": "usdc", "amount": "75.0"}  
 \]  
 Signatures: \[QuorumSigs...\]

Calculation:  
 Bob withdrawal amount \= 100 (old) \- 75 (new) \= 25 USDC

Result:  
 Alice: 150 USDC (unchanged)  
 Bob: 75 USDC (100 \- 25 withdrawn)  
 Total: 225 USDC (-25) ✓

Bob's Unified Balance After:  
 Available: \+25 USDC

App Session Account After:  
 Balance: 225 USDC (decreased by 25)

Validation:  
 \- Sum after (225) \< Sum before (250) ✓  
 \- Quorum met ✓  
Use Cases:

* Cash out partial winnings mid-game  
* Remove collateral when no longer needed  
* Take profits from shared investment  
* Reduce stake in ongoing game

---

## Version Management

* NitroRPC/0.4: each update MUST be exactly previous\_version \+ 1, or it is rejected.  
* NitroRPC/0.2: omit intent and version; providing either results in "incorrect request: specified parameters are not supported in this protocol".

---

## Quorum Validation

For every update, the clearnode validates quorum:

Yes  
No  
Receive State Update  
Calculate Total Weight  
Sum weights of all signers  
Total Weight \>= Quorum?  
✓ Update Accepted  
✗ Reject: Quorum Not Met  
Validation Logic:

totalWeight \= sum of weights for all signers  
if (totalWeight \>= definition.quorum) {  
 ✓ Update accepted  
} else {  
 ✗ Reject: "Quorum not met"  
}  
Example (using Game with Judge scenario):

Participants: \[Alice, Bob, Judge\]  
Weights: \[0, 0, 100\]  
Quorum: 100

Valid signature combinations:  
 \- Judge alone: weight \= 100 \>= 100 ✓  
 \- Alice \+ Bob: weight \= 0 \>= 100 ✗  
 \- Alice \+ Bob \+ Judge: weight \= 100 \>= 100 ✓  
---

## close\_app\_session

### Name

close\_app\_session

### Usage

Closes an active app session and distributes all funds from the App Session Account according to the final allocations. Once closed, the app session cannot be reopened; participants must create a new session if they want to continue. The final allocations determine how funds are returned to each participant's unified balance account. Closing requires quorum signatures. The final session\_data can record the outcome or final state of the application. All funds in the App Session Account are released immediately.

### When to Use

When application logic has completed and participants want to finalize the outcome and retrieve their funds. Examples include game ending, escrow condition met, prediction market settled, or any application reaching its natural conclusion.

### Prerequisites

* App session must exist and be in "open" status  
* Signers must meet quorum requirement  
* Final allocations must not exceed total funds in session  
* Sum of final allocations must equal total session funds

### Request

| Parameter | Type | Required | Description | Format/Structure | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| app\_session\_id | string | Yes | Identifier of the app session to close | 0x-prefixed hex string (32 bytes) | "0x9876543210fedcba..." | \- |
| allocations | Allocation\[\] | Yes | Final distribution of all funds in the session IMPORTANT: Must account for ALL funds; sum must equal session total Structure (per allocation): • participant (address) \- Participant wallet address • asset (string) \- Asset identifier • amount (string) \- Final amount for this participant | See structure | 200 USDC total, winner takes most: \[{"participant": "0xAlice", "asset": "usdc", "amount": "180.0"}, {"participant": "0xBob", "asset": "usdc", "amount": "15.0"}, {"participant": "0xJudge", "asset": "usdc", "amount": "5.0"}\] | Can allocate zero to participants (they get nothing) |
| session\_data | string | No | Final application state or outcome record | JSON string | "{\\"result\\":\\"Alice wins\\",\\"finalScore\\":\\"3-1\\"}" | Useful for recording outcome for history/analytics |

### Response

| Parameter | Type | Description | Format/Structure | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| app\_session\_id | string | Session identifier (echoed) | \- | \- | \- |
| status | string | Final status | Value: "closed" | "closed" | Minimal response |
| version | number | New session version | \- | 2 | Incremented on close |

close\_app\_session response

The handler returns an AppSessionResponse type in Go, but on close it only populates app\_session\_id, status, and version. For full metadata after closure, query [get\_app\_sessions](https://docs.yellow.org/docs/protocol/off-chain/queries#get_app_sessions).

---

## Fund Distribution on Closure

When an app session closes, funds return to participants' unified balances:

Before Closure:  
 Alice's Unified Account:  
   Balance: 100 USDC

App Session Account 0x98765:  
 Alice: 100 USDC  
 Bob: 100 USDC  
 Total: 200 USDC

Close with final allocations:  
 Alice: 180 USDC  
 Bob: 20 USDC

After Closure:  
 Alice's Unified Account:  
   Balance: 280 USDC (100 \+ 180 received from session)  
    
 Bob's Unified Account:  
   Balance: 20 USDC (received from session)

 App Session Account 0x98765:  
   Closed (Balance: 0 USDC)

### Allocation Rules

1. Must Sum to Total:  
   * sum(final\_allocations) MUST equal sum(current\_allocations)  
   * Clearnode validates this; cannot create or destroy funds during close  
2. Can Be Zero:  
   * Participants can receive zero in final allocation (lost everything)  
   * Example: Losing player in a winner-takes-all game  
3. Accounting for Participants:  
   * It is recommended to include an entry for every participant (use zero for losers).  
   * If you omit a participant, the service treats them as receiving zero, as long as per-asset totals still match the session balance.  
4. Can Include Non-Financial Participants:  
   * Example: Judge/application can receive commission  
   * {"participant": "0xJudge", "asset": "usdc", "amount": "5.0"}

---

## Closure Examples

### Example 1: Chess Game

Initial:  
 White: 100 USDC  
 Black: 100 USDC  
 Judge: 0 USDC  
 Total: 200 USDC

Final (White wins):  
 White: 190 USDC (won 90)  
 Black: 0 USDC (lost 100)  
 Judge: 10 USDC (5% commission)  
 Total: 200 USDC ✓

### Example 2: Escrow (Buyer Satisfied)

Initial:  
 Buyer: 100 USDC  
 Seller: 0 USDC  
 Arbiter: 0 USDC  
 Total: 100 USDC

Final (Successful delivery):  
 Buyer: 0 USDC  
 Seller: 99 USDC (payment)  
 Arbiter: 1 USDC (fee)  
 Total: 100 USDC ✓

### Example 3: Escrow (Dispute, Buyer Refunded)

Initial:  
 Buyer: 100 USDC  
 Seller: 0 USDC  
 Arbiter: 0 USDC  
 Total: 100 USDC

Final (Arbiter ruled for buyer):  
 Buyer: 95 USDC (refund minus fee)  
 Seller: 0 USDC  
 Arbiter: 5 USDC (dispute fee)  
 Total: 100 USDC ✓

### Example 4: Prediction Market

Initial:  
 User1: 50 USDC (bet YES)  
 User2: 50 USDC (bet YES)  
 User3: 40 USDC (bet NO)  
 Oracle: 0 USDC  
 Total: 140 USDC

Final (Outcome: YES):  
 User1: 68.25 USDC (split pot proportionally)  
 User2: 68.25 USDC  
 User3: 0 USDC (lost)  
 Oracle: 3.50 USDC (2.5% fee)  
 Total: 140 USDC ✓  
Final Distribution

All participants receive funds according to the final allocations, whether they won, lost, or served as neutral parties (judges, arbiters, oracles). The total is always preserved.

---

---

## Implementation Notes

State Management:

* Always use intent: "operate" for simple redistributions  
* Always specify FINAL allocations, never deltas  
* The clearnode computes deltas internally by comparing with previous state  
* Version numbers must be strictly sequential  
* The session\_data field can be updated in any intent

Performance:

* Updates are instant (\< 1 second) and off-chain  
* Zero gas fees for all operations  
* All updates are logged for audit trail

Notifications:

* Participants are notified on all active connections of state changes  
* Closed sessions remain queryable for history

Irreversibility:

* Closure is instant and atomic  
* All funds released simultaneously  
* Once closed, cannot be reopened  
* To continue, create a new session

---

## Next Steps

Explore other protocol features:

* [Queries & Notifications](https://docs.yellow.org/docs/protocol/off-chain/queries) \- Query session history and receive real-time updates  
* [Transfers](https://docs.yellow.org/docs/protocol/off-chain/transfers) \- Move funds between unified balances  
* [Channel Methods](https://docs.yellow.org/docs/protocol/off-chain/channel-methods) \- Manage underlying payment channels

For foundational concepts:

* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) \- Understand request/response structure  
* [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication) \- Manage session keys and security

# Query Methods & Notifications

Query methods retrieve information from a clearnode, while notifications provide real-time updates about state changes.

---

## Overview

The Nitro RPC protocol provides two types of information retrieval:

Query Methods: Client-initiated requests to retrieve current state information (balances, channels, sessions, transactions).

Notifications: Server-initiated messages sent to all relevant active connections when events occur (balance changes, channel updates, incoming transfers).

Real-Time Updates

Combine query methods for initial state retrieval with notifications for ongoing monitoring. This pattern ensures your application always reflects the latest state without constant polling.

---

## Query Methods Summary

| Method | Authentication | Purpose | Pagination |
| ----- | ----- | ----- | ----- |
| get\_config | Public | Retrieve clearnode configuration | No |
| get\_assets | Public | List supported assets | No |
| get\_app\_definition | Public | Fetch the definition for a specific app session | No |
| get\_channels | Public | List payment channels | Yes |
| get\_app\_sessions | Public | List app sessions | Yes |
| get\_ledger\_balances | Private | Query current balances | No |
| get\_ledger\_entries | Public | Detailed accounting entries | Yes |
| get\_ledger\_transactions | Public | User-facing transaction history | Yes |
| get\_rpc\_history | Private | Fetch recent RPC invocations | Yes |
| get\_user\_tag | Private | Retrieve user's alphanumeric tag | No |
| get\_session\_keys | Private | List active session keys | Yes |
| ping | Public | Connection health check | No |

Authentication

Public methods can be called without authentication. Private methods require completing the [authentication flow](https://docs.yellow.org/docs/protocol/off-chain/authentication) first.

Pagination defaults

Unless explicitly provided, paginated methods default to limit \= 10 (maximum 100\) and offset \= 0, matching the broker’s ListOptions.

---

## get\_config

### Name

get\_config

### Usage

Retrieves the clearnode's configuration: broker address plus supported blockchains and their custody/adjudicator contracts.

### Request

No parameters.

### Response

| Parameter | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| broker\_address | string | Clearnode's wallet address | "0xbbbb567890abcdef..." |
| networks | array\<BlockchainInfo\> | List of supported blockchain networks | See structure below |

#### BlockchainInfo Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| chain\_id | uint32 | Network identifier | 137 (Polygon) |
| name | string | Human-readable blockchain name | "Polygon" |
| custody\_address | string | Custody contract address on this chain | "0xCustodyContractAddress..." |
| adjudicator\_address | string | Adjudicator contract address on this chain | "0xAdjudicatorAddress..." |

Use Cases:

* Discover supported chains and contract addresses  
* Verify clearnode wallet address

---

## get\_assets

### Name

get\_assets

### Usage

Retrieves all supported assets and their configurations across supported blockchains.

### Request

| Parameter | Type | Required | Description | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| chain\_id | uint32 | No | Filter by specific chain | 137 | If omitted, returns assets for all chains |

### Response

| Parameter | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| assets | array\<Asset\> | List of supported assets | See structure below |

#### Asset Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| token | string | Token contract address | "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" |
| chain\_id | uint32 | Blockchain network identifier | 137 |
| symbol | string | Token symbol | "usdc" |
| decimals | uint8 | Number of decimal places | 6 |

Use Cases:

* Display supported assets in UI  
* Validate asset identifiers before transfers  
* Get contract addresses for specific chains

---

## get\_app\_definition

### Name

get\_app\_definition

### Usage

Retrieves the immutable definition for a given app session so clients can verify governance parameters and participants.

### Request

| Parameter | Type | Required | Description | Example |
| ----- | ----- | ----- | ----- | ----- |
| app\_session\_id | string | Yes | Target app session identifier | "0x9876543210fedcba..." |

### Response

Returns the [AppDefinition](https://docs.yellow.org/docs/protocol/off-chain/app-sessions#appdefinition) structure:

| Field | Type | Description |
| ----- | ----- | ----- |
| protocol | string | Protocol version ("NitroRPC/0.2" or "NitroRPC/0.4") |
| participants | array\<address\> | Wallet addresses authorized for this session |
| weights | array\<int64\> | Voting weight per participant (aligned with participants order) |
| quorum | uint64 | Minimum combined weight required for updates |
| challenge | uint64 | Dispute timeout (seconds) |
| nonce | uint64 | Unique instance identifier |

Use Cases:

* Validate session metadata before signing states  
* Display governance rules in UI  
* Confirm protocol version compatibility

---

## get\_channels

### Name

get\_channels

### Usage

Lists all channels for a specific participant address across all supported chains.

### Request

| Parameter | Type | Required | Description | Default | Example |
| ----- | ----- | ----- | ----- | ----- | ----- |
| participant | string | No | Participant wallet address to query | (empty \= all channels) | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" |
| status | string | No | Filter by status | \- | "open" |
| offset | number | No | Pagination offset | 0 | 42 |
| limit | number | No | Number of channels to return | 10 (max 100\) | 10 |
| sort | string | No | Sort order by created\_at | "desc" | "desc" |

Allowed status values: "open" | "closed" | "challenged" | "resizing"

### Response

| Parameter | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| channels | array\<Channel\> | List of channels | See structure below |

#### Channel Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| channel\_id | string | Unique channel identifier | "0xabcdef..." |
| participant | string | User's wallet address | "0x742d35Cc..." |
| status | string | Channel status | "open" |
| token | string | Asset contract address | "0x2791Bca1..." |
| wallet | string | Participant's wallet address | "0x742d35Cc..." |
| amount | string | Total channel capacity (human-readable) | "100.0" |
| chain\_id | uint32 | Blockchain network identifier | 137 |
| adjudicator | string | Dispute resolution contract address | "0xAdjudicator..." |
| challenge | uint64 | Dispute timeout period (seconds) | 3600 |
| nonce | uint64 | Unique nonce ensuring channel uniqueness | 1699123456789 |
| version | uint64 | Current state version | 5 |
| created\_at | string | Channel creation timestamp (ISO 8601\) | "2023-05-01T12:00:00Z" |
| updated\_at | string | Last modification timestamp (ISO 8601\) | "2023-05-01T14:30:00Z" |

Use Cases:

* Display user's open channels  
* Check channel status before operations  
* Monitor multi-chain channel distribution

---

## get\_app\_sessions

### Name

get\_app\_sessions

### Usage

Lists all app sessions for a participant, sorted by creation date (newest first by default). Optionally filter by status (open/closed). Returns complete session information including participants, voting weights, quorum, protocol version, and current state. Supports pagination for large result sets.

### Request

| Parameter | Type | Required | Description | Default | Allowed Values | Example |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| participant | string (address) | No | Filter by participant wallet address | (empty \= all sessions) | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" |  |
| status | string | No | Filter by status | \- | "open" |  |
| offset | number | No | Pagination offset | 0 | \- | 42 |
| limit | number | No | Number of sessions to return | 10 (max 100\) | \- | 10 |
| sort | string | No | Sort order by created\_at | "desc" | "desc" |  |

Allowed status values: "open" | "closed"

### Response

| Parameter | Type | Description | See Also |
| ----- | ----- | ----- | ----- |
| app\_sessions | array\<AppSessionInfo\> | List of app sessions | See structure below |

#### AppSessionInfo

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| app\_session\_id | string | Unique identifier | "0x9876543210fedcba..." |
| application | string | Application identifier | "NitroliteChess" |
| status | string | Current status | "open" | "closed" |
| participants | array\<address\> | All participant wallet addresses | \["0x742d35Cc...", "0x8B3192f2..."\] |
| weights | array\<int64\> | Voting weights per participant | \[50, 50, 100\] |
| quorum | uint64 | Required weight for state updates | 100 |
| protocol | string | Protocol version | "NitroRPC/0.4" |
| challenge | uint64 | Challenge period in seconds | 86400 |
| version | number | Current state version | 5 |
| nonce | uint64 | Unique session identifier | 1699123456789 |
| session\_data | string | Current application state | "{\\"gameType\\":\\"chess\\",\\"turn\\":\\"white\\"}" |
| created\_at | string (timestamp) | Creation timestamp | "2023-05-01T12:00:00Z" |
| updated\_at | string (timestamp) | Last update timestamp | "2023-05-01T14:30:00Z" |

Use Cases:

* Display user's active games or escrows  
* Monitor session history  
* Paginate through large session lists

Pagination Best Practice

When dealing with users who have many app sessions, use pagination with reasonable limit values (10-50) to improve performance and user experience.

---

## get\_ledger\_balances

### Name

get\_ledger\_balances

### Usage

Retrieves the ledger balances for an account. If no parameters are provided, returns the authenticated user's unified balance across all assets. Can also query balance within a specific app session by providing the app\_session\_id. Returns all tracked assets (including those that currently evaluate to zero).

### Request

| Parameter | Type | Required | Description | Format | Example |
| ----- | ----- | ----- | ----- | ----- | ----- |
| account\_id | string | No | Account or app session identifier | 0x-prefixed hex string or wallet address | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" |

App Session Balances

To query balance within a specific app session, provide the app\_session\_id as the account\_id.

### Response

| Parameter | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| ledger\_balances | array\<Balance\> | Balance per asset | See structure below |

#### Balance Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| asset | string | Asset identifier | "usdc" |
| amount | string | Balance in human-readable format | "100.0" |

Use Cases:

* Display user's current balances  
* Check available funds before operations  
* Monitor balance changes in real-time

---

## get\_ledger\_entries

### Name

get\_ledger\_entries

### Usage

Retrieves detailed ledger entries for an account, providing a complete audit trail of all debits and credits. Each entry represents one side of a double-entry bookkeeping transaction. Used for detailed financial reconciliation and accounting. Supports filtering by account, asset, and pagination. Sorted by creation date (newest first by default).

### Request

| Parameter | Type | Required | Description | Default | Allowed Values | Example |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| account\_id | string | No | Filter by account identifier | \- | \- | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" |
| wallet | string (address) | No | Filter by wallet address | \- | \- | "0x742d35Cc..." |
| asset | string | No | Filter by asset | \- | \- | "usdc" |
| offset | number | No | Pagination offset | 0 | \- | \- |
| limit | number | No | Number of entries to return | 10 (max 100\) | \- | \- |
| sort | string | No | Sort order by created\_at | "desc" | "asc" | "desc" | \- |

### Response

| Parameter | Type | Description | Structure | Example |
| ----- | ----- | ----- | ----- | ----- |
| ledger\_entries | array\<LedgerEntry\> | List of ledger entries | See structure below |  |

#### LedgerEntry Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| id | number | Unique entry identifier | 123 |
| account\_id | string | Account this entry belongs to | "0x742d35Cc..." |
| account\_type | number | Ledger account classification (1000\=asset, 2000\=liability, etc.) | 1000 |
| asset | string | Asset symbol | "usdc" |
| participant | string | Participant wallet address | "0x742d35Cc..." |
| credit | string | Credit amount (incoming funds, "0.0" if debit) | "100.0" |
| debit | string | Debit amount (outgoing funds, "0.0" if credit) | "25.0" |
| created\_at | string | Entry creation timestamp (ISO 8601\) | "2023-05-01T12:00:00Z" |

Account types follow the broker’s GAAP-style codes: 1000 series for assets, 2000 liabilities, 3000 equity, 4000 revenue, and 5000 expenses.

### Double-Entry Bookkeeping

Every transaction creates two entries:

Transfer: Alice sends 50 USDC to Bob

Entry 1 (Alice's ledger):  
 account\_id: Alice's address  
 asset: usdc  
 credit: 0.0  
 debit: 50.0

Entry 2 (Bob's ledger):  
 account\_id: Bob's address  
 asset: usdc  
 credit: 50.0  
 debit: 0.0  
Accounting Principle

The double-entry system ensures that the total of all debits always equals the total of all credits, providing mathematical proof of accounting accuracy. This is the same principle used by traditional financial institutions.

Use Cases:

* Detailed financial reconciliation  
* Audit trail generation  
* Accounting system integration  
* Verify balance calculations

---

## get\_ledger\_transactions

### Name

get\_ledger\_transactions

### Usage

Retrieves user-facing transaction history showing transfers, deposits, withdrawals, and app session operations. Unlike ledger entries (which show accounting details), this provides a simplified view of financial activity with sender, receiver, amount, and transaction type. Supports filtering by asset and transaction type. Sorted by creation date (newest first by default).

### Request

| Parameter | Type | Required | Description | Default | Allowed Values | Example |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| account\_id | string | No | Filter by account identifier | \- | \- | "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" |
| asset | string | No | Filter by asset | \- | \- | "usdc" |
| tx\_type | string | No | Filter by transaction type | \- | "transfer" | "deposit" | "withdrawal" | "app\_deposit" | "app\_withdrawal" | "escrow\_lock" | "escrow\_unlock" | "transfer" |
| offset | number | No | Pagination offset | 0 | \- | \- |
| limit | number | No | Number of transactions to return | 10 (max 100\) | \- | \- |
| sort | string | No | Sort order by created\_at | "desc" | "asc" | "desc" | \- |

### Response

| Parameter | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| ledger\_transactions | array\<LedgerTransaction\> | List of transactions | See structure below |

#### LedgerTransaction Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| id | number | Unique transaction identifier | 1 |
| tx\_type | string | Transaction type | "transfer" |
| from\_account | string | Sender account identifier (wallet, channel, or app session) | "0x742d35Cc..." |
| from\_account\_tag | string | Sender's user tag (empty if none) | "NQKO7C" |
| to\_account | string | Receiver account identifier (wallet, channel, or app session) | "0x8B3192f2..." |
| to\_account\_tag | string | Receiver's user tag (empty if none) | "UX123D" |
| asset | string | Asset symbol | "usdc" |
| amount | string | Transaction amount | "50.0" |
| created\_at | string | Transaction timestamp (ISO 8601\) | "2023-05-01T12:00:00Z" |

from\_account and to\_account mirror the broker’s internal AccountID values, so they can reference wallets, app session escrow accounts, or channel escrows.

### Transaction Types

| Type | Description | Direction |
| ----- | ----- | ----- |
| transfer | Direct transfer between unified balances | Off-chain ↔ Off-chain |
| deposit | Funds deposited from channel to unified balance | On-chain → Off-chain |
| withdrawal | Funds withdrawn from unified balance to channel | Off-chain → On-chain |
| app\_deposit | Funds moved from unified balance into app session | Unified → App Session |
| app\_withdrawal | Funds released from app session to unified balance | App Session → Unified |
| escrow\_lock | Funds temporarily locked for blockchain operations | Unified → Escrow |
| escrow\_unlock | Funds released from escrow after blockchain confirmation | Escrow → Unified |

Use Cases:

* Display transaction history in UI  
* Export transaction records  
* Monitor specific transaction types  
* Track payment flows

---

## get\_rpc\_history

### Name

get\_rpc\_history

### Usage

Returns the authenticated user's recent RPC invocations, including signed request and response payloads. Useful for audit trails and debugging client integrations.

### Request

| Parameter | Type | Required | Description | Default | Example |
| ----- | ----- | ----- | ----- | ----- | ----- |
| offset | number | No | Pagination offset | 0 | 20 |
| limit | number | No | Maximum entries to return | 10 (max 100\) | 25 |
| sort | string | No | Sort order by timestamp | "desc" | "asc" |

### Response

| Parameter | Type | Description | See Also |
| ----- | ----- | ----- | ----- |
| rpc\_entries | array\<RPCEntry\> | Recorded invocations | See structure below |

#### RPCEntry Structure

| Field | Type | Description |
| ----- | ----- | ----- |
| id | number | Internal history identifier |
| sender | string | Wallet that issued the call |
| req\_id | number | Request sequence number |
| method | string | RPC method name |
| params | string | JSON-encoded request parameters |
| timestamp | number | Unix timestamp (seconds) |
| req\_sig | array\<Signature\> | Signatures attached to the request |
| response | string | JSON-encoded response payload |
| res\_sig | array\<Signature\> | Response signatures |

Use Cases:

* Debug client/server mismatches  
* Provide user-facing audit logs  
* Verify signed payloads during dispute resolution

---

## get\_user\_tag

### Name

get\_user\_tag

### Usage

Retrieves the authenticated user's unique alphanumeric tag. User tags provide a human-readable alternative to addresses for [transfer](https://docs.yellow.org/docs/protocol/off-chain/transfers) operations, similar to username systems. Tags are automatically generated upon first interaction with a clearnode and remain constant. This is a convenience feature for improving user experience.

### Request

No parameters.

### Response

| Parameter | Type | Description | Format | Example | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| tag | string | User's unique alphanumeric tag | 6 uppercase alphanumeric characters | "UX123D" | Can be used in transfer operations as destination\_user\_tag |

### Usage in Transfers

Instead of using full address:

transfer({destination: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", ...})  
Users can use the tag:

transfer({destination\_user\_tag: "UX123D", ...})  
Human-Readable Addresses

User tags make it easier for users to share their "address" verbally or in non-technical contexts, similar to payment apps like Venmo or Cash App usernames.

---

## get\_session\_keys

### Name

get\_session\_keys

### Usage

Retrieves all active (non-expired) session keys for the authenticated user. Shows each session key's address, application name, spending allowances, current usage, expiration, and permissions. Used for managing delegated keys and monitoring spending caps. Only returns session keys (not custody signers).

### Authentication

Required (private method)

### Request

| Parameter | Type | Required | Description | Default | Example |
| ----- | ----- | ----- | ----- | ----- | ----- |
| offset | number | No | Pagination offset | 0 | 20 |
| limit | number | No | Results per page | 10 (max 100\) | 25 |
| sort | string | No | Sort order by created\_at | "desc" | "asc" |

### Response

| Parameter | Type | Description | See Also |
| ----- | ----- | ----- | ----- |
| session\_keys | array\<SessionKeyInfo\> | List of active session keys | See structure below |

#### SessionKeyInfo Structure

| Field | Type | Description | Default | Notes |
| ----- | ----- | ----- | ----- | ----- |
| id | number | Internal identifier | — | — |
| session\_key | string (address) | Session key address | — | — |
| application | string | Application name for this session | "clearnode" | — |
| allowances | array\<AllowanceUsage\> | Spending limits and usage | — | See structure below |
| scope | string | Permission scope | — | Future feature, not fully enforced yet |
| expires\_at | string (timestamp) | Session expiration time (ISO 8601 format) | — | — |
| created\_at | string (timestamp) | Session creation time (ISO 8601 format) | — | — |

Example:

{  
 "id": 1,  
 "session\_key": "0x9876543210fedcba...",  
 "application": "Chess Game",  
 "allowances": \[  
   {"asset": "usdc", "allowance": "100.0", "used": "45.0"}  
 \],  
 "scope": "app.create,transfer",  
 "expires\_at": "2023-05-02T12:00:00Z",  
 "created\_at": "2023-05-01T12:00:00Z"  
}

#### AllowanceUsage

| Field | Type | Description |
| ----- | ----- | ----- |
| asset | string | Asset identifier (e.g., "usdc") |
| allowance | string | Total spending limit |
| used | string | Amount already spent |

### Spending Tracking

The clearnode tracks session key spending by monitoring all ledger debit operations:

Initial: allowance \= 100 USDC, used \= 0 USDC  
After transfer of 45 USDC: allowance \= 100 USDC, used \= 45 USDC  
Remaining \= 55 USDC available for future operations  
When a session key reaches its spending cap, further operations are rejected:

Error: "operation denied: insufficient session key allowance: 60 required, 55 available"  
Spending Caps

Session key allowances provide important security: even if a session key is compromised, the maximum loss is limited to the allowance amount.

Use Cases:

* Display active sessions in UI  
* Monitor spending against caps  
* Manage session lifecycles  
* Security auditing

---

## ping

### Name

ping

### Usage

Simple connectivity check to verify the clearnode is responsive and the RPC connection is alive. Returns immediately with success. Used for heartbeat, connection testing, and latency measurement.

### Authentication

Not required (public method)

### Request

No parameters required (empty object {}).

### Response

The response method should be "pong".

| Parameter | Type | Description | Value/Example | Notes |
| ----- | ----- | ----- | ----- | ----- |
| (empty) | object | Empty object or confirmation data | {} | Response indicates successful connection |

### Use Cases

Heartbeat: Periodic ping to keep RPC connection alive

setInterval(() \=\> clearnode.call("ping"), 30000)  *// Every 30 seconds*  
Latency Measurement: Measure round-trip time

const start \= Date.now()  
await clearnode.call("ping")  
const latency \= Date.now() \- start  
console.log(\`Latency: ${latency}ms\`)  
Health Check: Verify connection before critical operations

try {  
 await clearnode.call("ping")  
 *// Connection healthy, proceed with operation*  
} catch (error) {  
 *// Connection lost, reconnect*  
}  
Authentication Status: Test if session is still valid

const response \= await clearnode.call("ping")  
*// If no auth error, session is active*  
---

## Notifications (Server-to-Client)

The clearnode sends unsolicited notifications to clients via RPC when certain events occur. These are not responses to requests, but asynchronous messages initiated by the server.

EventsClearnodeClientEvent SourceClearnodeClientEvent SourceClearnodeClientRPC Connection EstablishedTransfer (incoming/outgoing)tr (transfer) notificationBalance changedbu (balance update) notificationChannel openedcu (channel update) notificationApp session updatedasu (app session update) notification

### Notification Types

| Method | Description | Data Structure |
| ----- | ----- | ----- |
| bu | Balance update | balance\_updates array with updated balances |
| cu | Channel update | Full Channel object |
| tr | Transfer (incoming/outgoing) | transactions array with transfer details |
| asu | App session update | app\_session object and participant\_allocations |

---

## bu (Balance Update)

### Method

bu

### When Sent

Whenever account balances change due to transfers, app session operations, or channel operations.

### Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| balance\_updates | array\<LedgerBalance\> | Updated balances for affected accounts | See structure below |

#### LedgerBalance Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| asset | string | Asset symbol | "usdc" |
| amount | string | New balance amount | "150.0" |

Use Cases:

* Update balance display in real-time  
* Trigger UI animations for balance changes  
* Log balance history for analytics

---

## cu (Channel Update)

### Method

cu

### When Sent

When a channel's state changes (opened, resized, challenged, closed).

### Structure

The notification contains the complete updated Channel object. See [Channel Structure](https://docs.yellow.org/docs/protocol/off-chain/queries#channel-structure) in the get\_channels section for the full field list.

Use Cases:

* Update channel status in UI  
* Alert user when channel becomes active  
* Monitor for unexpected channel closures

---

## tr (Transfer)

### Method

tr

### When Sent

When a transfer affects the user's account (both incoming and outgoing transfers).

### Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| transactions | array\<LedgerTransaction\> | Array of transaction objects for the transfer | See structure below |

The LedgerTransaction structure is identical to the one returned by get\_ledger\_transactions. See [LedgerTransaction Structure](https://docs.yellow.org/docs/protocol/off-chain/queries#ledgertransaction-structure) for the full field list.

Use Cases:

* Display incoming/outgoing payment notifications  
* Play sound/show toast for transfers  
* Update transaction history in real-time

Real-Time Payments

Combine tr notifications with bu (balance update) to provide immediate feedback when users send or receive funds.

---

## asu (App Session Update)

### Method

asu

### When Sent

When an app session state changes (new state submitted, session closed, deposits/withdrawals).

### Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| app\_session | AppSession | Complete app session object | See get\_app\_sessions for structure |
| participant\_allocations | array\<AppAllocation\> | Current allocations for each participant | See structure below |

#### AppAllocation Structure

| Field | Type | Description | Example |
| ----- | ----- | ----- | ----- |
| participant | string | Participant wallet address | "0x742d35Cc..." |
| asset | string | Asset symbol | "usdc" |
| amount | string | Allocated amount | "50.0" |

Use Cases:

* Update game UI when opponent makes a move  
* Refresh session state in real-time  
* Alert when session is closed  
* Sync multi-participant applications

---

## Implementation Notes

Connection Management:

* Maintain persistent connection for notifications  
* Implement automatic reconnection on disconnect  
* Re-fetch current state after reconnection

Notification Handling:

* All notifications are asynchronous  
* No response required from client  
* Multiple notifications may arrive rapidly (batch if needed)

Best Practices:

* Use query methods for initial state retrieval  
* Use notifications for ongoing monitoring  
* Don't rely solely on notifications (could be missed during disconnect)  
* Implement periodic state refresh as backup

Pagination:

* For methods with pagination, use reasonable limit values

---

## Next Steps

Explore other protocol features:

* [App Sessions](https://docs.yellow.org/docs/protocol/off-chain/app-sessions) \- Create and manage multi-party applications  
* [Transfers](https://docs.yellow.org/docs/protocol/off-chain/transfers) \- Send funds between users  
* [Channel Methods](https://docs.yellow.org/docs/protocol/off-chain/channel-methods) \- Manage payment channels

For protocol fundamentals:

* [Authentication](https://docs.yellow.org/docs/protocol/off-chain/authentication) \- Manage session keys  
* [Message Format](https://docs.yellow.org/docs/protocol/off-chain/message-format) \- Understand request/response structure

# Cross-Layer Communication Flows

This section illustrates how the on-chain and off-chain layers interact during typical operations. Each flow shows the sequence of method calls and data exchange between Client, Clearnode, and Smart Contracts.

Flow Navigation

Jump to a specific flow:

* [Authentication Flow](https://docs.yellow.org/docs/protocol/communication-flows#authentication-flow) \- Establish session with session key delegation  
* [Channel Creation Flow](https://docs.yellow.org/docs/protocol/communication-flows#channel-creation-flow) \- Open payment channel on blockchain  
* [Off-Chain Transfer Flow](https://docs.yellow.org/docs/protocol/communication-flows#off-chain-transfer-flow) \- Instant transfers without gas  
* [App Session Lifecycle](https://docs.yellow.org/docs/protocol/communication-flows#app-session-lifecycle-flow) \- Multi-party application flow  
* [Cooperative Closure](https://docs.yellow.org/docs/protocol/communication-flows#cooperative-closure-flow) \- Fast channel closure  
* [Challenge-Response Closure](https://docs.yellow.org/docs/protocol/communication-flows#challenge-response-closure-flow) \- Dispute resolution

---

## Authentication Flow

### Purpose

Establish authenticated session with session key delegation.

### Actors

* Client: User application or SDK  
* Clearnode: Off-chain service provider

### Sequence Diagram

ClearnodeMain WalletClientClearnodeMain WalletClient1. Generate Session Keypair2. auth\_request (public, no signature)3. Generate Challenge4. Sign Challenge with MAIN wallet (EIP-712)5. Validate & Issue SessionSubsequent requests signed with session\_keysession\_private\_key \= random()session\_address \= address(session\_public\_key)auth\_request(address, session\_key, allowances, scope, expires\_at)Validate params, generate UUIDauth\_challenge(challenge\_message)Sign Policy typed data (challenge, scope, wallet, session\_key, expires\_at, allowances)EIP-712 signatureauth\_verify(challenge, sig) // or auth\_verify(challenge, jwt)Recover main wallet from sig (or validate jwt)Create session \+ JWT{address, session\_key, jwt\_token, success}

### Steps

#### Step 1: Client Generates Session Keypair

The session key is generated entirely off-chain and the private key never leaves the client:

session\_private\_key \= random()  
session\_public\_key \= derive(session\_private\_key)  
session\_address \= address(session\_public\_key)

#### Step 2: Client → Clearnode: auth\_request (public, no signature)

The client sends a public registration request (no signature required):

Request:  
{  
 address: user\_wallet\_address  
 session\_key: session\_address  
 allowances: \[{"asset": "usdc", "amount": "100.0"}\]  
 scope: "transfer,app.create"  
 expires\_at: 1762417328123  *// Unix ms*  
}

#### Step 3: Clearnode Validates and Generates Challenge

The clearnode performs validation:

* Validate address/session\_key format, optional allowances/scope, expires\_at  
* Generate challenge UUID

#### Step 4: Clearnode → Client: auth\_challenge

The clearnode responds with a challenge:

Response:  
{  
 challenge\_message: "550e8400-e29b-41d4-a716-446655440000"  
}  
Signature: signed by Clearnode

#### Step 5: Client Signs Challenge (MAIN wallet, EIP-712)

The client signs the challenge using the main wallet over the Policy typed data (includes challenge, wallet, session\_key, expires\_at, scope, allowances):

challenge\_signature \= signTypedData(policyTypedData, main\_wallet\_private\_key)

#### Step 6: Client → Clearnode: auth\_verify

The client submits the signed challenge (or a previously issued JWT):

Request:  
{  
 challenge: "550e8400-e29b-41d4-a716-446655440000",  
 *// alternatively:*  
 *// jwt: "\<existing\_jwt\>"*  
}  
Signature: EIP\-712 signature by main wallet (required if jwt is absent)

#### Step 7: Clearnode Validates Challenge

The clearnode validates:

* Signature recovers the wallet used in auth\_request  
* Challenge matches pending authentication  
* Challenge not expired or reused

#### Step 8: Clearnode → Client: auth\_verify Response

The clearnode confirms authentication:

Response:  
{  
 address: user\_wallet\_address  
 session\_key: session\_address  
 jwt\_token: "\<jwt\>"  
 success: true  
}

#### Step 9: Session Established

* All subsequent requests signed with session\_private\_key  
* The clearnode enforces allowances and expiration  
* No main wallet interaction required until session expires

### Key Points

Session Security

* Session private key NEVER leaves the client  
* Main wallet only signs once (auth\_request)  
* All subsequent operations use session key  
* Allowances prevent unlimited spending  
* Challenge-response prevents replay attacks

Related Methods: [auth\_request](https://docs.yellow.org/docs/off-chain/authentication#step-1-auth_request), [auth\_challenge](https://docs.yellow.org/docs/off-chain/authentication#step-2-auth_challenge), [auth\_verify](https://docs.yellow.org/docs/off-chain/authentication#step-3-auth_verify)

---

## Channel Creation Flow

### Purpose

Open a payment channel with zero initial balance; fund it later via resize\_channel.

### Actors

* Client: User application or SDK  
* Clearnode: Off-chain service provider  
* Smart Contract: Custody Contract  
* Blockchain: Ethereum-compatible network

### Sequence Diagram

BlockchainClearnodeClientBlockchainClearnodeClientOff-Chain Preparation2. Prepare Channel3. Validate & SignOn-Chain ExecutionChannel is now ACTIVEcreate\_channel(chain\_id, token)Generate unique nonceCreate channel configCreate initial state (intent: INITIALIZE, version: 0, zero allocations)Pack & sign state{channel\_id, channel, state, server\_signature}Verify Clearnode signatureSign packed state with user keyCustody.create(channel, state, sig\_user, sig\_clearnode)Verify signaturesCreate channel (zero balance)Set status to OPEN/ACTIVEEmit Opened eventOpened event (monitored)Opened event

### Steps

#### Step 1: Client → Clearnode: create\_channel

Client requests channel creation:

Request:  
{  
 chain\_id: 137  *// Polygon*  
 token: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"  *// USDC*  
}  
Signature: session key signature

#### Step 2: Clearnode Processes Request

The clearnode:

* Validates token is supported on chain  
* Generates unique nonce  
* Selects adjudicator (SimpleConsensus for payment channels)  
* Creates Channel struct  
* Computes channelId \= keccak256(abi.encode(Channel))  
* Creates initial State with intent: INITIALIZE, version: 0, state\_data: "0x", zero allocations  
* Packs state (abi.encode(channelId, intent, version, data, allocations) in Solidity terms)  
* Signs packed state with clearnode's participant key

#### Step 3: Clearnode → Client: Response

Response:  
{  
 channel: {  
   participants: \[user\_address, clearnode\_address\]  
   adjudicator: 0xSimpleConsensusAddress  
   challenge: 86400  
   nonce: 1699123456789  
 }  
 state: {  
   intent: INITIALIZE  
   version: 0  
   data: "0x"  
   allocations: \[  
     {destination: user\_address, token: usdc, amount: 0},  
     {destination: clearnode\_address, token: usdc, amount: 0}  
   \]  
 }  
 server\_signature: "0xClearnodeSig..."  
 channel\_id: "0xChannelId..."  
}  
Clearnode Signs First

The clearnode provides its signature BEFORE the user commits funds on-chain. This ensures both parties have committed before any on-chain transaction occurs.

#### Steps 4-5: Client Validates and Signs

Client:

* Recomputes channelId and verifies it matches  
* Recomputes packed state and verifies clearnode signature  
* Signs packed state with user's participant key

#### Step 6: Client → Blockchain: Custody.create()

Client submits transaction:

Custody.create(channel, state, userSig, serverSig)

#### Step 7: Blockchain Validates and Creates Channel

Contract:

* Verifies user's signature is valid  
* Verifies clearnode's signature is valid  
* Stores channel parameters and funding state (zero balances)  
* Sets channel status to OPEN  
* Emits Opened event

#### Step 8: Event Listener Detects Creation

The clearnode's event listener:

* Detects Opened event  
* Validates channel parameters

#### Steps 9-10: Notifications

The clearnode:

* Updates internal database: channel status \= open (zero balance)  
* Sends channel\_update notification to client

#### Step 11: Channel Active

* Channel active with zero balance  
* Use resize\_channel to fund the channel

### Key Points

Two-Phase Process

* Off-chain preparation: Clearnode prepares and signs channel configuration  
* On-chain execution: User submits transaction to lock funds  
* This ensures clearnode is ready to join before user risks funds

Related Methods: [create\_channel](https://docs.yellow.org/docs/off-chain/channel-methods#create_channel)

---

## Off-Chain Transfer Flow

### Purpose

Transfer funds between users instantly without blockchain transaction.

### Actors

* Sender (Client A): Initiating user  
* Clearnode: Off-chain service provider  
* Receiver (Client B): Receiving user

### Sequence Diagram

Client BClearnodeClient AClient BClearnodeClient A2. Validate Request3. Update Ledger4. Notify ReceiverComplete: \< 1 second, zero gastransfer(destination, amount, asset)Check A authenticatedCheck A has sufficient balanceCheck B exists (has channel)Debit entry (A: \-50 USDC)Credit entry (B: \+50 USDC)Create transaction recordTransfer confirmed ✓transfer\_received eventbalance\_update event

### Steps

#### Step 1: Client A → Clearnode: transfer

Sender initiates transfer:

Request:  
{  
 destination: "0xClientB\_Address",   *// or destination\_user\_tag: "UX123D"*  
 allocations: \[{"asset": "usdc", "amount": "50.0"}\]  
}  
Signature: Client A's session key

#### Step 2: Clearnode Validates

The clearnode validates:

* Client A is authenticated  
* Client A has \>= 50 USDC available balance  
* Destination address/tag is valid (account is created if new)  
* Asset "usdc" is supported

#### Step 3: Clearnode Creates Ledger Entries

Double-entry bookkeeping:

Entry 1 (Debit from Client A unified account):

{  
 account\_id: Client A address  
 asset: "usdc"  
 credit: "0.0"  
 debit: "50.0"  
}  
Entry 2 (Credit to Client B unified account):

{  
 account\_id: Client B address  
 asset: "usdc"  
 credit: "50.0"  
 debit: "0.0"  
}

#### Step 4: Clearnode Creates Transaction Record

{  
 id: 1,  
 tx\_type: "transfer",  
 from\_account: Client A address,  
 from\_account\_tag: "NQKO7C",  
 to\_account: Client B address,  
 to\_account\_tag: "UX123D",  
 asset: "usdc",  
 amount: "50.0",  
 created\_at: "2023-05-01T12:00:00Z"  
}

#### Step 5: Clearnode → Client A: Response

Response:  
{  
 transactions: \[  
   {  
     id: 1,  
     tx\_type: "transfer",  
     from\_account: "0xA...",  
     from\_account\_tag: "NQKO7C",  
     to\_account: "0xB...",  
     to\_account\_tag: "UX123D",  
     asset: "usdc",  
     amount: "50.0",  
     created\_at: "2023-05-01T12:00:00Z"  
   }  
 \]  
}

#### Step 6-7: Clearnode → Clients: Notifications

* tr (transfer) notification to sender/receiver with transactions array  
* bu (balance update) notification reflecting new balances

#### Step 9: Transfer Complete

* Instant (\< 1 second)  
* No blockchain transaction  
* Zero gas fees  
* Both parties notified

### Key Points

Instant Settlement

* Purely off-chain: Database transaction, no blockchain  
* Instant settlement: \< 1 second typical  
* Zero gas fees: No on-chain transaction required  
* Double-entry bookkeeping: Accounting accuracy guaranteed  
* Receiver account auto-created: Destination tag/address need not have a prior balance

Related Methods: [transfer](https://docs.yellow.org/docs/off-chain/transfers#transfer)

---

## App Session Lifecycle Flow

### Purpose

Create, update, and close a collaborative app session with multiple participants.

### Actors

* Client A: Participant 1  
* Client B: Participant 2  
* Clearnode: Off-chain service provider

### Scenario

Two-player chess game with 100 USDC stake each.

### Sequence Diagram

ClearnodeClient BClient AClearnodeClient BClient ACreate (lock funds)Update (submit\_app\_state)Closecreate\_app\_session(definition, allocations, session\_data?)co-sign (if non-zero allocation)Validate quorum, balances, allowancesLock allocations from unified balances{app\_session\_id, status:"open", version:1}asu/bu notificationssubmit\_app\_state(app\_session\_id, intent, version, allocations, session\_data?)co-signs to meet quorumValidate intent rules, version, quorum, allowancesApply operate/deposit/withdraw{app\_session\_id, status:"open", version:n}asu/bu notificationsclose\_app\_session(app\_session\_id, allocations, session\_data?)co-signs to meet quorumValidate sums and quorum, release to unified balances{app\_session\_id, status:"closed", version:n+1}asu/bu notifications

### Sequence (Create → Update → Close)

1. Create (off-chain): create\_app\_session  
   * Client signs request (all participants with non-zero allocations must sign).  
   * Clearnode validates protocol version (0.2/0.4), quorum, balances, allowances/session keys.  
   * Funds are locked from each signer’s unified balance into the app session account.  
   * Response (minimal): app\_session\_id, status: "open", version: 1. Full metadata is not echoed; use get\_app\_sessions to read it.  
2. Example Request:  
3. {  
4.  "req": \[1,"create\_app\_session",{  
       "definition": {  
         "protocol": "NitroRPC/0.4",  
         "participants": \["0xA","0xB"\],  
         "weights": \[100,100\],  
         "quorum": 200,  
         "challenge": 86400,  
         "nonce": 1699123  
       },  
       "allocations": \[  
         {"participant": "0xA","asset": "usdc","amount": "100.0"},  
         {"participant": "0xB","asset": "usdc","amount": "100.0"}  
       \],  
       "session\_data": "{\\"game\\":\\"chess\\"}"  
     },1699123456789\],  
     "sig": \["0xUserSig","0xCoSig"\]  
   }

5. State Updates (off-chain): submit\_app\_state  
   * v0.4 requires version \= current+1; v0.2 rejects intent/version and only allows a single update.  
   * Intents:  
     * operate: redistribute, sum must stay equal.  
     * deposit: sum must increase; depositor must sign and have available unified balance.  
     * withdraw: sum must decrease; session must have funds.  
   * Quorum required; session-key allowances enforced.  
   * Response (minimal): app\_session\_id, status: "open", version (new). No metadata echoed.  
   * Notifications: asu (app session update) \+ bu (balance update for deposit/withdraw).  
6. Example Request (deposit v0.4):  
7. {  
8.  "req": \[2,"submit\_app\_state",{  
       "app\_session\_id": "0xSession",  
       "intent": "deposit",  
       "version": 2,  
       "allocations": \[  
         {"participant": "0xA","asset": "usdc","amount": "150.0"},  
         {"participant": "0xB","asset": "usdc","amount": "100.0"}  
       \]  
     },1699123456790\],  
     "sig": \["0xUserSig","0xCoSig"\]  
   }

9. Close (off-chain): close\_app\_session  
   * Requires quorum signatures; final allocations must match total balances.  
   * Response (minimal): app\_session\_id, status: "closed", version (incremented). No metadata echoed.  
   * Funds are released to participants’ unified balances; notifications asu and bu are sent.  
10. Example Request:  
11. {  
12.  "req": \[3,"close\_app\_session",{  
        "app\_session\_id": "0xSession",  
        "allocations": \[  
          {"participant": "0xA","asset": "usdc","amount": "180.0"},  
          {"participant": "0xB","asset": "usdc","amount": "20.0"}  
        \]  
      },1699123456795\],  
      "sig": \["0xUserSig","0xCoSig"\]  
    }

### Key Points

App Sessions

App sessions enable multi-party applications with custom governance rules. Funds are locked from unified balance for the duration of the session.

Related Methods: [create\_app\_session](https://docs.yellow.org/docs/off-chain/app-sessions#create_app_session), [submit\_app\_state](https://docs.yellow.org/docs/off-chain/app-sessions#submit_app_state), [close\_app\_session](https://docs.yellow.org/docs/off-chain/app-sessions#close_app_session)

---

## Cooperative Closure Flow

### Purpose

Close channel when all parties agree on final state.

### Actors

* Client: User application  
* Clearnode: Off-chain service provider  
* Smart Contract: Custody Contract  
* Blockchain: Ethereum-compatible network

### Key Points

Preferred Method

Cooperative closure is fast (1 transaction), cheap (low gas), and immediate (no waiting period). Always use this when possible.

### Sequence Diagram

BlockchainClearnodeClientBlockchainClearnodeClientclose\_channel(channel\_id, funds\_destination)Validate channel open/resizing and not challengedBuild FINALIZE state (version \= current+1, data \= "0x", allocations){channel\_id, state, server\_signature}Verify server\_signature and sign packed stateCustody.close(channel\_id, state, userSig, serverSig)Verify signatures, close channel, emit eventEvent observedUpdate DB and balancescu \+ bu notifications

### Sequence

1. Client → Clearnode: close\_channel(channel\_id, funds\_destination)  
   * Authenticated request signed by the user (session key or wallet).  
2. Example Request:  
3. {  
4.  "req": \[10,"close\_channel",{  
       "channel\_id": "0xChannel",  
       "funds\_destination": "0xUser"  
     },1699123457000\],  
     "sig": \["0xUserSig"\]  
   }

5. Clearnode: validates channel exists and is open/resizing, checks challenged-channel guard, builds FINALIZE state:  
   * intent: FINALIZE, version \= current+1, state\_data: "0x", allocations split between user and broker based on channel balance.  
   * Signs packed state (keccak256(abi.encode(channelId, intent, version, data, allocations))).  
6. Clearnode → Client: response with channel\_id, state, server\_signature.  
7. Client: verifies server signature, signs the same packed state.  
8. Client → Blockchain: Custody.close(channel\_id, state, userSig, serverSig) (one tx).  
9. Blockchain: verifies both signatures, closes channel, emits Closed/Opened\-equivalent event (implementation-specific), releases funds.  
10. Clearnode: observes event, updates DB, sends cu (channel update) and bu (balance update) notifications.

Related Methods: [close\_channel](https://docs.yellow.org/docs/off-chain/channel-methods#close_channel)

---

## Challenge-Response Closure Flow

### Purpose

Close channel when other party is unresponsive or disputes final state.

### Actors

* Client: User application  
* Clearnode: Off-chain service provider (may be unresponsive)  
* Smart Contract: Custody Contract  
* Blockchain: Ethereum-compatible network

### Key Points

Challenge Period

This method requires waiting for the challenge period (typically 24 hours) to elapse. Use only when cooperative closure fails.

### Sequence Diagram

OtherPartyClearnodeBlockchainClientOtherPartyClearnodeBlockchainClientHold latest signed statealt\[Newer state posted\]Wait for challenge period expiryCustody.challenge(channelId, state, sigs)Start challenge timer (challenge period)Custody.checkpoint(channelId, newerState, sigs)Replace pending stateCustody.close(channelId, state, sigs) // after timeout if uncontestedFinalize channel, emit eventEvent observed when back onlineUpdate DB, balancescu \+ bu notifications

### Sequence (User-initiated, clearnode unresponsive)

1. Prerequisite: User holds the latest mutually signed state (or clearnode-signed latest) for the channel.  
2. Client → Blockchain: Custody.challenge(channelId, state, sigs...)  
   * Submits the latest signed state to start the challenge.  
3. Challenge Window: Other party can respond with a newer valid state before timeout.  
4. If no newer state is posted: After the challenge period, user calls Custody.close(channelId, state, sigs...) to finalize.  
5. Blockchain: finalizes channel, releases funds per challenged state, emits closure event.  
6. Clearnode (when responsive again): observes event, updates DB, sends cu/bu notifications to participants.

Related Methods: On-chain Custody.challenge() and Custody.close()

---

## Next Steps

Now that you understand how all protocol layers work together:

1. Review Method Details: Visit Part 2 (Off-Chain RPC Protocol) for complete method specifications  
2. Explore Reference: See [Protocol Reference](https://docs.yellow.org/docs/protocol/protocol-reference) for constants and standards  
3. Implementation Guide: Check [Implementation Checklist](https://docs.yellow.org/docs/protocol/implementation-checklist) for best practices  
4. Quick Start: Follow the [Quick Start Guide](https://docs.yellow.org/docs/protocol/quick-start) to begin building

Complete Flows

These flows represent the most common operations. For edge cases and error handling, consult the specific method documentation in Part 2\.

# Protocol Reference

Quick reference guide for protocol versions, constants, standards, and specifications.

Quick Navigation

Jump to a section:

* [Protocol Versions](https://docs.yellow.org/docs/protocol/protocol-reference#protocol-versions) \- Nitrolite & Nitro RPC versions  
* [State Intent System](https://docs.yellow.org/docs/protocol/protocol-reference#state-intent-system) \- Channel state classification  
* [Participant Indices](https://docs.yellow.org/docs/protocol/protocol-reference#participant-indices) \- Creator & Clearnode positions  
* [Channel Status](https://docs.yellow.org/docs/protocol/protocol-reference#channel-status-state-machine) \- Status transitions  
* [Signature Standards](https://docs.yellow.org/docs/protocol/protocol-reference#signature-standards) \- On-chain & off-chain formats  
* [EIP References](https://docs.yellow.org/docs/protocol/protocol-reference#eip-references) \- Ethereum standards used  
* [Protocol Constants](https://docs.yellow.org/docs/protocol/protocol-reference#protocol-constants) \- Core constants

---

## Protocol Versions

### Nitrolite Protocol

| Property | Value |
| ----- | ----- |
| Version | 0.5.0 |
| Status | Mainnet deployments live; not production yet |
| Compatibility | EVM-compatible chains |

Supported Chains: Ethereum, Polygon, Arbitrum One, Optimism, Base, and other EVM-compatible networks.

### Nitro RPC Protocol

| Version | Status | Features |
| ----- | ----- | ----- |
| 0.2 | Legacy | Basic state updates only |
| 0.4 | Current | Intent system (OPERATE, DEPOSIT, WITHDRAW) |

Version Recommendation

Always use NitroRPC/0.4 for new implementations. Version 0.4 adds the intent system for app sessions, enabling dynamic fund management (deposits and withdrawals) within active sessions.

Breaking Changes:

* NitroRPC/0.4 introduces the intent parameter in submit\_app\_state  
* NitroRPC/0.2 sessions cannot use DEPOSIT or WITHDRAW intents  
* Protocol version is set during app session creation and cannot be changed

---

## State Intent System

Channel states are classified by state.intent (uint8) to signal their purpose. The Solidity enum defines:

### StateIntent Enumeration

enum StateIntent {  
   OPERATE,     // 0: Normal updates (challenge/checkpoint)  
   INITIALIZE,  // 1: Channel funding/creation  
   RESIZE,      // 2: In-place capacity change  
   FINALIZE     // 3: Cooperative closure  
}

### Intent Usage

| Intent | Value | When Used | Method |
| ----- | ----- | ----- | ----- |
| INITIALIZE | 1 | Channel creation | Custody.create() |
| RESIZE | 2 | Channel resize | Custody.resize() |
| FINALIZE | 3 | Cooperative closure | Custody.close() |
| OPERATE | 0 | Challenge/checkpoint | Custody.challenge(), Custody.checkpoint() |

Example:

*// Creation state*  
state.intent \= 1  *// INITIALIZE*  
state.version \= 0  
state.data \= "0x"  *// Empty for basic channels*

*// Closing state*  
state.intent \= 3  *// FINALIZE*  
state.version \= currentVersion \+ 1  
state.data \= "0x"  
Intent Validation

Smart contracts validate the intent field to ensure proper channel lifecycle. Incorrect intent values will cause transactions to revert.

---

## Participant Indices

In a standard payment channel, participants are identified by their array index.

### Index 0: Creator (User)

Role: Creator

Responsibilities:

* Initiates channel creation  
* Typically the one depositing funds  
* First to sign states (state.sigs\[0\])  
* Calls Custody.create() on-chain

Example:

channel.participants\[0\] \= "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" *// User*

### Index 1: Clearnode

Role: Service provider

Responsibilities:

* Co-signs the initial state before on-chain create(); there is no separate join() call  
* Provides off-chain services (Nitro RPC, unified balance management)  
* Second to sign states (state.sigs\[1\])

Example:

channel.participants\[1\] \= "0x123456789abcdef0123456789abcdef012345678" *// Clearnode*  
Signature Order Critical

Signatures array order MUST match participants array order. Mismatched signatures will cause transaction failures.

state.sigs\[0\] \= creator\_signature   *// Must be from participants\[0\]*

state.sigs\[1\] \= clearnode\_signature *// Must be from participants\[1\]*

---

## Channel Status State Machine

Channel lifecycle is governed by status transitions.

### Status Enumeration

enum Status {  
   VOID,      // 0: Channel does not exist  
   INITIAL,   // 1: Creation in progress, awaiting all participants  
   ACTIVE,    // 2: Fully funded and operational  
   DISPUTE,   // 3: Challenge period active  
   FINAL      // 4: Ready to be closed and deleted  
}

### State Transition Diagram

create() (creator only)  
create() (all sigs present)  
join() (remaining participants)  
challenge()  
close() (cooperative)  
checkpoint() (newer state)  
close() (after timeout)  
VOID  
INITIAL  
ACTIVE  
DISPUTE  
FINAL  
Channel does not exist  
on blockchain  
Creator has joined,  
awaiting other participants  
Operational state,  
can perform off-chain updates  
Challenge active,  
parties can submit newer states  
Ready for deletion,  
funds distributed

### Valid Transitions

| From | To | Trigger | Notes |
| ----- | ----- | ----- | ----- |
| VOID | INITIAL | create() (creator only) | Legacy flow; awaiting other participants |
| VOID | ACTIVE | create() (all sigs present) | Current flow; both participants co-sign initial state |
| INITIAL | ACTIVE | join() | Remaining participants join |
| ACTIVE | DISPUTE | challenge() | Dispute initiated |
| ACTIVE | FINAL | close() | Cooperative closure |
| DISPUTE | ACTIVE | checkpoint() | Newer state accepted |
| DISPUTE | FINAL | close() | Challenge timeout |

Quick Closure

The fastest way to close a channel is ACTIVE → FINAL via cooperative close(). This skips the challenge period entirely.

---

## Signature Standards

### On-Chain Signatures (Solidity)

Used in smart contract transactions (create, join, close, challenge, resize).

Format: Variable-length byte arrays supporting multiple signature types (since v0.3.0)

Structure:

struct State {  
   // ... other fields ...  
   bytes\[\] sigs;  // Array of signatures from participants  
}  
Supported Types:

* ECDSA (65 bytes): Standard signatures from EOA wallets  
* ERC-1271: Smart contract wallet signatures  
* ERC-6492: Counterfactual contract signatures (not yet deployed)

Hash: Raw packedState (no EIP-191 prefix for chain-agnostic compatibility)

Example:

packedState \= keccak256(abi.encode(channelId, state.intent, state.version, state.data, state.allocations))  
signature \= sign(packedState, participantPrivateKey) *// Raw hash, no prefix*

### Off-Chain Signatures (Nitro RPC)

Used in RPC requests and responses over RPC.

Format: 0x-prefixed hex string (typically ECDSA from session keys)

Typical Length: 65 bytes for ECDSA

* r: 32 bytes  
* s: 32 bytes  
* v: 1 byte

Representation: 130 hex characters \+ 0x prefix

Example:

signature \= "0x1234567890abcdef...xyz" *// 132 characters total (ECDSA)*  
Computed Over:

rpcHash \= keccak256(JSON.stringify(req))  
signature \= sign(rpcHash, sessionPrivateKey)  
Session Key Signatures

Off-chain RPC signatures are typically ECDSA from session keys (EOA wallets), but the protocol supports other signature types for future flexibility.

Chain-Agnostic Signatures

On-chain signatures do NOT use EIP-191 or EIP-712 prefixes to maintain chain-agnostic compatibility. This differs from typical Ethereum signing patterns. Off-chain RPC signatures (e.g., authentication) DO use EIP-712 for better wallet UX.

---

## EIP References

Ethereum Improvement Proposals referenced or used by the protocol.

### EIP-191: Signed Data Standard

Status: Not used in on-chain signatures (chain-agnostic design)  
Link: [https://eips.ethereum.org/EIPS/eip-191](https://eips.ethereum.org/EIPS/eip-191)

Why not used for on-chain: On-chain signatures are computed over raw packedState hash without EIP-191 prefix to maintain compatibility across different EVM chains and potential non-EVM implementations.

### EIP-712: Typed Structured Data Hashing

Status: Used for off-chain RPC authentication  
Link: [https://eips.ethereum.org/EIPS/eip-712](https://eips.ethereum.org/EIPS/eip-712)

Usage: Authentication flow uses EIP-712 typed data for signing the Policy structure (challenge, wallet, session\_key, expires\_at, scope, allowances) with the main wallet. This provides better wallet UX by displaying human-readable signing data.

### EIP-1271: Contract Signature Validation

Status: Supported by adjudicators  
Link: [https://eips.ethereum.org/EIPS/eip-1271](https://eips.ethereum.org/EIPS/eip-1271)

Usage: Enables smart contract wallets to sign state updates as participants.

### EIP-20 (ERC-20): Token Standard

Status: Required for all assets  
Link: [https://eips.ethereum.org/EIPS/eip-20](https://eips.ethereum.org/EIPS/eip-20)

Usage: All assets must be ERC-20 compliant tokens. The Custody Contract uses transferFrom and transfer methods.

Standards Compliance

While the protocol references these EIPs, implementation details may vary. Always consult the specific smart contract code for authoritative behavior.

---

## Protocol Constants

The only protocol-wide constants defined in code are:

uint256 constant PART\_NUM   \= 2; // Channels are always 2-party  
uint256 constant CLIENT\_IDX \= 0; // Client/creator participant index  
uint256 constant SERVER\_IDX \= 1; // Server/clearnode participant index  
All channel arrays (participants, allocations, sigs) and state validation logic rely on these indices and fixed participant count.

---

## Next Steps

Now that you have the complete protocol reference:

1. Terminology: Review [Terminology](https://docs.yellow.org/docs/protocol/terminology) for all term definitions  
2. Communication Flows: See [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows) for sequence diagrams  
3. Implementation Guide: Follow [Implementation Checklist](https://docs.yellow.org/docs/protocol/implementation-checklist) to build compliant clients  
4. Channel Lifecycle: See [Channel Lifecycle](https://docs.yellow.org/docs/on-chain/channel-lifecycle) for detailed state transitions

Reference Updates

This reference reflects protocol version 0.5.0. For the latest updates, check the [Nitrolite repository](https://github.com/layer-3/nitrolite) or use get\_config to query clearnode capabilities dynamically.

# Implementation Checklist

Comprehensive checklist for building a compliant Nitrolite client with security best practices.

Progressive Implementation

You don't need to implement everything at once. Start with Core Protocol and On-Chain Integration, then add Off-Chain RPC and advanced features progressively.

---

## Core Protocol Support

Foundation requirements for any Nitrolite implementation.

### Identifier Computation

*  Compute channelId from Channel struct  
  * Hash participants, adjudicator, challenge, nonce using keccak256  
  * Verify deterministic computation (same inputs \= same output)  
  * Reference: [Data Structures](https://docs.yellow.org/docs/protocol/on-chain/data-structures#channel-identifier)  
*  Compute payload hash (packedState) from channel state  
  * Compute packedState \= keccak256(abi.encode(channelId, state.intent, state.version, state.data, state.allocations))  
  * Ensure proper ABI encoding  
  * Reference: [Data Structures](https://docs.yellow.org/docs/protocol/on-chain/data-structures#packed-state)

### Signature Handling

*  Generate signatures  
  * Support ECDSA signatures (standard for EOA wallets)  
  * Encode as bytes format (65 bytes: r \+ s \+ v)  
  * For on-chain: sign raw packedState hash  
  * For off-chain RPC: sign EIP-712 typed data structures  
  * Reference: [Signature Standards](https://docs.yellow.org/docs/protocol/protocol-reference#signature-standards)  
*  Verify signatures  
  * Recover signer address from signature  
  * Validate signer matches expected participant  
  * Support EIP-1271 for smart contract wallets  
  * Support EIP-6492 for counterfactual contracts  
  * Handle EIP-191 for personal signatures where applicable

Signature Standards

On-chain signatures use raw packedState hash for chain-agnostic compatibility. Off-chain RPC messages use EIP-712 typed data for user-facing signatures (e.g., authentication). Refer to [Signature Standards](https://docs.yellow.org/docs/protocol/protocol-reference#signature-standards) for details.

---

## On-Chain Integration

Smart contract interactions for channel lifecycle management.

### Blockchain Connection

*  Connect to Ethereum-compatible blockchain  
  * Support multiple chains (Ethereum, Polygon, Arbitrum, Optimism, Base)  
  * Use Web3 provider (e.g., Infura, Alchemy)  
  * Handle network switching  
  * Implement retry logic for failed connections  
*  Load contract ABIs  
  * Custody Contract ABI  
  * Adjudicator contract ABI (application-specific)  
  * ERC-20 token ABI

### Channel Operations

*  Create channel (Custody.create)  
  * Verify state has intent \= INITIALIZE (1) and version \= 0  
  * Preferred: include both participant signatures to start in ACTIVE  
  * Legacy: single sig → INITIAL; wait for join() to reach ACTIVE  
  * Handle ERC-20 approvals only if depositing at creation (legacy flow)  
  * Reference: [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle#creation-phase)  
*  Monitor activation / join  
  * Subscribe to Opened and Joined events  
  * In legacy flow, ensure join() transitions INITIAL → ACTIVE  
*  Cooperative closure (Custody.close)  
  * Build state with intent \= FINALIZE (3), version \= current+1, data \= "0x"  
  * Require both participant signatures; submit single tx  
  * Confirm funds destination and allocations match expectations  
  * Reference: [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle#cooperative-closure)  
*  Dispute / challenge  
  * Persist latest fully signed state for challenge()  
  * During DISPUTE, accept newer state via checkpoint() (on-chain) if available  
  * After challenge timeout, finalize with close() using challenged state  
  * Reference: [Channel Lifecycle](https://docs.yellow.org/docs/protocol/on-chain/channel-lifecycle#challenge-phase)

### Event Listening

*  Listen to contract events  
  * Opened(channelId, channel, deposits) \- Channel created and active  
  * Challenged(channelId, state, expiration) \- Dispute started (expiration \= challenge period end)  
  * Closed(channelId, allocations) \- Channel finalized  
  * Resized(channelId) \- Channel capacity changed  
*  Process events in order  
  * Maintain event log cursor/checkpoint  
  * Handle blockchain reorganizations  
  * Implement event replay for recovery  
*  Update internal state based on events  
  * Sync channel status (INITIAL → ACTIVE → DISPUTE → FINAL)  
  * Update unified balance when channels open/close  
  * Notify users of status changes

Event Recovery

Implement event recovery for when your application restarts or loses connection. Replay events from last checkpoint to current block.

---

## Off-Chain RPC

RPC communication with clearnode.

### Connection Management

*  Establish RPC connection  
  * Connect to clearnode RPC endpoint  
  * Handle connection timeouts  
  * Implement exponential backoff for reconnection  
  * Reference: [Off-Chain Overview](https://docs.yellow.org/docs/off-chain/overview)  
*  Implement message format  
  * Compact JSON array format: \[requestId, method, params, timestamp\]  
  * Request wrapper: {req: \[...\], sig: \[...\]}  
  * Response wrapper: {res: \[...\], sig: \[...\]}  
  * Error format: {res: \[requestId, "error", {error: "message"}, timestamp\], sig: \[...\]}  
  * Reference: [Message Format](https://docs.yellow.org/docs/off-chain/message-format)  
*  Handle network outages gracefully  
  * Detect connection loss  
  * Queue pending requests  
  * Reconnect automatically  
  * Resubmit queued requests after reconnection

### Authentication

*  Implement 3-step flow (auth\_request → auth\_challenge → auth\_verify)  
  * Generate session keypair locally; never transmit the private key  
  * auth\_request: public, unsigned; send address, session\_key, allowances (optional), scope (optional, not enforced), expires\_at (required, ms)  
  * Store the exact parameters; response method is auth\_challenge with challenge\_message  
  * auth\_verify: sign EIP-712 Policy typed data with main wallet (not session key) including challenge, wallet, session\_key, expires\_at, scope, allowances; or pass jwt to reuse without signature  
  * Response returns {address, session\_key, jwt\_token, success}; use session key for all subsequent private calls  
  * Reference: [Authentication](https://docs.yellow.org/docs/off-chain/authentication)  
*  Session key management  
  * Specify allowances per asset (unrestricted if omitted); enforce spending caps on every debit  
  * Set expires\_at; re-authenticate before expiry; handle “session expired” errors  
  * Rotate/revoke session keys as needed; avoid reusing keys across applications  
*  Request signing & verification  
  * Client signs all private RPC requests with session key; validate clearnode signatures on responses  
  * Ensure canonical JSON serialization of req/res arrays before hashing/signing

### Method Implementation

*  Implement all required methods  
  * Authentication: auth\_request, auth\_verify  
  * Channel Management: create\_channel, close\_channel, resize\_channel  
  * Transfers: transfer  
  * App Sessions: create\_app\_session, submit\_app\_state, close\_app\_session  
  * Queries: get\_config, get\_assets, get\_app\_definition, get\_channels, get\_app\_sessions, get\_ledger\_balances, get\_ledger\_entries, get\_ledger\_transactions, get\_rpc\_history, get\_user\_tag, get\_session\_keys, ping  
  * Reference: [Queries](https://docs.yellow.org/docs/off-chain/queries)  
*  Handle server notifications  
  * bu (Balance Update) \- Balance changed  
  * cu (Channel Update) \- Channel status changed  
  * tr (Transfer) \- Incoming/outgoing transfer  
  * asu (App Session Update) \- App session state changed  
  * Reference: [Notifications](https://docs.yellow.org/docs/off-chain/queries#notifications)

Method Prioritization

Start with: authentication → create\_channel → transfer → get\_ledger\_balances. Add other methods as needed for your use case.

---

## State Management

Off-chain state tracking and synchronization.

### State Storage

*  Store latest signed states securely  
  * Save complete state struct (data, allocations, sigs)  
  * Include channelId and version  
  * Persist to durable storage (database, filesystem)  
  * Implement atomic updates  
*  Track state versions  
  * Maintain version counter per channel and app session  
  * Reject states with version ≤ current version  
  * Increment version for each new state  
*  Implement unified balance tracking  
  * Aggregate funds across all chains  
  * Track funds in unified account vs channel escrow vs app session accounts  
  * Update on channel open/close and transfers  
  * Reference: [Transfers](https://docs.yellow.org/docs/off-chain/transfers)  
*  Handle app session state updates  
  * Verify quorum met (sum of weights ≥ quorum)  
  * Track locked funds per session  
  * Release funds on session close  
  * Reference: [App Sessions](https://docs.yellow.org/docs/off-chain/app-sessions)

### State Validation

*  Verify signatures before accepting states  
  * Check all required signatures present  
  * Validate each signature against expected signer  
  * Ensure quorum met for app sessions  
*  Validate state transitions  
  * For channels: verify StateIntent (INITIALIZE, RESIZE, FINALIZE)  
  * For app sessions: verify quorum and allocation rules  
  * Verify version increments correctly  
  * For closure: allocations valid and complete  
*  Maintain state history  
  * Keep N most recent states per channel  
  * Useful for dispute resolution  
  * Implement pruning strategy for old states

---

## Security

Critical security practices for production deployments.

### Key Management

*  Secure key storage  
  * Never log private keys  
  * Use secure key storage (keychain, HSM, encrypted database)  
  * Implement key rotation  
  * Separate signing keys from storage keys  
*  Implement signature verification  
  * Verify all incoming signatures  
  * Validate signer matches expected participant  
  * Check signature freshness (timestamp)  
*  Never share private keys or session key private keys  
  * Session keys stay on client  
  * Never transmit private keys over network  
  * Use separate keys for different purposes

### Challenge Monitoring

*  Monitor blockchain for channel events  
  * Subscribe to all channels you participate in  
  * Alert on Challenged events  
  * Automated response to challenges  
*  Respond to challenges within challenge period  
  * Maintain latest valid state  
  * Submit newer state if challenged with old state  
  * Set alerts for challenge expiration  
*  Implement automated challenge response  
  * Detect challenges automatically  
  * Submit newer state without manual intervention  
  * Fallback to manual response if needed

### Session Key Management

*  Session key allowance enforcement  
  * Track spending per session key  
  * Reject operations exceeding allowance  
  * Alert user when approaching limit  
*  Validate spending limits client-side  
  * Check allowance before submitting operations  
  * Provide clear error messages  
  * Offer to re-authenticate with higher allowance

### Best Practices

*  Never sign two states with same version number  
  * Maintain version counter  
  * Reject duplicate versions  
  * Use atomic version increment  
*  Keep track of latest state you've signed  
  * Store all signed states  
  * Never sign older version  
  * Use for dispute resolution  
*  Set appropriate challenge periods  
  * Balance security (longer) vs UX (shorter)  
  * Consider block time and congestion  
  * Minimum: 1 hour (enforced by Custody Contract MIN\_CHALLENGE\_PERIOD)  
*  Validate all inputs thoroughly  
  * Check address formats  
  * Verify amounts are positive  
  * Validate asset symbols  
  * Sanitize user input  
*  Log all state transitions for auditing  
  * Timestamp all operations  
  * Record signatures and signers  
  * Maintain audit trail  
  * Implement log rotation

---

## Error Handling

Robust error handling for production reliability.

### RPC Errors

*  Handle error responses  
  * Error response format: {res: \[requestId, "error", {error: "descriptive message"}, timestamp\], sig: \[...\]}  
  * No numeric error codes; errors have descriptive messages only  
  * Common errors: "authentication required", "insufficient balance", "channel not found", "session expired, please re-authenticate"  
  * Always check if response method is "error"  
  * Reference: [Error Handling](https://docs.yellow.org/docs/protocol/protocol-reference#error-handling)

### Transaction Errors

*  Implement retry logic for critical operations  
  * Exponential backoff  
  * Maximum retry attempts  
  * Idempotent operations  
*  Handle gas estimation failures  
  * Provide manual gas limit option  
  * Retry with higher gas limit  
  * Alert user to potential issues  
*  Handle transaction reverts  
  * Parse revert reason  
  * Provide helpful error messages  
  * Suggest corrective actions

---

## Testing

Comprehensive testing strategy for confidence in production.

### Unit Testing

*  Test signature generation and verification  
  * Known test vectors  
  * Round-trip signing  
  * Invalid signature rejection  
*  Test identifier computation  
  * channelId determinism  
  * packedState (payload hash) consistency  
  * Known test vectors  
*  Test state validation logic  
  * Version ordering  
  * Allocation sum validation  
  * StateIntent validation (INITIALIZE, RESIZE, FINALIZE for channels)

### Integration Testing

*  Test both cooperative and challenge closure paths  
  * Cooperative close (happy path)  
  * Challenge initiation  
  * Challenge response  
  * Challenge timeout  
*  Test multi-chain operations  
  * Open channels on different chains  
  * Cross-chain transfers (via unified balance)  
  * Chain-specific edge cases  
*  Test network reconnection  
  * Simulate network interruption  
  * Verify automatic reconnection  
  * Check state synchronization

### End-to-End Testing

*  Test complete user journeys  
  * Authentication → Channel Open → Transfer → Channel Close  
  * App session creation → State updates → Closure  
  * Error scenarios and recovery  
*  Test with real clearnodes  
  * Testnet deployment  
  * Mainnet staging environment  
  * Monitor performance and errors

---

## Performance Optimization

Optimize for production workloads.

### Efficiency

*  Minimize blockchain queries  
  * Cache contract addresses  
  * Batch event queries  
  * Use multicall for multiple reads  
*  Implement connection pooling  
  * Reuse RPC connections  
  * Pool blockchain RPC connections  
  * Implement connection limits  
*  Optimize state storage  
  * Index by channelId and app\_session\_id  
  * Prune old states  
  * Compress stored states

### Monitoring

*  Implement health checks  
  * RPC connection status  
  * Blockchain connection status  
  * Event listener status  
  * Use ping method for clearnode health  
*  Monitor latency  
  * RPC request/response time  
  * Transaction confirmation time  
  * Event processing delay  
*  Track error rates  
  * Failed transactions  
  * RPC errors  
  * Signature verification failures

---

## Documentation

Documentation for maintainability.

### Code Documentation

*  Document adjudicator-specific requirements clearly  
  * State validation rules  
  * Version comparison logic  
  * Gas cost estimates  
*  Document custom state formats  
  * Application-specific data structures  
  * Serialization format  
  * Version compatibility

### User Documentation

*  Provide integration guide  
  * Setup instructions  
  * Code examples  
  * Common patterns  
*  Document error messages  
  * User-friendly descriptions  
  * Suggested actions  
  * Support contact information

---

## Deployment Checklist

Pre-production validation.

### Pre-Production

*  Audit smart contracts thoroughly before deployment  
  * Use established auditors  
  * Test on testnets first  
  * Gradual mainnet rollout  
*  Test on testnet extensively  
  * All user flows  
  * Error scenarios  
  * Performance under load  
*  Implement monitoring and alerting  
  * Error rate alerts  
  * Performance degradation alerts  
  * Challenge event alerts

### Production

*  Use appropriate challenge periods  
  * Longer for high-value channels  
  * Consider network congestion  
  * Balance security vs UX  
*  Implement proper key management  
  * Hardware security modules (HSM)  
  * Key rotation policy  
  * Backup and recovery procedures  
*  Set up incident response procedures  
  * On-call rotation  
  * Escalation procedures  
  * Communication plan

---

## Compliance Levels

### Minimal (User Client)

Essential for basic client functionality:

* Core Protocol Support ✓  
* On-Chain Integration (create, close) ✓  
* Off-Chain RPC (auth, transfer, basic queries) ✓  
* Basic Security ✓

### Standard (Production Application)

Add:

* Complete method implementation ✓  
* State Management ✓  
* Comprehensive Error Handling ✓  
* Testing ✓

### Advanced (Clearnode Implementation)

Add:

* Server-side RPC routing and authentication ✓  
* Event-driven architecture ✓  
* Unified balance management (double-entry ledger) ✓  
* App session coordination ✓  
* High availability and fault tolerance ✓

---

## Next Steps

1. Start Simple: Implement Core Protocol \+ Basic On-Chain integration  
2. Add RPC: Connect to clearnode, implement authentication and basic methods  
3. Enhance Security: Implement all security best practices  
4. Test Thoroughly: Unit, integration, and end-to-end tests  
5. Deploy Gradually: Testnet → Staging → Production

Ready to Build

Use this checklist as a guide throughout your implementation. Check off items as you complete them and refer back to detailed documentation for each section.

---

## Resources

* Communication Flows: [Communication Flows](https://docs.yellow.org/docs/protocol/communication-flows)  
* Reference: [Protocol Reference](https://docs.yellow.org/docs/protocol/protocol-reference)  
* Channel Lifecycle: [Channel Lifecycle](https://docs.yellow.org/docs/on-chain/channel-lifecycle)  
* RPC Methods: [Queries](https://docs.yellow.org/docs/off-chain/queries)  
* Example Code: [Integration Tests](https://github.com/layer-3/nitrolite/tree/main/integration)

