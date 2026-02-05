// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

import {ShadowHook} from "../src/ShadowHook.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @title DeployHook - Deployment Script for ShadowSwap Hook
/// @notice Deploys ShadowHook with mined salt for correct hook flags, and optionally initializes a pool
/// @dev Run on Sepolia: forge script script/DeployHook.s.sol:DeployHook --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
contract DeployHook is Script {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // ============ Sepolia Deployment Addresses ============
    // Source: https://docs.uniswap.org/contracts/v4/deployments
    
    /// @notice Uniswap v4 PoolManager on Sepolia
    IPoolManager constant POOL_MANAGER = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    
    /// @notice CREATE2 Deployer Proxy (standard address used by forge script)
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    // ============ Pool Configuration ============
    
    /// @notice Pool fee: 0.30% (3000 basis points)
    uint24 constant LP_FEE = 3000;
    
    /// @notice Tick spacing for the pool
    int24 constant TICK_SPACING = 60;
    
    /// @notice Initial sqrt price for 1:1 ratio (sqrt(1) * 2^96)
    uint160 constant SQRT_PRICE_1_1 = 79228162514264337593543950336;

    // ============ Deployment Results ============
    
    ShadowHook public hook;
    MockERC20 public mockToken;
    PoolKey public poolKey;
    bytes32 public poolId;

    function run() external {
        // Load solver address from environment variable
        address solver = vm.envAddress("SOLVER_ADDRESS");
        require(solver != address(0), "SOLVER_ADDRESS env variable not set");

        console.log("========================================");
        console.log("ShadowSwap Hook Deployment Script");
        console.log("========================================");
        console.log("Network: Sepolia");
        console.log("PoolManager:", address(POOL_MANAGER));
        console.log("Solver Address:", solver);
        console.log("----------------------------------------");

        vm.startBroadcast();

        // Step 1: Deploy Mock Token (for testing)
        // In production, you would use existing token addresses
        mockToken = new MockERC20("ShadowSwap Test Token", "SHADOW", 18);
        console.log("Mock Token deployed at:", address(mockToken));

        // Step 2: Mine salt for hook address with correct flags
        // ShadowHook only uses beforeSwap flag (bit 7 = 0x80)
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);
        
        console.log("Mining salt for hook flags:", flags);
        console.log("Required flag pattern: BEFORE_SWAP_FLAG (bit 7)");

        // Get the creation code with constructor args
        bytes memory creationCode = type(ShadowHook).creationCode;
        bytes memory constructorArgs = abi.encode(POOL_MANAGER, solver);

        // Mine the salt
        (address predictedHookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        console.log("Salt found:", vm.toString(salt));
        console.log("Predicted hook address:", predictedHookAddress);

        // Step 3: Deploy the hook using CREATE2 with the mined salt
        hook = new ShadowHook{salt: salt}(POOL_MANAGER, solver);
        
        require(address(hook) == predictedHookAddress, "Hook address mismatch!");
        console.log("ShadowHook deployed at:", address(hook));
        console.log("Hook solver:", hook.solver());

        // Verify the hook address has the correct flags
        uint160 hookAddressFlags = uint160(address(hook)) & Hooks.ALL_HOOK_MASK;
        console.log("Hook address flags:", hookAddressFlags);
        require(hookAddressFlags == flags, "Hook flags mismatch!");

        // Step 4: Setup currencies for pool initialization
        // Currency0 must be lower address than Currency1
        address token0;
        address token1;
        
        // Native ETH is represented as address(0)
        // Ensure proper ordering: currency0 < currency1
        if (address(0) < address(mockToken)) {
            token0 = address(0); // Native ETH
            token1 = address(mockToken);
        } else {
            token0 = address(mockToken);
            token1 = address(0); // Native ETH
        }

        console.log("----------------------------------------");
        console.log("Pool Configuration:");
        console.log("Currency0:", token0);
        console.log("Currency1:", token1);
        console.log("Fee:", LP_FEE);
        console.log("Tick Spacing:", TICK_SPACING);

        // Step 5: Create the PoolKey
        poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LP_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });

        poolId = PoolId.unwrap(poolKey.toId());

        // Step 6: Initialize the pool
        int24 initialTick = POOL_MANAGER.initialize(poolKey, SQRT_PRICE_1_1);
        console.log("Pool initialized at tick:", initialTick);

        vm.stopBroadcast();

        // Output summary for backend configuration
        console.log("");
        console.log("========================================");
        console.log("DEPLOYMENT COMPLETE - BACKEND CONFIG");
        console.log("========================================");
        console.log("");
        console.log("// Add to your .env or backend config:");
        console.log("HOOK_ADDRESS=", address(hook));
        console.log("MOCK_TOKEN_ADDRESS=", address(mockToken));
        console.log("POOL_MANAGER_ADDRESS=", address(POOL_MANAGER));
        console.log("");
        console.log("// Pool Key for backend:");
        console.log("POOL_KEY_CURRENCY0=", token0);
        console.log("POOL_KEY_CURRENCY1=", token1);
        console.log("POOL_KEY_FEE=", LP_FEE);
        console.log("POOL_KEY_TICK_SPACING=", TICK_SPACING);
        console.log("POOL_KEY_HOOKS=", address(hook));
        console.log("");
        console.log("// Pool ID (keccak256 of PoolKey):");
        console.log("POOL_ID=", vm.toString(poolId));
        console.log("========================================");
    }
}
