// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";

import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

import {ShadowHook} from "../src/ShadowHook.sol";
import {ShadowRouter} from "../src/ShadowRouter.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

/// @title DeployAll - Master Deployment Script for ShadowSwap
/// @notice Deploys all contracts: ShadowHook, MockToken, ShadowRouter, initializes pool, and adds liquidity
/// @dev Run: forge script script/DeployAll.s.sol:DeployAll --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
contract DeployAll is Script, IUnlockCallback {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // ============ Sepolia Deployment Addresses ============
    IPoolManager constant POOL_MANAGER = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    address constant CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;

    // ============ Pool Configuration ============
    uint24 constant LP_FEE = 3000;
    int24 constant TICK_SPACING = 60;
    
    // Price: 1 ETH = 1000 SHADOW
    // sqrtPriceX96 = sqrt(1000) * 2^96 = 31.622... * 2^96
    // = 2505414483750479311864222358937
    uint160 constant SQRT_PRICE_1000 = 2505414483750479311864222358937;

    // ============ Liquidity Configuration ============
    int24 constant TICK_LOWER = -887220; // Full range (divisible by 60)
    int24 constant TICK_UPPER = 887220;
    uint256 constant INITIAL_LIQUIDITY = 1e18;
    uint256 constant ETH_LIQUIDITY = 0.1 ether;
    uint256 constant TOKEN_LIQUIDITY = 1000 ether;

    // ============ Deployment Results ============
    ShadowHook public hook;
    ShadowRouter public router;
    MockERC20 public mockToken;
    PoolKey public poolKey;
    bytes32 public poolId;

    // ============ Callback State ============
    PoolKey internal _callbackPoolKey;
    address internal _deployer;

    function run() external {
        // Load solver address from environment
        address solver = vm.envAddress("SOLVER_ADDRESS");
        require(solver != address(0), "SOLVER_ADDRESS env variable not set");

        console.log("========================================");
        console.log("ShadowSwap Master Deployment Script");
        console.log("========================================");
        console.log("Network: Sepolia");
        console.log("PoolManager:", address(POOL_MANAGER));
        console.log("Solver Address:", solver);
        console.log("----------------------------------------");

        vm.startBroadcast();
        
        _deployer = msg.sender;

        // ========== Step 1: Deploy Mock Token ==========
        mockToken = new MockERC20("ShadowSwap Test Token", "SHADOW", 18);
        console.log("[1/6] Mock Token deployed at:", address(mockToken));

        // ========== Step 2: Predict ShadowRouter address ==========
        // We need to know the Router address before deploying the Hook
        // because the Hook checks if sender == solver (which will be the Router)
        bytes32 routerSalt = keccak256("ShadowRouter_v1");
        bytes memory routerCreationCode = type(ShadowRouter).creationCode;
        bytes memory routerConstructorArgs = abi.encode(POOL_MANAGER, solver);
        bytes32 routerInitCodeHash = keccak256(abi.encodePacked(routerCreationCode, routerConstructorArgs));
        
        address predictedRouterAddress = address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            CREATE2_DEPLOYER,
            routerSalt,
            routerInitCodeHash
        )))));
        
        console.log("[2/6] Predicted Router address:", predictedRouterAddress);

        // ========== Step 3: Mine salt and deploy ShadowHook ==========
        // The Hook's solver is set to the ROUTER address (not the backend wallet)
        // This allows the Router to execute swaps through the protected pool
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG);
        
        bytes memory creationCode = type(ShadowHook).creationCode;
        bytes memory constructorArgs = abi.encode(POOL_MANAGER, predictedRouterAddress);

        (address predictedHookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        hook = new ShadowHook{salt: salt}(POOL_MANAGER, predictedRouterAddress);
        require(address(hook) == predictedHookAddress, "Hook address mismatch!");
        console.log("[3/6] ShadowHook deployed at:", address(hook));
        console.log("  Hook solver (Router):", hook.solver());

        // ========== Step 4: Deploy ShadowRouter at predicted address ==========
        router = new ShadowRouter{salt: routerSalt}(POOL_MANAGER, solver);
        require(address(router) == predictedRouterAddress, "Router address mismatch!");
        console.log("[4/6] ShadowRouter deployed at:", address(router));
        console.log("  Router solver (Backend):", router.solver());

        // ========== Step 5: Setup Pool Key ==========
        address token0;
        address token1;
        
        if (address(0) < address(mockToken)) {
            token0 = address(0);
            token1 = address(mockToken);
        } else {
            token0 = address(mockToken);
            token1 = address(0);
        }

        poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LP_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });

        poolId = PoolId.unwrap(poolKey.toId());
        console.log("  Currency1:", token1);

        // ========== Step 6: Initialize Pool ==========
        int24 initialTick = POOL_MANAGER.initialize(poolKey, SQRT_PRICE_1000);
        console.log("[6/6] Pool initialized at tick:", initialTick);

        // Mint tokens to deployer for liquidity
        mockToken.mint(msg.sender, TOKEN_LIQUIDITY);
        console.log("Minted SHADOW tokens to deployer:", TOKEN_LIQUIDITY);
        console.log("");
        console.log("NOTE: Run DeployAndAddLiquidity.s.sol to add liquidity");

        vm.stopBroadcast();

        // ========== Output Summary ==========
        console.log("");
        console.log("========================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("========================================");
        console.log("");
        console.log("Contract Addresses:");
        console.log("  ShadowHook:", address(hook));
        console.log("  ShadowRouter:", address(router));
        console.log("  MockToken (SHADOW):", address(mockToken));
        console.log("");
        console.log("Pool Configuration:");
        console.log("  Pool ID:", vm.toString(poolId));
        console.log("  Currency0:", token0);
        console.log("  Currency1:", token1);
        console.log("  Fee:", LP_FEE);
        console.log("  Tick Spacing:", TICK_SPACING);
        console.log("");

        // ========== Write Config to Frontend ==========
        _writeConfig(token0, token1, solver);
    }

    /// @notice Callback for PoolManager.unlock - adds liquidity
    function unlockCallback(bytes calldata) external override returns (bytes memory) {
        require(msg.sender == address(POOL_MANAGER), "Only PoolManager");

        // Modify liquidity params for full range
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: TICK_LOWER,
            tickUpper: TICK_UPPER,
            liquidityDelta: int256(INITIAL_LIQUIDITY),
            salt: bytes32(0)
        });

        // Add liquidity
        (BalanceDelta delta,) = POOL_MANAGER.modifyLiquidity(_callbackPoolKey, params, "");

        // Settle the amounts owed to the pool
        int128 amount0 = delta.amount0();
        int128 amount1 = delta.amount1();

        // Settle currency0 (if we owe - negative delta)
        if (amount0 < 0) {
            uint256 amountToSettle = uint256(uint128(-amount0));
            if (_callbackPoolKey.currency0.isAddressZero()) {
                POOL_MANAGER.settle{value: amountToSettle}();
            } else {
                POOL_MANAGER.sync(_callbackPoolKey.currency0);
                MockERC20(Currency.unwrap(_callbackPoolKey.currency0)).transfer(address(POOL_MANAGER), amountToSettle);
                POOL_MANAGER.settle();
            }
        }

        // Settle currency1 (if we owe - negative delta)
        if (amount1 < 0) {
            uint256 amountToSettle = uint256(uint128(-amount1));
            if (_callbackPoolKey.currency1.isAddressZero()) {
                POOL_MANAGER.settle{value: amountToSettle}();
            } else {
                POOL_MANAGER.sync(_callbackPoolKey.currency1);
                MockERC20(Currency.unwrap(_callbackPoolKey.currency1)).transfer(address(POOL_MANAGER), amountToSettle);
                POOL_MANAGER.settle();
            }
        }

        // Take any refunds (positive delta)
        if (amount0 > 0) {
            POOL_MANAGER.take(_callbackPoolKey.currency0, _deployer, uint256(uint128(amount0)));
        }
        if (amount1 > 0) {
            POOL_MANAGER.take(_callbackPoolKey.currency1, _deployer, uint256(uint128(amount1)));
        }

        return abi.encode(delta);
    }

    /// @dev Writes deployment config to frontend/src/config.json
    function _writeConfig(address token0, address token1, address solver) internal {
        // Build JSON in parts to avoid stack-too-deep
        string memory part1 = string.concat(
            '{\n',
            '  "hookAddress": "', vm.toString(address(hook)), '",\n',
            '  "routerAddress": "', vm.toString(address(router)), '",\n',
            '  "mockTokenAddress": "', vm.toString(address(mockToken)), '",\n'
        );
        
        string memory part2 = string.concat(
            '  "solverAddress": "', vm.toString(solver), '",\n',
            '  "poolManagerAddress": "', vm.toString(address(POOL_MANAGER)), '",\n'
        );
        
        string memory part3 = string.concat(
            '  "poolKey": {\n',
            '    "currency0": "', vm.toString(token0), '",\n',
            '    "currency1": "', vm.toString(token1), '",\n',
            '    "fee": ', vm.toString(LP_FEE), ',\n',
            '    "tickSpacing": ', vm.toString(int256(TICK_SPACING)), '\n',
            '  }\n',
            '}'
        );
        
        string memory json = string.concat(part1, part2, part3);
        vm.writeFile("../frontend/src/config.json", json);
        console.log("Config written to ../frontend/src/config.json");
    }

    /// @notice Allow contract to receive ETH for liquidity provision
    receive() external payable {}
}
