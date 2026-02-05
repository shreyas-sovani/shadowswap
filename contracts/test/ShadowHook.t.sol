// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {CurrencyLibrary, Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {PoolSwapTest} from "@uniswap/v4-core/src/test/PoolSwapTest.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {Deployers} from "@uniswap/v4-core/test/utils/Deployers.sol";

import {ShadowHook} from "../src/ShadowHook.sol";

/// @title ShadowHook Tests
/// @notice Comprehensive tests for the ShadowHook MEV-resistant swap hook
contract ShadowHookTest is Test, Deployers {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using StateLibrary for IPoolManager;

    // ============ State Variables ============

    ShadowHook public hook;
    PoolKey poolKey;
    PoolId poolId;

    // Test addresses
    address public solver;
    address public publicUser;
    address public anotherUser;

    // Constants for testing
    int24 public constant TICK_SPACING = 60;
    uint24 public constant LP_FEE = 3000; // 0.30%

    // ============ Events ============

    event PrivateTradeSettled(bytes32 indexed key, int256 amountSpecified);

    // ============ Setup ============

    function setUp() public {
        // Setup test addresses
        publicUser = makeAddr("publicUser");
        anotherUser = makeAddr("anotherUser");

        // Deploy v4-core contracts using Deployers helper
        deployFreshManagerAndRouters();
        deployMintAndApprove2Currencies();

        // The solver will be the swap router contract - this is the contract
        // that calls manager.swap(), and its address is what the hook sees as "sender"
        solver = address(swapRouter);

        // Deploy the hook to an address with the correct flags
        // Hook address must encode the beforeSwap flag in its address
        address hookAddress = address(
            uint160(
                Hooks.BEFORE_SWAP_FLAG
            ) ^ (0x4444 << 144) // Namespace to avoid collisions
        );

        // Deploy the hook with constructor args - solver is the swapRouter
        bytes memory constructorArgs = abi.encode(manager, solver);
        deployCodeTo("ShadowHook.sol:ShadowHook", constructorArgs, hookAddress);
        hook = ShadowHook(hookAddress);

        // Create the pool with our hook attached
        poolKey = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: LP_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(hook)
        });
        poolId = poolKey.toId();

        // Initialize the pool at 1:1 price (using constant from Deployers)
        manager.initialize(poolKey, SQRT_PRICE_1_1);

        // Add initial liquidity for testing swaps
        int24 tickLower = TickMath.minUsableTick(TICK_SPACING);
        int24 tickUpper = TickMath.maxUsableTick(TICK_SPACING);

        modifyLiquidityRouter.modifyLiquidity(
            poolKey,
            ModifyLiquidityParams({
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: 100 ether,
                salt: bytes32(0)
            }),
            ""
        );
    }

    // ============ Tests ============

    /// @notice Test that swaps through a non-whitelisted router fail
    /// @dev We deploy a second swap router that is NOT the solver to test rejection
    function test_RevertIf_PublicUser() public {
        // Deploy a new swap router that is NOT the solver
        PoolSwapTest publicSwapRouter = new PoolSwapTest(manager);
        
        // Give the user tokens and approve the new router
        deal(Currency.unwrap(currency0), publicUser, 10 ether);
        
        vm.startPrank(publicUser);
        IERC20Minimal(Currency.unwrap(currency0)).approve(address(publicSwapRouter), type(uint256).max);
        IERC20Minimal(Currency.unwrap(currency1)).approve(address(publicSwapRouter), type(uint256).max);
        vm.stopPrank();

        // Setup: Create swap parameters
        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: -1 ether, // exact input
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest.TestSettings({
            takeClaims: false,
            settleUsingBurn: false
        });

        // Act & Assert: Swap through non-solver router should revert
        vm.prank(publicUser);
        vm.expectRevert(); // Expect revert - hook reverts with OnlySolver
        publicSwapRouter.swap(poolKey, swapParams, testSettings, "");
    }

    /// @notice Test that swaps through a different non-whitelisted router also fail
    function test_RevertIf_AnotherUser() public {
        // Deploy another swap router that is NOT the solver
        PoolSwapTest anotherSwapRouter = new PoolSwapTest(manager);
        
        // Give user tokens
        deal(Currency.unwrap(currency1), anotherUser, 10 ether);
        
        vm.startPrank(anotherUser);
        IERC20Minimal(Currency.unwrap(currency0)).approve(address(anotherSwapRouter), type(uint256).max);
        IERC20Minimal(Currency.unwrap(currency1)).approve(address(anotherSwapRouter), type(uint256).max);
        vm.stopPrank();

        SwapParams memory swapParams = SwapParams({
            zeroForOne: false,
            amountSpecified: 0.5 ether, // exact output
            sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
        });

        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest.TestSettings({
            takeClaims: false,
            settleUsingBurn: false
        });

        // Another router tries to swap - should revert
        vm.prank(anotherUser);
        vm.expectRevert(); // Expect revert - hook reverts with OnlySolver
        anotherSwapRouter.swap(poolKey, swapParams, testSettings, "");
    }

    /// @notice Test that the whitelisted solver (swapRouter) can successfully execute swaps
    function test_Allow_Solver() public {
        // The solver is the swapRouter - users interact through it
        // Give a user some tokens
        address user = makeAddr("user");
        deal(Currency.unwrap(currency0), user, 10 ether);
        
        vm.startPrank(user);
        
        // Approve tokens for the solver (swapRouter)
        IERC20Minimal(Currency.unwrap(currency0)).approve(address(swapRouter), type(uint256).max);
        IERC20Minimal(Currency.unwrap(currency1)).approve(address(swapRouter), type(uint256).max);

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: -1 ether, // exact input of 1 token0
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest.TestSettings({
            takeClaims: false,
            settleUsingBurn: false
        });

        // Record balance before
        uint256 balanceBefore = IERC20Minimal(Currency.unwrap(currency1)).balanceOf(user);

        // Expect the PrivateTradeSettled event to be emitted
        vm.expectEmit(true, false, false, true);
        emit PrivateTradeSettled(PoolId.unwrap(poolId), -1 ether);

        // Swap through the solver (swapRouter) should succeed
        BalanceDelta delta = swapRouter.swap(poolKey, swapParams, testSettings, "");

        vm.stopPrank();

        // Verify swap was executed - user should have received some token1
        uint256 balanceAfter = IERC20Minimal(Currency.unwrap(currency1)).balanceOf(user);
        assertGt(balanceAfter, balanceBefore, "User should have received tokens from swap");

        // Verify delta is non-zero (swap actually happened)
        assertTrue(delta.amount0() != 0 || delta.amount1() != 0, "Swap should have non-zero delta");
    }

    /// @notice Test that the hook returns correct permissions
    function test_HookPermissions() public view {
        Hooks.Permissions memory permissions = hook.getHookPermissions();

        // Only beforeSwap should be true
        assertTrue(permissions.beforeSwap, "beforeSwap should be enabled");
        
        // All others should be false
        assertFalse(permissions.beforeInitialize, "beforeInitialize should be disabled");
        assertFalse(permissions.afterInitialize, "afterInitialize should be disabled");
        assertFalse(permissions.beforeAddLiquidity, "beforeAddLiquidity should be disabled");
        assertFalse(permissions.afterAddLiquidity, "afterAddLiquidity should be disabled");
        assertFalse(permissions.beforeRemoveLiquidity, "beforeRemoveLiquidity should be disabled");
        assertFalse(permissions.afterRemoveLiquidity, "afterRemoveLiquidity should be disabled");
        assertFalse(permissions.afterSwap, "afterSwap should be disabled");
        assertFalse(permissions.beforeDonate, "beforeDonate should be disabled");
        assertFalse(permissions.afterDonate, "afterDonate should be disabled");
        assertFalse(permissions.beforeSwapReturnDelta, "beforeSwapReturnDelta should be disabled");
        assertFalse(permissions.afterSwapReturnDelta, "afterSwapReturnDelta should be disabled");
        assertFalse(permissions.afterAddLiquidityReturnDelta, "afterAddLiquidityReturnDelta should be disabled");
        assertFalse(permissions.afterRemoveLiquidityReturnDelta, "afterRemoveLiquidityReturnDelta should be disabled");
    }

    /// @notice Test that solver address is correctly set
    function test_SolverAddress() public view {
        assertEq(hook.solver(), solver, "Solver address should match");
    }

    /// @notice Test that pool manager is correctly set
    function test_PoolManager() public view {
        assertEq(address(hook.poolManager()), address(manager), "Pool manager should match");
    }

    /// @notice Fuzz test: Swaps through any non-solver contract should revert
    function testFuzz_RevertIf_NotSolver(uint256 salt) public {
        // Deploy a random router using salt for different addresses
        // Skip certain salt values to avoid collisions
        vm.assume(salt > 0);
        
        // Deploy a new swap router for each fuzz run
        PoolSwapTest randomRouter = new PoolSwapTest{salt: bytes32(salt)}(manager);
        
        // Ensure it's not the solver
        vm.assume(address(randomRouter) != solver);
        
        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: -0.1 ether,
            sqrtPriceLimitX96: TickMath.MIN_SQRT_PRICE + 1
        });

        PoolSwapTest.TestSettings memory testSettings = PoolSwapTest.TestSettings({
            takeClaims: false,
            settleUsingBurn: false
        });

        vm.expectRevert();
        randomRouter.swap(poolKey, swapParams, testSettings, "");
    }
}

/// @notice Minimal ERC20 interface for testing
interface IERC20Minimal {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}
