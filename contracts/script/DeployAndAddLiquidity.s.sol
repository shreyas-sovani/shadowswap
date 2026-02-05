// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {Script, console} from "forge-std/Script.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @title LiquidityHelper - Deployed contract to add liquidity
/// @notice This contract is deployed and then called to add liquidity
contract LiquidityHelper is IUnlockCallback {
    using CurrencyLibrary for Currency;

    IPoolManager public immutable poolManager;
    address public immutable owner;

    PoolKey internal _poolKey;
    uint256 internal _liquidity;
    address internal _recipient;

    constructor(IPoolManager _manager) {
        poolManager = _manager;
        owner = msg.sender;
    }

    function addLiquidity(
        PoolKey calldata poolKey,
        int24 tickLower,
        int24 tickUpper,
        uint256 liquidity
    ) external payable {
        require(msg.sender == owner, "Only owner");
        
        _poolKey = poolKey;
        _liquidity = liquidity;
        _recipient = msg.sender;

        // Approve tokens to PoolManager
        if (!poolKey.currency0.isAddressZero()) {
            IERC20(Currency.unwrap(poolKey.currency0)).approve(address(poolManager), type(uint256).max);
        }
        if (!poolKey.currency1.isAddressZero()) {
            IERC20(Currency.unwrap(poolKey.currency1)).approve(address(poolManager), type(uint256).max);
        }

        // Store tick range in transient (using simple approach - full range)
        bytes memory data = abi.encode(tickLower, tickUpper);
        poolManager.unlock(data);
    }

    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        require(msg.sender == address(poolManager), "Only PoolManager");

        (int24 tickLower, int24 tickUpper) = abi.decode(data, (int24, int24));

        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: tickLower,
            tickUpper: tickUpper,
            liquidityDelta: int256(_liquidity),
            salt: bytes32(0)
        });

        (BalanceDelta delta,) = poolManager.modifyLiquidity(_poolKey, params, "");

        // Settle amounts
        int128 amount0 = delta.amount0();
        int128 amount1 = delta.amount1();

        if (amount0 < 0) {
            uint256 amt = uint256(uint128(-amount0));
            if (_poolKey.currency0.isAddressZero()) {
                poolManager.settle{value: amt}();
            } else {
                poolManager.sync(_poolKey.currency0);
                IERC20(Currency.unwrap(_poolKey.currency0)).transfer(address(poolManager), amt);
                poolManager.settle();
            }
        }

        if (amount1 < 0) {
            uint256 amt = uint256(uint128(-amount1));
            if (_poolKey.currency1.isAddressZero()) {
                poolManager.settle{value: amt}();
            } else {
                poolManager.sync(_poolKey.currency1);
                IERC20(Currency.unwrap(_poolKey.currency1)).transfer(address(poolManager), amt);
                poolManager.settle();
            }
        }

        return abi.encode(delta);
    }

    receive() external payable {}
}

/// @title DeployAndAddLiquidity - Deploy helper and add liquidity
contract DeployAndAddLiquidity is Script {
    IPoolManager constant POOL_MANAGER = IPoolManager(0xE03A1074c86CFeDd5C142C4F04F1a1536e203543);
    
    // Pool configuration - UPDATE THESE AFTER DEPLOYMENT
    address constant HOOK = 0xE0dc953A2136a4cb6A9EEB3cbD44296969D14080;
    address constant MOCK_TOKEN = 0xf4442339bA89BC5DA1Cf2304Af163D1b82CF0751;
    
    int24 constant TICK_LOWER = -887220;
    int24 constant TICK_UPPER = 887220;
    uint256 constant LIQUIDITY = 1e15; // Smaller liquidity amount

    function run() external {
        vm.startBroadcast();

        // Deploy LiquidityHelper
        LiquidityHelper helper = new LiquidityHelper(POOL_MANAGER);
        console.log("LiquidityHelper deployed at:", address(helper));

        // Setup pool key
        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(MOCK_TOKEN),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(HOOK)
        });

        // Mint tokens to ourselves and transfer to helper
        IERC20(MOCK_TOKEN).transfer(address(helper), 10 ether);
        console.log("Transferred 10 SHADOW to helper");

        // Send ETH to helper
        (bool success,) = address(helper).call{value: 0.01 ether}("");
        require(success, "ETH transfer failed");
        console.log("Transferred 0.01 ETH to helper");

        // Add liquidity
        helper.addLiquidity(poolKey, TICK_LOWER, TICK_UPPER, LIQUIDITY);
        console.log("Liquidity added!");

        vm.stopBroadcast();
    }
}
