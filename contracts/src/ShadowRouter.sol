// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

/// @title ShadowRouter - MEV-resistant Swap Router for ShadowSwap
/// @notice This router handles fund transfers from users and executes swaps through the PoolManager
/// @dev Only the whitelisted solver can execute matches, ensuring MEV protection
contract ShadowRouter is IUnlockCallback {
    using CurrencyLibrary for Currency;

    // ============ Errors ============

    /// @notice Thrown when a non-solver address attempts to execute a match
    error OnlySolver();

    /// @notice Thrown when the callback is called by an address other than the PoolManager
    error OnlyPoolManager();

    /// @notice Thrown when ETH transfer fails
    error ETHTransferFailed();

    // ============ Events ============

    /// @notice Emitted when a match is successfully executed
    /// @param user The user whose funds were swapped
    /// @param tokenIn The input token address (address(0) for ETH)
    /// @param tokenOut The output token address (address(0) for ETH)
    /// @param amountIn The input amount
    /// @param amountOut The output amount
    event MatchExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // ============ State Variables ============

    /// @notice The whitelisted solver address that can execute matches
    address public immutable solver;

    /// @notice The Uniswap v4 PoolManager contract
    IPoolManager public immutable manager;

    // ============ Structs ============

    /// @dev Internal struct to pass data through the unlock callback
    struct SwapCallbackData {
        address user;
        PoolKey poolKey;
        bool zeroForOne;
        int256 amountSpecified;
    }

    // ============ Constructor ============

    /// @notice Initializes the ShadowRouter with the PoolManager and solver address
    /// @param _manager The Uniswap v4 PoolManager contract
    /// @param _solver The whitelisted solver address (ShadowSwap backend)
    constructor(IPoolManager _manager, address _solver) {
        require(address(_manager) != address(0), "Invalid manager");
        require(_solver != address(0), "Invalid solver");
        manager = _manager;
        solver = _solver;
    }

    // ============ Modifiers ============

    /// @notice Restricts function access to only the solver
    modifier onlySolver() {
        if (msg.sender != solver) revert OnlySolver();
        _;
    }

    // ============ External Functions ============

    /// @notice Executes a matched swap on behalf of a user
    /// @dev Only callable by the whitelisted solver
    /// @param user The user whose funds will be swapped (must have approved this contract)
    /// @param poolKey The pool key identifying the pool to swap in
    /// @param zeroForOne Direction of the swap: true for currency0 -> currency1
    /// @param amountIn The amount of input tokens to swap
    /// @return amountOut The amount of output tokens received
    function executeMatch(
        address user,
        PoolKey calldata poolKey,
        bool zeroForOne,
        uint256 amountIn
    ) external payable onlySolver returns (uint256 amountOut) {
        // Determine input and output currencies
        Currency currencyIn = zeroForOne ? poolKey.currency0 : poolKey.currency1;
        Currency currencyOut = zeroForOne ? poolKey.currency1 : poolKey.currency0;

        // Step 1: Pull funds from user (for ERC20 tokens)
        if (!currencyIn.isAddressZero()) {
            IERC20(Currency.unwrap(currencyIn)).transferFrom(user, address(this), amountIn);
        } else {
            // For native ETH, it should be sent with the transaction
            require(msg.value >= amountIn, "Insufficient ETH");
        }

        // Step 2: Execute the swap through PoolManager's unlock pattern
        SwapCallbackData memory callbackData = SwapCallbackData({
            user: user,
            poolKey: poolKey,
            zeroForOne: zeroForOne,
            amountSpecified: -int256(amountIn) // Negative for exact input
        });

        bytes memory result = manager.unlock(abi.encode(callbackData));
        BalanceDelta delta = abi.decode(result, (BalanceDelta));

        // Calculate output amount from the delta
        // For zeroForOne: amount0 is negative (input), amount1 is positive (output)
        // For oneForZero: amount1 is negative (input), amount0 is positive (output)
        int128 outputDelta = zeroForOne ? delta.amount1() : delta.amount0();
        amountOut = outputDelta > 0 ? uint256(uint128(outputDelta)) : 0;

        // Step 3: Send output tokens to user (handled in callback settle/take)

        emit MatchExecuted(
            user,
            Currency.unwrap(currencyIn),
            Currency.unwrap(currencyOut),
            amountIn,
            amountOut
        );
    }

    // ============ Callback Functions ============

    /// @notice Callback function called by PoolManager during unlock
    /// @dev Implements the IUnlockCallback interface
    /// @param data Encoded SwapCallbackData
    /// @return Encoded BalanceDelta from the swap
    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(manager)) revert OnlyPoolManager();

        SwapCallbackData memory callbackData = abi.decode(data, (SwapCallbackData));

        // Execute the swap
        SwapParams memory params = SwapParams({
            zeroForOne: callbackData.zeroForOne,
            amountSpecified: callbackData.amountSpecified,
            sqrtPriceLimitX96: callbackData.zeroForOne 
                ? TickMath.MIN_SQRT_PRICE + 1 
                : TickMath.MAX_SQRT_PRICE - 1
        });

        BalanceDelta delta = manager.swap(callbackData.poolKey, params, "");

        // Settle the input (we owe the pool)
        Currency currencyIn = callbackData.zeroForOne 
            ? callbackData.poolKey.currency0 
            : callbackData.poolKey.currency1;
        Currency currencyOut = callbackData.zeroForOne 
            ? callbackData.poolKey.currency1 
            : callbackData.poolKey.currency0;

        // Get the amounts from delta
        int128 amount0Delta = delta.amount0();
        int128 amount1Delta = delta.amount1();

        // Settle input currency (negative delta = we owe the pool)
        if (callbackData.zeroForOne) {
            // We owe currency0, receive currency1
            _settle(currencyIn, uint256(uint128(-amount0Delta)));
            _take(currencyOut, callbackData.user, uint256(uint128(amount1Delta)));
        } else {
            // We owe currency1, receive currency0
            _settle(currencyIn, uint256(uint128(-amount1Delta)));
            _take(currencyOut, callbackData.user, uint256(uint128(amount0Delta)));
        }

        return abi.encode(delta);
    }

    // ============ Internal Functions ============

    /// @dev Settle (pay) tokens to the PoolManager
    function _settle(Currency currency, uint256 amount) internal {
        if (currency.isAddressZero()) {
            // Native ETH
            manager.settle{value: amount}();
        } else {
            // ERC20: sync + transfer + settle
            manager.sync(currency);
            IERC20(Currency.unwrap(currency)).transfer(address(manager), amount);
            manager.settle();
        }
    }

    /// @dev Take (receive) tokens from the PoolManager
    function _take(Currency currency, address to, uint256 amount) internal {
        manager.take(currency, to, amount);
    }

    // ============ Receive ETH ============

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
