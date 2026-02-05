// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {ERC20} from "solmate/src/tokens/ERC20.sol";

/// @title MockERC20 - Simple ERC20 Mock for Testing
/// @notice Mintable ERC20 token for testing ShadowSwap on testnets
/// @dev Uses solmate's ERC20 for gas efficiency
contract MockERC20 is ERC20 {
    /// @notice Creates a new MockERC20 token
    /// @param _name Token name
    /// @param _symbol Token symbol  
    /// @param _decimals Token decimals
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol, _decimals) {}

    /// @notice Mints tokens to an address
    /// @param to Recipient address
    /// @param amount Amount to mint
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /// @notice Burns tokens from an address
    /// @param from Address to burn from
    /// @param amount Amount to burn
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
