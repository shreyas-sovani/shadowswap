// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";

import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/// @title ShadowHook - MEV-resistant Uniswap v4 Hook for ShadowSwap
/// @notice This hook restricts swaps to only be executed by the whitelisted Solver (backend)
/// @dev Implements beforeSwap to enforce solver-only access, protecting users from MEV attacks
contract ShadowHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    // ============ Errors ============

    /// @notice Thrown when a non-solver address attempts to execute a swap
    error OnlySolver();

    // ============ Events ============

    /// @notice Emitted when a private trade is successfully settled through the hook
    /// @param key The pool key identifier (keccak256 hash of pool parameters)
    /// @param amountSpecified The amount specified in the swap (negative for exact input, positive for exact output)
    event PrivateTradeSettled(bytes32 indexed key, int256 amountSpecified);

    // ============ State Variables ============

    /// @notice The whitelisted solver address that is allowed to execute swaps
    /// @dev Set immutably in the constructor - this is the ShadowSwap backend address
    address public immutable solver;

    // ============ Constructor ============

    /// @notice Initializes the ShadowHook with the pool manager and solver address
    /// @param _poolManager The Uniswap v4 PoolManager contract
    /// @param _solver The whitelisted solver address (ShadowSwap backend)
    constructor(IPoolManager _poolManager, address _solver) BaseHook(_poolManager) {
        require(_solver != address(0), "Invalid solver address");
        solver = _solver;
    }

    // ============ Hook Permissions ============

    /// @notice Returns the permissions for this hook
    /// @dev Only beforeSwap is enabled - this hook validates swap callers before execution
    /// @return Hooks.Permissions struct with only beforeSwap set to true
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true, // Only this is enabled - validates solver access
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ============ Hook Implementation ============

    /// @notice Called before every swap - enforces solver-only access
    /// @dev Reverts if the sender is not the whitelisted solver
    /// @param sender The address initiating the swap through the PoolManager
    /// @param key The pool key identifying the pool being swapped in
    /// @param params The swap parameters including amountSpecified
    /// @return selector The function selector to signal successful validation
    /// @return delta Zero delta (no custom accounting)
    /// @return lpFeeOverride Zero (no fee override)
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata /* hookData */
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Only the solver can execute swaps - this protects against MEV
        if (sender != solver) {
            revert OnlySolver();
        }

        // Emit event for off-chain tracking and transparency
        emit PrivateTradeSettled(PoolId.unwrap(key.toId()), params.amountSpecified);

        // Return success - no delta modifications, no fee override
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
