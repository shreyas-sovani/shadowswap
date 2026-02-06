// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract MockENSResolver {
    mapping(bytes32 => mapping(string => string)) private texts;

    event TextChanged(bytes32 indexed node, string indexed key, string keyAsString, string value);

    /**
     * @notice Sets the text data associated with an ENS node and key.
     * @param node The ENS node to set text for.
     * @param key The key to set the text for.
     * @param value The text data to set.
     */
    function setText(bytes32 node, string calldata key, string calldata value) external {
        texts[node][key] = value;
        emit TextChanged(node, key, key, value);
    }

    /**
     * @notice Returns the text data associated with an ENS node and key.
     * @param node The ENS node to query.
     * @param key The key to query.
     * @return The associated text data.
     */
    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return texts[node][key];
    }
}
