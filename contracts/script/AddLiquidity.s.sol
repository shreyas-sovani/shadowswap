// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";

import {MockERC20} from "./mocks/MockERC20.sol";

/// @title AddLiquidity - Script to add liquidity to the ShadowSwap pool
/// @notice Adds liquidity to the ETH/SHADOW pool for testing
/// @dev Run: forge script script/AddLiquidity.s.sol:AddLiquidity --rpc-url $SEPOLIA_RPC_URL --broadcast
contract AddLiquidity is Script, IUnlockCallback {
    using CurrencyLibrary for Currency;

    // ============ Sepolia Deployment Addresses ============
    IPoolManager constant POOL_MANAGER = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);

    // ============ Liquidity Parameters ============
    int24 constant TICK_LOWER = -887220; // Full range lower tick (divisible by 60)
    int24 constant TICK_UPPER = 887220;  // Full range upper tick (divisible by 60)
    
    // ============ Callback State ============
    PoolKey internal _poolKey;
    uint256 internal _liquidityAmount;
    uint256 internal _amount0Max;
    uint256 internal _amount1Max;
    address internal _deployer;

    function run() external {
        // Load addresses from environment
        address hookAddress = vm.envAddress("HOOK_ADDRESS");
        address mockTokenAddress = vm.envAddress("MOCK_TOKEN_ADDRESS");
        
        // Pool configuration (must match DeployHook)
        uint24 lpFee = 3000;
        int24 tickSpacing = 60;

        // Liquidity amounts
        uint256 ethAmount = 0.1 ether;
        uint256 tokenAmount = 1000 ether; // 1000 SHADOW tokens

        console.log("========================================");
        console.log("ShadowSwap Add Liquidity Script");
        console.log("========================================");
        console.log("Hook Address:", hookAddress);
        console.log("Token Address:", mockTokenAddress);
        console.log("ETH Amount:", ethAmount);
        console.log("Token Amount:", tokenAmount);
        console.log("----------------------------------------");

        vm.startBroadcast();

        // Setup the pool key
        address token0;
        address token1;
        if (address(0) < mockTokenAddress) {
            token0 = address(0);
            token1 = mockTokenAddress;
        } else {
            token0 = mockTokenAddress;
            token1 = address(0);
        }

        _poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: lpFee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hookAddress)
        });

        // Mint mock tokens to deployer
        MockERC20 mockToken = MockERC20(mockTokenAddress);
        mockToken.mint(msg.sender, tokenAmount);
        console.log("Minted", tokenAmount, "SHADOW tokens to deployer");

        // Approve PoolManager to spend tokens
        mockToken.approve(address(POOL_MANAGER), type(uint256).max);
        console.log("Approved PoolManager for SHADOW tokens");

        // Calculate liquidity amount based on amounts
        // For simplicity, we use a fixed liquidity value
        _liquidityAmount = 1e18; // 1 unit of liquidity
        
        // Set max amounts (with slippage tolerance)
        if (token0 == address(0)) {
            _amount0Max = ethAmount;
            _amount1Max = tokenAmount;
        } else {
            _amount0Max = tokenAmount;
            _amount1Max = ethAmount;
        }
        
        _deployer = msg.sender;

        // Add liquidity through unlock callback
        console.log("Adding liquidity to pool...");
        
        // Send ETH to this contract first for the callback to use
        // The script contract will handle the settlement
        bytes memory result = POOL_MANAGER.unlock(abi.encode("addLiquidity"));
        
        BalanceDelta delta = abi.decode(result, (BalanceDelta));
        console.log("Liquidity added successfully!");
        console.log("Delta amount0:", uint256(uint128(delta.amount0() < 0 ? -delta.amount0() : delta.amount0())));
        console.log("Delta amount1:", uint256(uint128(delta.amount1() < 0 ? -delta.amount1() : delta.amount1())));

        vm.stopBroadcast();

        console.log("");
        console.log("========================================");
        console.log("LIQUIDITY ADDED SUCCESSFULLY");
        console.log("========================================");
    }

    /// @notice Callback for PoolManager.unlock
    function unlockCallback(bytes calldata) external override returns (bytes memory) {
        require(msg.sender == address(POOL_MANAGER), "Only PoolManager");

        // Modify liquidity params
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: TICK_LOWER,
            tickUpper: TICK_UPPER,
            liquidityDelta: int256(_liquidityAmount),
            salt: bytes32(0)
        });

        // Add liquidity
        (BalanceDelta delta,) = POOL_MANAGER.modifyLiquidity(_poolKey, params, "");

        // Settle the amounts owed to the pool
        int128 amount0 = delta.amount0();
        int128 amount1 = delta.amount1();

        // Settle currency0
        if (amount0 < 0) {
            uint256 amountToSettle = uint256(uint128(-amount0));
            if (_poolKey.currency0.isAddressZero()) {
                POOL_MANAGER.settle{value: amountToSettle}();
            } else {
                POOL_MANAGER.sync(_poolKey.currency0);
                MockERC20(Currency.unwrap(_poolKey.currency0)).transfer(address(POOL_MANAGER), amountToSettle);
                POOL_MANAGER.settle();
            }
        }

        // Settle currency1
        if (amount1 < 0) {
            uint256 amountToSettle = uint256(uint128(-amount1));
            if (_poolKey.currency1.isAddressZero()) {
                POOL_MANAGER.settle{value: amountToSettle}();
            } else {
                POOL_MANAGER.sync(_poolKey.currency1);
                MockERC20(Currency.unwrap(_poolKey.currency1)).transfer(address(POOL_MANAGER), amountToSettle);
                POOL_MANAGER.settle();
            }
        }

        // Take any refunds (positive delta means we receive)
        if (amount0 > 0) {
            POOL_MANAGER.take(_poolKey.currency0, _deployer, uint256(uint128(amount0)));
        }
        if (amount1 > 0) {
            POOL_MANAGER.take(_poolKey.currency1, _deployer, uint256(uint128(amount1)));
        }

        return abi.encode(delta);
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
